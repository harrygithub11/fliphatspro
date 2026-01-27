'use client';

import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search, Phone, Mail, Calendar, RefreshCw } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Booking {
    id: string;
    name: string;
    email: string;
    phone: string;
    store?: string;
    submittedAt: string;
    status: string;
    source?: string;
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/bookings');
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const filteredBookings = bookings.filter(b =>
        b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.phone?.includes(searchTerm)
    );

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
                    <p className="text-muted-foreground">Manage Strategy Call inquiries.</p>
                </div>
                <Button onClick={fetchBookings} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email or phone..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Store Detail</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">Loading bookings...</TableCell>
                                    </TableRow>
                                ) : filteredBookings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                            No bookings found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredBookings.map((booking) => (
                                        <TableRow key={booking.id} className="hover:bg-muted/50">
                                            {/* ... existing cells ... */}
                                            <TableCell className="font-medium">
                                                <div className="text-base">{booking.name}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-sm">
                                                    <span className="flex items-center gap-2 text-muted-foreground">
                                                        <Mail className="h-3 w-3" /> {booking.email}
                                                    </span>
                                                    <span className="flex items-center gap-2 text-muted-foreground">
                                                        <Phone className="h-3 w-3" /> {booking.phone}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {booking.store ? (
                                                    <a href={`https://${booking.store.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                        {booking.store}
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs italic">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    booking.source === 'lifetime_12k' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        booking.source === 'newyear_5k' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50'
                                                }>
                                                    {booking.source === 'lifetime_12k' ? 'Lifetime (12k)' :
                                                        booking.source === 'newyear_5k' ? 'New Year (5k)' :
                                                            booking.source || 'Website'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(booking.submittedAt).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs opacity-50 pl-5">
                                                    {new Date(booking.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={booking.status === 'new' ? 'default' : 'secondary'}>
                                                    {booking.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <a
                                                    href={`/admin/leads/${booking.id}`}
                                                    className="text-primary hover:underline text-sm font-medium"
                                                >
                                                    View Details →
                                                </a>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
