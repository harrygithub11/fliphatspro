import { requirePlatformAdmin } from '@/lib/auth';
import Link from 'next/link';
import { LayoutDashboard, Users, Settings, LogOut, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React from 'react';

export default async function MasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Ensure only platform admins can access this layout
    const session = await requirePlatformAdmin();

    return (
        <div className="flex min-h-screen bg-black text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-800 flex flex-col fixed inset-y-0 left-0 bg-zinc-950">
                <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
                        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-white" />
                        </div>
                        <span>GOD MODE</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">Platform Control Center</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <NavItem href="/master/dashboard" icon={<LayoutDashboard />} label="Overview" />
                    <NavItem href="/master/tenants" icon={<Users />} label="Tenants" />
                    <NavItem href="/master/settings" icon={<Settings />} label="System Settings" />
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <form action="/api/auth/logout" method="POST">
                        <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-900">
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
        >
            {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
            <span className="text-sm font-medium">{label}</span>
        </Link>
    );
}
