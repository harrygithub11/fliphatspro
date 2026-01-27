"use client";
import React from "react";
import { LinkPreview } from "@/components/ui/link-preview";

export default function LinkPreviewDemoSecond() {
    return (
        <div className="flex justify-center items-center h-screen flex-col px-4 bg-background text-foreground">
            <div className="max-w-3xl w-full space-y-10">
                <p className="text-neutral-500 dark:text-neutral-400 text-xl md:text-3xl text-left">
                    Visit{" "}
                    <LinkPreview
                        url="https://ui.aceternity.com"
                        className="font-bold bg-clip-text text-transparent bg-gradient-to-br from-purple-500 to-pink-500"
                    >
                        Aceternity UI
                    </LinkPreview>{" "}
                    for amazing Tailwind and Framer Motion components.
                </p>

                <p className="text-neutral-500 dark:text-neutral-400 text-xl md:text-3xl text-left">
                    I listen to{" "}
                    <LinkPreview
                        url="https://www.youtube.com/watch?v=S-z6vyR89Ig&list=RDMM&index=3"
                        imageSrc="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop"
                        isStatic
                        className="font-bold text-foreground"
                    >
                        this music
                    </LinkPreview>{" "}
                    and I watch{" "}
                    <LinkPreview
                        url="/templates"
                        imageSrc="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2525&auto=format&fit=crop"
                        isStatic
                        className="font-bold text-foreground"
                    >
                        this movie
                    </LinkPreview>{" "}
                    twice a day
                </p>
            </div>

            <div className="mt-20 flex gap-4 text-sm text-neutral-400">
                <span>Hover over links to see preview</span>
            </div>
        </div>
    );
}
