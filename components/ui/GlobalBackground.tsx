'use client';

export function GlobalBackground() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Base Color */}
            <div className="absolute inset-0 bg-[#050505]" />

            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.2]"
                style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}>
            </div>

            {/* Top Spotlights (White/Overlay) */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px] mix-blend-overlay" />
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px] mix-blend-overlay" />

            {/* Red Ambient Glows (Distributed) */}
            <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[20%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px]" />

            {/* Extra Mid-Page Glow for long scroll */}
            <div className="absolute top-[40%] left-[-10%] w-[800px] h-[800px] bg-red-900/10 rounded-full blur-[150px]" />
        </div>
    );
}
