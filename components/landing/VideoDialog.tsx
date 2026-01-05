"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Play, X } from "lucide-react";

export function VideoDialog({ videoSrc, thumbnailSrc }: { videoSrc: string, thumbnailSrc?: string }) {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className="relative w-full aspect-video rounded-3xl overflow-hidden cursor-pointer group border border-white/10 shadow-2xl bg-black">
                    {/* Thumbnail / Muted Loop Preview */}
                    <video
                        src={videoSrc}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300"
                        muted
                        loop
                        autoPlay
                        playsInline
                    />

                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

                    {/* Play Button Trigger */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 z-10">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                        <div className="absolute inset-0 rounded-full animate-ping bg-red-600 opacity-20 duration-1000" />
                    </div>

                    <div className="absolute bottom-6 left-0 right-0 text-center text-white font-bold tracking-widest uppercase text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                        Watch the Film
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[1200px] p-0 bg-black border-zinc-800 overflow-hidden rounded-xl md:rounded-2xl [&>button]:hidden">
                <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                    <DialogClose className="absolute top-3 right-3 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors backdrop-blur-sm border border-white/10">
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                    </DialogClose>
                    {isOpen && (
                        <video
                            src={videoSrc}
                            className="w-full h-full object-contain"
                            controls
                            autoPlay
                            playsInline
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
