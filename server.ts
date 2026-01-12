import { createServer } from "http";
import next from "next";
import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3056", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
const prisma = new PrismaClient();

// In-memory mapping for speed
// UserId -> Set of SocketIDs
const userSockets = new Map<number, Set<string>>();

app.prepare().then(() => {
    const httpServer = createServer(handler);
    const io = new Server(httpServer);

    io.on("connection", (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // --- Events ---

        // 1. User Connects / Identifies
        socket.on("identify", async (userId: number) => {
            // Add to mapping
            if (!userSockets.has(userId)) {
                userSockets.set(userId, new Set());
            }
            userSockets.get(userId)?.add(socket.id);

            // Update DB to ONLINE immediately
            try {
                await prisma.userPresence.upsert({
                    where: { userId },
                    update: { status: "ONLINE", lastSeenAt: new Date() },
                    create: { userId, status: "ONLINE", lastSeenAt: new Date() },
                });

                // Broadcast Presence Update
                io.emit("presence_update", { userId, status: "ONLINE", lastSeenAt: new Date() });
            } catch (e) {
                console.error("Error updating presence:", e);
            }
        });

        // 2. Heartbeat (Client sends every ~20-30s)
        socket.on("heartbeat", async (userId: number) => {
            try {
                await prisma.userPresence.update({
                    where: { userId },
                    data: { lastSeenAt: new Date(), status: 'ONLINE' } // Ensure status is ONLINE on beat
                });
                // We might not want to broadcast 'presence_update' on every beat to save bandwidth, 
                // unless status changed. But let's assume UI handles "last seen" locally or polls lazily if needed? 
                // Actually, user requested "No polling". So maybe we emit "heartbeat_ack" or just silent.
                // Realtime last-seen is usually fetched on demand or via periodic status sync.
                // For now, we update DB.
            } catch (e) { }
        });

        // 3. Disconnect
        socket.on("disconnect", async () => {
            console.log(`Socket disconnected: ${socket.id}`);

            // Find which user this socket belonged to
            // Find which user this socket belonged to
            let userId: number | undefined;
            const entries = Array.from(userSockets.entries());
            for (const [uid, sockets] of entries) {
                if (sockets.has(socket.id)) {
                    userId = uid;
                    sockets.delete(socket.id);
                    if (sockets.size === 0) {
                        userSockets.delete(uid); // No more active connections for this user
                    }
                    break;
                }
            }

            // We do NOT emit offline immediately. We let the cleanup interval handle true offline.
            // Or we can check if sockets.size === 0, but browser refresh triggers close/open fast.
            // Safest is to let the "Stale Check" handle the "OFFLINE" status.
        });

        // 4. Message Events

        // A. Send Message
        socket.on('send_message', async (data) => {
            // data: { senderId, receiverId, message, type, attachmentUrl, attachmentType }
            try {
                const { senderId, receiverId, message, type, attachmentUrl, attachmentType } = data;

                // 1. Save to DB
                const newMsg = await prisma.flashMessage.create({
                    data: {
                        senderId,
                        receiverId: receiverId === -1 ? null : receiverId, // -1 for group
                        message,
                        type, // 'chat' or 'group_chat'
                        attachmentUrl,
                        attachmentType,
                        sentAt: new Date()
                    }
                });

                const apiMsg = {
                    ...newMsg,
                    // Add sender/receiver info for UI if needed, but IDs are enough usually
                };

                // 2. Emit to Receiver (if online)
                // If Group Chat (-1)
                if (receiverId === -1 || type === 'group_chat') {
                    // Broadcast to everyone except sender
                    socket.broadcast.emit('message_received', apiMsg);
                } else {
                    // 1-on-1
                    const receiverSockets = userSockets.get(receiverId);
                    if (receiverSockets) {
                        receiverSockets.forEach(sid => {
                            io.to(sid).emit('message_received', apiMsg);
                        });
                        // Optimistically mark as delivered if socket exists?
                        // Better: Wait for 'message_delivered' ack from client.
                    }
                }

                // 3. Ack back to Sender (so they see it as "Sent")
                socket.emit('message_sent_ack', apiMsg);

            } catch (e) {
                console.error("Send Message Error:", e);
                socket.emit('error', { message: "Failed to send message" });
            }
        });

        // B. Mark Delivered
        socket.on('mark_delivered', async (data) => {
            const { messageId, userId } = data; // userId is who marked it (recipient)
            try {
                // Update DB
                const updated = await prisma.flashMessage.update({
                    where: { id: messageId },
                    data: { deliveredAt: new Date() }
                });

                // Notify Sender
                const senderSockets = userSockets.get(updated.senderId);
                if (senderSockets) {
                    senderSockets.forEach(sid => {
                        io.to(sid).emit('message_status_update', {
                            id: messageId,
                            status: 'delivered',
                            deliveredAt: updated.deliveredAt
                        });
                    });
                }
            } catch (e) { }
        });

        // C. Mark Read
        socket.on('mark_read', async (data) => {
            const { messageId, userId } = data;
            try {
                await prisma.flashMessage.update({
                    where: { id: messageId },
                    data: { isRead: true, readAt: new Date() }
                });

                // Notify Sender
                const msg = await prisma.flashMessage.findUnique({ where: { id: messageId } });
                if (msg) {
                    const senderSockets = userSockets.get(msg.senderId);
                    if (senderSockets) {
                        senderSockets.forEach(sid => {
                            io.to(sid).emit('message_status_update', {
                                id: messageId,
                                status: 'read',
                                readAt: msg.readAt
                            });
                        });
                    }
                }
            } catch (e) { }
        });

    });

    // Clean-up Interval (Presence Truth)
    // Runs every 30s
    setInterval(async () => {
        const now = new Date();
        const threshold = new Date(now.getTime() - 45000); // 45s ago

        // Find users who are ONLINE but lastSeen < threshold
        try {
            const staleUsers = await prisma.userPresence.findMany({
                where: {
                    status: 'ONLINE',
                    lastSeenAt: { lt: threshold }
                }
            });

            for (const u of staleUsers) {
                await prisma.userPresence.update({
                    where: { id: u.id },
                    data: { status: 'OFFLINE' }
                });
                io.emit("presence_update", { userId: u.userId, status: "OFFLINE", lastSeenAt: u.lastSeenAt });

                // Cleanup memory just in case
                if (userSockets.has(u.userId)) {
                    userSockets.delete(u.userId);
                }
            }
        } catch (e) {
            console.error("Presence cleanup error:", e);
        }
    }, 30000);

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
