'use client';

export function GlobalBackground() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black">
            {/* Base Color & Noise */}
            <div className="absolute inset-0 bg-[#050505]" />
            <div className="absolute inset-0 opacity-[0.2]"
                style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}>
            </div>

            {/* Optimized Gradients (GPU Accelerated) */}
            <div className="absolute inset-0"
                style={{
                    background: `
                        radial-gradient(circle at 10% 0%, rgba(255,255,255,0.03) 0%, transparent 40%),
                        radial-gradient(circle at 90% 0%, rgba(255,255,255,0.03) 0%, transparent 40%),
                        radial-gradient(circle at 20% 20%, rgba(220,38,38,0.15) 0%, transparent 40%),
                        radial-gradient(circle at 80% 90%, rgba(220,38,38,0.15) 0%, transparent 40%),
                        radial-gradient(circle at 0% 50%, rgba(127,29,29,0.05) 0%, transparent 50%)
                    `
                }}
            />
        </div>
    );
}
