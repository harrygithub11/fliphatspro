'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, ShoppingCart, ListTodo, Settings, LogOut, UserCog, FileText, Briefcase, Sparkles, TrendingUp, Target, Mail, PanelLeft, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/admin/NotificationBell';
import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { FlashMessageOverlay } from '@/components/admin/FlashMessageOverlay';
import { FlashMessageComposer } from '@/components/admin/FlashMessageComposer';
import { TeamChatWidget } from '@/components/admin/TeamChatWidget';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [userInitial, setUserInitial] = useState('A');
    const [userName, setUserName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [stats, setStats] = useState({ leadsToday: 0, tasksOpen: 0, dealsWon: 0 });
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    // Sidebar Persistence
    const [sidebarCollapsed, setSidebarCollapsed] = usePersistentState('sidebar.collapsed', false);

    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        // Skip auth check on login page
        if (isLoginPage) {
            setIsAuthenticated(false);
            return;
        }

        // Fetch user profile to check authentication
        fetch('/api/admin/me')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.admin) {
                    setIsAuthenticated(true);
                    setUserInitial(data.admin.email[0].toUpperCase());
                    setUserName(data.admin.name || data.admin.email.split('@')[0]);
                    setAvatarUrl(data.admin.avatar_url || null);
                } else {
                    // Not authenticated, redirect to login
                    setIsAuthenticated(false);
                    router.push('/admin/login');
                }
            })
            .catch(() => {
                setIsAuthenticated(false);
                router.push('/admin/login');
            });

        // Fetch quick stats
        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStats({
                        leadsToday: data.leadsToday || 0,
                        tasksOpen: data.openTasks || 0,
                        dealsWon: data.dealsWon || 0
                    });
                }
            })
            .catch(() => { });
    }, [pathname, isLoginPage, router]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 5) return 'Late Night Hustle';
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        if (hour < 22) return 'Good Evening';
        return 'Good Night';
    };

    const getPersonalizedMessage = (stats: { leadsToday: number, tasksOpen: number }) => {
        const date = new Date();
        const hour = date.getHours();
        const day = date.getDay(); // 0 is Sunday
        const messages = [];

        // Time specific touches
        if (hour < 6) messages.push("Burning the midnight oil? Remember to get some rest soon. 🌙", "Quiet hours are the best for deep focus. 🕯️");
        else if (hour < 9) messages.push("Early bird gets the worm! Hope you had your coffee. ☕", "Ready to attack the day? Let's go! 🚀");
        else if (hour < 12) messages.push("Hope your morning is off to a productive start! ☀️", "One task at a time, you've got this. ✨");
        else if (hour < 14) messages.push("Don't forget to take a lunch break! Refuel. 🥪", "Mid-day check-in: How are you feeling? 🌿");
        else if (hour < 17) messages.push("Keep that momentum going, almost there! 💪", "Afternoon slump? A quick stretch might help! 🧘");
        else if (hour < 20) messages.push("Wrapping up a solid day? Or just getting started? 🌆", "Time to review today's wins. checkout the dashboard. 📈");
        else messages.push("Time to wind down? You've done enough for today. 💤");

        // Day specific touches
        if (day === 1) messages.push("New week, fresh goals. Make it count! 🎯", "Monday blues? Nah, Monday moves. 💼");
        if (day === 5) messages.push("It's Friday! Finish strong and enjoy the weekend. 🎉", "Almost weekend time. Push through! 🏖️");
        if (day === 0 || day === 6) messages.push("Working on the weekend? That's dedication. 💯", "Hope you're finding some balance this weekend. ⚖️");

        // Context/Stats specific
        if (stats.leadsToday > 0) messages.push(`You've already captured ${stats.leadsToday} leads today! On fire! 🔥`);
        if (stats.leadsToday > 5) messages.push("Lead machine! Save some for the rest of us! 😉");
        if (stats.tasksOpen > 8) messages.push("Lots on the plate? Just focus on the top priority first. ✅", "Breathe. You'll get through the list. One by one. 📋");
        if (stats.tasksOpen === 0) messages.push("Inbox zero? That's a beautiful sight. 🕊️", "Everything caught up! Great feeling, isn't it? ✨");

        // General emotional/personal touches
        messages.push(
            "Trust the process. Your hard work builds up. 🧱",
            "Remember, progress over perfection. 🌱",
            "You're doing better than you think. Keep going. 💖",
            "Every interaction counts. Be yourself. 😊",
            "Small wins are still wins. Celebrate them. 🏆",
            "Take a deep breath. You got this. 🍃",
            "Your energy introduces you before you even speak. ✨"
        );

        // Deterministic random based on date to keep it consistent for the session/hour mostly
        // mixed with some true randomness for variety on refresh
        return messages[Math.floor(Math.random() * messages.length)];
    };

    const [message, setMessage] = useState('');

    useEffect(() => {
        setMessage(getPersonalizedMessage(stats));
    }, [stats]);

    const isActive = (path: string) => pathname === path;

    // If loading auth state, show loading
    if (isAuthenticated === null && !isLoginPage) {
        return (
            <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // If on login page, just render the login form without sidebar/header
    if (isLoginPage) {
        return <>{children}</>;
    }

    // If not authenticated and not login page, don't render anything (redirect in progress)
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="h-screen bg-zinc-50 dark:bg-zinc-950 flex overflow-hidden">
            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 hidden md:flex flex-col h-full shrink-0 relative transition-all duration-300 ease-in-out",
                    sidebarCollapsed ? "w-20" : "w-64"
                )}
            >
                <div className="h-16 flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0 relative z-10 justify-between">
                    {!sidebarCollapsed && (
                        <span className="font-bold text-xl tracking-tight text-primary animate-in fade-in duration-300">
                            Fliphat<span className="text-foreground">CRM</span>
                        </span>
                    )}
                    {sidebarCollapsed && (
                        <span className="font-bold text-xl tracking-tight text-primary mx-auto">F<span className="text-foreground">C</span></span>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8 text-zinc-400 hover:text-foreground", sidebarCollapsed && "mx-auto mt-2 absolute -right-3 top-6 bg-white dark:bg-zinc-800 border shadow-sm rounded-full h-6 w-6 z-50")}
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    >
                        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                    </Button>
                </div>

                <nav className="flex-1 p-3 space-y-6 overflow-y-auto overflow-x-hidden relative z-10">
                    {/* Main */}
                    <div className="space-y-1">
                        <NavItem href="/admin/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Command Center" active={isActive('/admin/dashboard')} collapsed={sidebarCollapsed} />
                    </div>

                    {/* Workspace */}
                    <div className="space-y-1">
                        {!sidebarCollapsed && <h4 className="px-3 text-xs font-semibold text-muted-foreground/50 tracking-wider mb-2 mt-4 uppercase font-mono animate-in fade-in">Workspace</h4>}
                        {sidebarCollapsed && <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4 mx-2" />}

                        <NavItem href="/admin/emails" icon={<Mail className="w-5 h-5" />} label="Email Center" active={isActive('/admin/emails')} collapsed={sidebarCollapsed} />
                        <NavItem href="/admin/workspace" icon={<Briefcase className="w-5 h-5" />} label="Workspace" active={pathname.startsWith('/admin/workspace')} collapsed={sidebarCollapsed} />
                        <NavItem href="/admin/kanban" icon={<ListTodo className="w-5 h-5" />} label="Project Board" active={isActive('/admin/kanban')} collapsed={sidebarCollapsed} />
                        <NavItem href="/admin/pages" icon={<FileText className="w-5 h-5" />} label="Landing Pages" active={isActive('/admin/pages') || pathname.startsWith('/admin/pages/')} collapsed={sidebarCollapsed} />
                        <NavItem href="/admin/orders" icon={<ShoppingCart className="w-5 h-5" />} label="Orders & Payments" active={isActive('/admin/orders') || pathname.startsWith('/admin/orders/')} collapsed={sidebarCollapsed} />
                        <NavItem href="/admin/leads" icon={<Users className="w-5 h-5" />} label="Leads & Customers" active={isActive('/admin/leads')} collapsed={sidebarCollapsed} />
                    </div>

                    {/* System */}
                    <div className="space-y-1">
                        {!sidebarCollapsed && <h4 className="px-3 text-xs font-semibold text-muted-foreground/50 tracking-wider mb-2 mt-4 uppercase font-mono animate-in fade-in">System</h4>}
                        {sidebarCollapsed && <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4 mx-2" />}

                        <NavItem href="/admin/team" icon={<UserCog className="w-5 h-5" />} label="Team Management" active={isActive('/admin/team')} collapsed={sidebarCollapsed} />
                        <NavItem href="/admin/settings" icon={<Settings className="w-5 h-5" />} label="Configuration" active={isActive('/admin/settings')} collapsed={sidebarCollapsed} />
                    </div>
                </nav>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0 relative z-10">
                    <Button variant="ghost" className={cn("w-full text-red-500 hover:text-red-600 hover:bg-red-50", sidebarCollapsed ? "justify-center px-0" : "justify-start")} asChild>
                        <Link href="/admin/login">
                            <LogOut className="w-5 h-5 mr-2" />
                            {!sidebarCollapsed && <span>Sign Out</span>}
                        </Link>
                    </Button>
                </div>

                {/* Decorative Overlay Shapes */}
                <div className="absolute bottom-0 left-0 pointer-events-none z-0">
                    <div className={cn("absolute bottom-0 left-0 bg-primary/5 rounded-tr-[100%] translate-y-1/2 -translate-x-1/2", sidebarCollapsed ? "w-20 h-20" : "w-64 h-64")}></div>
                    <div className={cn("absolute bottom-0 left-0 bg-primary/10 rounded-tr-[100%] translate-y-1/3 -translate-x-1/3", sidebarCollapsed ? "w-16 h-16" : "w-48 h-48")}></div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Bar - Greeting & Performance */}
                <header className="h-20 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0 z-40">
                    {/* Left: Greeting */}
                    <div className="flex items-center gap-4">
                        <Link href="/admin/profile" className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-bold text-lg hover:ring-4 ring-primary/20 transition-all shadow-lg overflow-hidden">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                userInitial
                            )}
                        </Link>
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                {getGreeting()}, <span className="text-primary">{userName || 'Admin'}</span>
                                <Sparkles className="w-4 h-4 text-yellow-500" />
                            </h2>
                            <p className="text-xs text-muted-foreground max-w-md truncate">{message}</p>
                        </div>
                    </div>

                    {/* Right: Quick Stats */}
                    <div className="flex items-center gap-6">
                        <FlashMessageComposer />
                        <NotificationBell />
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Leads Today</p>
                            <p className="text-xl font-bold text-primary flex items-center justify-center gap-1">
                                <TrendingUp className="w-4 h-4" /> {stats.leadsToday}
                            </p>
                        </div>
                        <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Open Tasks</p>
                            <p className="text-xl font-bold text-orange-500">{stats.tasksOpen}</p>
                        </div>
                        <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Deals Won</p>
                            <p className="text-xl font-bold text-green-500 flex items-center justify-center gap-1">
                                <Target className="w-4 h-4" /> {stats.dealsWon}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {children}
                </div>
            </main>
            <Toaster />
            <FlashMessageOverlay />
            <TeamChatWidget />
        </div>
    );
}

function NavItem({ href, icon, label, active, collapsed }: { href: string; icon: React.ReactNode; label: string; active?: boolean; collapsed?: boolean }) {
    if (collapsed) {
        return (
            <Link
                href={href}
                title={label}
                className={`flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-all duration-200 ${active ? 'bg-primary text-primary-foreground shadow-md' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground'}`}
            >
                {icon}
            </Link>
        );
    }

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
