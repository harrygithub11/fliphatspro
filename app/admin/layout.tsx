'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ShoppingCart, ListTodo, Settings, LogOut, Search, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="h-screen bg-zinc-50 dark:bg-zinc-950 flex overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 hidden md:flex flex-col h-full shrink-0">
                <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    <span className="font-bold text-xl tracking-tight text-primary">FliphatMedia<span className="text-foreground">CRM</span></span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <NavItem href="/admin/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Command Center" active={isActive('/admin/dashboard')} />
                    <NavItem href="/admin/kanban" icon={<ListTodo className="w-5 h-5" />} label="Project Board" active={isActive('/admin/kanban')} />
                    <NavItem href="/admin/orders" icon={<ShoppingCart className="w-5 h-5" />} label="Orders & Payments" active={isActive('/admin/orders') || pathname.startsWith('/admin/orders/')} />
                    <NavItem href="/admin/leads" icon={<Users className="w-5 h-5" />} label="Leads & Customers" active={isActive('/admin/leads')} />
                    <NavItem href="/admin/team" icon={<UserCog className="w-5 h-5" />} label="Team Management" active={isActive('/admin/team')} />
                    <NavItem href="/admin/settings" icon={<Settings className="w-5 h-5" />} label="Configuration" active={isActive('/admin/settings')} />
                </nav>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" asChild>
                        <Link href="/admin/login">
                            <LogOut className="w-5 h-5 mr-2" />
                            Sign Out
                        </Link>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Bar */}
                <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0 z-40 bg-opacity-95 backdrop-blur-sm">
                    <div className="w-full max-w-md relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Global Search (Email, Name, Order ID)..." className="pl-10 h-10 bg-zinc-50 dark:bg-zinc-950 border-none ring-1 ring-zinc-200 dark:ring-zinc-800" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/admin/profile" className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm hover:ring-2 ring-primary/20 transition-all">
                            A
                        </Link>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground'}`}
        >
            {icon}
            {label}
        </Link>
    );
}
