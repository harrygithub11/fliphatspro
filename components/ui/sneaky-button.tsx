import React from 'react';
import { cn } from '@/lib/utils';
import { Settings } from 'lucide-react';

interface SneakyButtonProps {
    text?: string;
    onClick?: () => void;
    className?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}

export const Button06 = ({ text = "Sneaky", onClick, className, icon, disabled }: SneakyButtonProps) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-[#18181B] border border-zinc-800 shadow-sm px-6 py-2 transition-all duration-300 hover:bg-zinc-900 hover:shadow-md hover:border-red-500/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                className
            )}
        >
            {/* Background sliding effect - adjusted for dark background */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:animate-[right_1s_infinite_linear] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>

            {/* Inner Content */}
            <span className="relative flex items-center gap-2 z-10 transition-transform duration-300 group-hover:-translate-x-1">
                <span className="font-bold text-sm text-white tracking-tight" data-text={text}>
                    {text}
                </span>
                {icon ? (
                    <span className="w-3.5 h-3.5 text-white/80 transition-transform duration-500 group-hover:rotate-180 group-hover:text-white flex items-center justify-center">
                        {icon}
                    </span>
                ) : (
                    <Settings className="w-3.5 h-3.5 text-white/80 transition-transform duration-500 group-hover:rotate-180 group-hover:text-[#FF5941]" />
                )}
            </span>

            {/* Decorative Icon (Simulating the SVG arrows from the original snippet but utilizing the provided keyframe context) */}
            <span className="absolute right-2 opacity-0 transform translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 flex items-center justify-center text-[#D11A2A]">
                {/* We can use the original SVGs if desired, but for the "Account Selector" use case, a simple arrow or indicator is often cleaner. 
            However, the user asked to "convert this btn ui in this" and specifically pasted the SVGs. 
            I will include the SVGs as a decorative element appearing on hover. 
        */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 6 16"
                    className="w-2 h-4"
                >
                    <path
                        fill="white"
                        fillRule="evenodd"
                        d="M5.288 1.696A1.032 1.032 0 0 0 4.497 0H1.032C.462 0 0 .462 0 1.032v13.936C0 15.538.462 16 1.032 16h3.465c.876 0 1.354-1.024.79-1.696L1.114 9.327a2.065 2.065 0 0 1 0-2.654l4.175-4.977Z"
                        clipRule="evenodd"
                    />
                </svg>
            </span>
        </button>
    );
};
