'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    LayoutDashboard, Users, ShoppingCart, Settings, LogOut, UserCog, FileText,
    Briefcase, Sparkles, TrendingUp, Target, Mail, ChevronLeft, ChevronRight,
    Menu, Shield, Building2, CreditCard, Bell, Sun, Moon, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/admin/NotificationBell';
import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { FlashMessageOverlay } from '@/components/admin/FlashMessageOverlay';
import { FlashMessageComposer } from '@/components/admin/FlashMessageComposer';
import { TeamChatWidget } from '@/components/admin/TeamChatWidget';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { ComposeEmailProvider } from '@/context/ComposeEmailContext';
import { ComposeModal } from '@/components/admin/email/ComposeModal';
import { TenantSwitcher } from '@/components/admin/TenantSwitcher';
import { PriorityBroadcastButton } from '@/components/admin/header/PriorityBroadcastButton';
import { cn } from '@/lib/utils';
import { title } from 'process';
import { CRMProvider } from './CRMContext';
import { SlugProvider } from '@/lib/slug-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [userInitial, setUserInitial] = useState('A');
    const [userName, setUserName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [stats, setStats] = useState({ leadsToday: 0, tasksOpen: 0, dealsWon: 0, pipelineValue: 0, activeDeals: 0 });
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [permissions, setPermissions] = useState<any>(null);
    const [features, setFeatures] = useState<Record<string, boolean>>({ crm: true, projects: true });

    // Default to dark mode for that "Premium" feel if user prefers, but matching system for now
    // Actually, user reference had manual toggle. Let's keep manual toggle.
    const [isDark, setIsDark] = useState(false);

    // Sidebar Persistence
    const [sidebarCollapsed, setSidebarCollapsed] = usePersistentState('sidebar.collapsed', false);

    // Slug-aware Routing
    const pathParts = pathname.split('/').filter(Boolean);
    const slug = pathParts.length > 0 && pathParts[0] !== 'login' && pathParts[0] !== 'api' ? pathParts[0] : '';
    const crmBasePath = slug ? '/' + pathParts.slice(1).join('/') : pathname;

    const isLoginPage = pathname === '/login' || crmBasePath === '/login';

    // Dark mode effect
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

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
                    setPermissions(data.admin.permissions || {});
                    setFeatures(data.admin.features || { crm: true, projects: true });
                } else {
                    setIsAuthenticated(false);
                    router.push('/login');
                }
            })
            .catch(() => {
                setIsAuthenticated(false);
                router.push('/login');
            });

        // Fetch quick stats
        if (!isLoginPage) {
            fetch('/api/admin/stats')
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setStats({
                            leadsToday: data.leadsToday || 0,
                            tasksOpen: data.openTasks || 0,
                            dealsWon: data.dealsWon || 0,
                            pipelineValue: data.pipelineValue || 0,
                            activeDeals: data.activeDeals || 0
                        });
                    }
                })
                .catch(err => console.error("Failed to fetch header stats:", err));
        }
    }, [pathname, isLoginPage, router]);

    const isActive = (path: string) => crmBasePath === path || crmBasePath.startsWith(path + '/');

    const getFullHref = (path: string) => {
        if (!slug || path.startsWith('http') || path === '#') return path;
        return `/${slug}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    // If loading auth state, show loading
    if (isAuthenticated === null && !isLoginPage) {
        return (
            <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="text-center">
                    <div className="w-10 h-10 border-[3px] border-[#FF5941] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    if (isLoginPage) return <>{children}</>;
    if (!isAuthenticated) return null;

    return (
        <ComposeEmailProvider>
            <SlugProvider slug={slug}>
                <CRMProvider>
                    <div className={`flex h-screen overflow-hidden w-full font-sans transition-colors duration-300 selection:bg-[#FF5941]/20 selection:text-[#FF5941] ${isDark ? 'dark' : ''}`}>
                        <div className="flex w-full bg-[#f8fafc] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">

                            {/* Desktop Sidebar */}
                            <nav
                                className={cn(
                                    "sticky top-0 h-screen shrink-0 border-r border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] hidden md:flex flex-col z-40",
                                    sidebarCollapsed ? 'w-20' : 'w-72',
                                    "shadow-[1px_0_20px_0_rgba(0,0,0,0.02)]"
                                )}
                            >
                                {/* Header / Tenant Switcher (Replaced Static Header) */}
                                <div className="p-3 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                                    <TenantSwitcher collapsed={sidebarCollapsed} />
                                </div>

                                {/* Navigation */}
                                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 custom-scrollbar">
                                    <NavOption
                                        href={getFullHref("/dashboard")}
                                        icon={LayoutDashboard}
                                        title="Command Center"
                                        selected={isActive('/dashboard')}
                                        collapsed={sidebarCollapsed}
                                    />

                                    <SectionHeader title="Workspace" collapsed={sidebarCollapsed} />

                                    <NavOption href={getFullHref("/emails")} icon={Mail} title="Email Center" selected={isActive('/emails')} collapsed={sidebarCollapsed} />
                                    <NavOption href={getFullHref("/workspace")} icon={Briefcase} title="Workspace" selected={isActive('/workspace')} collapsed={sidebarCollapsed} />
                                    <NavOption href={getFullHref("/pages")} icon={FileText} title="Landing Pages" selected={isActive('/pages')} collapsed={sidebarCollapsed} />
                                    <NavOption href={getFullHref("/orders")} icon={ShoppingCart} title="Orders & Payments" selected={isActive('/orders')} collapsed={sidebarCollapsed} notifs={stats.tasksOpen > 0 ? stats.tasksOpen : undefined} />

                                    {features.crm && (
                                        <>
                                            <NavOption href={getFullHref("/deals")} icon={Target} title="Deals Pipeline" selected={isActive('/deals')} collapsed={sidebarCollapsed} />
                                            <NavOption href={getFullHref("/companies")} icon={Building2} title="Companies" selected={isActive('/companies')} collapsed={sidebarCollapsed} />
                                            <NavOption href={getFullHref("/leads")} icon={Users} title="Leads & Customers" selected={isActive('/leads')} collapsed={sidebarCollapsed} notifs={stats.leadsToday > 0 ? stats.leadsToday : undefined} />
                                        </>
                                    )}

                                    <SectionHeader title="System" collapsed={sidebarCollapsed} />

                                    <NavOption href={getFullHref("/team")} icon={UserCog} title="Team Management" selected={isActive('/team')} collapsed={sidebarCollapsed} />
                                    <NavOption href={getFullHref("/roles")} icon={Shield} title="Roles & Permissions" selected={isActive('/roles')} collapsed={sidebarCollapsed} />
                                    <NavOption href={getFullHref("/billing")} icon={CreditCard} title="Billing & Plans" selected={isActive('/billing')} collapsed={sidebarCollapsed} />
                                    <NavOption href={getFullHref("/settings")} icon={Settings} title="Configuration" selected={isActive('/settings')} collapsed={sidebarCollapsed} />
                                    <NavOption href="#" icon={HelpCircle} title="Help & Support" selected={false} collapsed={sidebarCollapsed} />
                                </div>

                                {/* Footer Controls */}
                                <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 p-3 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                                    <button
                                        type="button"
                                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                        className={cn(
                                            "flex items-center w-full p-2.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 group relative z-50 cursor-pointer",
                                            sidebarCollapsed ? "justify-center" : "justify-between"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden pointer-events-none">
                                            <div className="grid place-content-center size-5 shrink-0">
                                                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                                            </div>
                                            <span className={cn("text-sm font-medium transition-all duration-300", sidebarCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto")}>Collapse Sidebar</span>
                                        </div>
                                    </button>

                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full mt-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 shadow-none border border-transparent z-50 cursor-pointer",
                                            sidebarCollapsed ? "justify-center px-0 aspect-square" : "justify-start"
                                        )}
                                        onClick={async () => {
                                            await fetch('/api/auth/logout', { method: 'POST' });
                                            window.location.href = '/login';
                                        }}
                                    >
                                        <LogOut className="w-5 h-5 shrink-0" />
                                        <span className={cn("ml-2.5 transition-all duration-300", sidebarCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100")}>Sign Out</span>
                                    </Button>
                                </div>
                            </nav>

                            {/* Main Content Area */}
                            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                                {/* Header */}
                                <header className="h-16 w-full flex items-center justify-between px-6 sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/60 dark:border-zinc-800/60 supports-[backdrop-filter]:bg-white/60">
                                    <div className="flex items-center gap-4">
                                        <Sheet>
                                            <SheetTrigger asChild>
                                                <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-zinc-500 hover:text-zinc-900">
                                                    <Menu className="w-5 h-5" />
                                                </Button>
                                            </SheetTrigger>
                                            <SheetContent side="left" className="p-0 w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
                                                <MobileSidebar
                                                    isActive={isActive}
                                                    getFullHref={getFullHref}
                                                    permissions={permissions}
                                                    features={features}
                                                    stats={stats}
                                                />
                                            </SheetContent>
                                        </Sheet>

                                        <div className="flex flex-col">
                                            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">
                                                {getPageTitle(crmBasePath)}
                                            </h1>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium hidden sm:block mt-1">
                                                Welcome back, <span className="text-zinc-800 dark:text-zinc-200">{userName || 'Admin'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pl-4">
                                        {/* Quick Stats (Desktop) */}
                                        <div className="hidden xl:flex items-center gap-3 mr-2 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-full border border-zinc-200 dark:border-zinc-700/50 shadow-sm">
                                                <TrendingUp className="w-3.5 h-3.5 text-[#FF5941]" />
                                                <span className="font-semibold text-sm">{stats.leadsToday}</span>
                                                <span className="text-zinc-500 text-xs font-medium">leads</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-full border border-zinc-200 dark:border-zinc-700/50 shadow-sm">
                                                <Target className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="font-semibold text-sm">₹{new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 }).format(stats.pipelineValue || 0)}</span>
                                                <span className="text-zinc-500 text-xs font-medium">pipeline</span>
                                            </div>
                                        </div>

                                        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

                                        <div className="flex items-center gap-2">
                                            <PriorityBroadcastButton />
                                            <NotificationBell />
                                            <button
                                                onClick={() => setIsDark(!isDark)}
                                                className="relative group p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
                                            >
                                                {isDark ?
                                                    <Sun className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 transition-colors" /> :
                                                    <Moon className="w-5 h-5 text-zinc-500 group-hover:text-indigo-500 transition-colors" />
                                                }
                                            </button>
                                        </div>

                                        <div className="pl-1">
                                            <Link href={getFullHref("/profile")} className="block relative group">
                                                <div className="size-9 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-[#FF5941]/30 transition-all duration-300">
                                                    {avatarUrl ? (
                                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-zinc-900 dark:bg-zinc-700 flex items-center justify-center text-white text-sm font-bold">
                                                            {userInitial}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full"></div>
                                            </Link>
                                        </div>
                                    </div>
                                </header>

                                {/* Main Scrollable Content */}
                                <main className={cn(
                                    "flex-1 scroll-smooth",
                                    crmBasePath === '/emails' ? 'overflow-hidden p-0' : 'overflow-y-auto p-6 sm:p-8',
                                    "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-100/50 via-zinc-50 to-white dark:from-zinc-900/50 dark:via-zinc-950 dark:to-black"
                                )}>
                                    <div className={cn("mx-auto transition-all duration-300 ease-in-out", crmBasePath === '/emails' ? 'max-w-none' : 'max-w-7xl')}>
                                        {children}
                                    </div>
                                </main>
                            </div>
                        </div>

                        <Toaster />
                        <FlashMessageOverlay />
                        <TeamChatWidget />
                        <ComposeModal />
                    </div>
                </CRMProvider>
            </SlugProvider>
        </ComposeEmailProvider>
    );
}

// ----------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------

function SectionHeader({ title, collapsed }: { title: string; collapsed: boolean }) {
    if (collapsed) return <div className="h-px bg-zinc-200 dark:bg-zinc-800 mx-3 my-3" />;

    return (
        <div className="px-3 py-2 mt-4 mb-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest animate-in fade-in duration-300">
            {title}
        </div>
    );
}

function NavOption({
    href,
    icon: Icon,
    title,
    selected,
    collapsed,
    notifs
}: {
    href: string;
    icon: any;
    title: string;
    selected: boolean;
    collapsed: boolean;
    notifs?: number;
}) {
    return (
        <Link
            href={href}
            title={collapsed ? title : undefined}
            className={cn(
                "relative flex items-center rounded-lg transition-all duration-200 group overflow-hidden",
                collapsed ? "justify-center size-10 mx-auto mb-1" : "h-10 px-3 w-full",
                selected
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md shadow-zinc-900/10 dark:shadow-white/5"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
        >
            <div className={cn("grid place-content-center shrink-0", collapsed ? "size-full" : "size-5")}>
                <Icon className={cn("w-[20px] h-[20px] transition-transform duration-300 group-hover:scale-110", collapsed && "w-[22px] h-[22px]")} strokeWidth={selected ? 2.5 : 2} />
            </div>

            <span className={cn(
                "ml-3 text-[14px] font-medium transition-all duration-300 whitespace-nowrap origin-left",
                collapsed ? "w-0 opacity-0 scale-90" : "w-auto opacity-100 scale-100"
            )}>
                {title}
            </span>

            {notifs && (
                <span className={cn(
                    "absolute transition-all duration-300 flex items-center justify-center rounded-full bg-[#FF5941] text-[10px] sm:text-[11px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-900",
                    collapsed ? "top-0 right-0 min-w-[16px] h-[16px] px-1 -mr-1 -mt-1 scale-90" : "right-3 min-w-[18px] h-[18px] px-1.5"
                )}>
                    {notifs}
                </span>
            )}

            {/* Selection Indicator for Collapsed Mode */}
            {selected && collapsed && (
                <div className="absolute inset-y-0 left-0 w-1 bg-[#FF5941] rounded-r-full" />
            )}
        </Link>
    );
}

function MobileSidebar({
    isActive,
    getFullHref,
    permissions,
    features,
    stats
}: {
    isActive: any,
    getFullHref: (path: string) => string,
    permissions: any,
    features: any,
    stats: any
}) {
    return (
        <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
            <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="grid size-9 place-content-center rounded-lg bg-[#FF5941]">
                        <img src="/Photos/logo.png" alt="Logo" className="w-5 h-5 object-contain invert brightness-0" />
                    </div>
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Fliphats CRM</span>
                </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50">
                <TenantSwitcher />
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <NavOption href={getFullHref("/dashboard")} icon={LayoutDashboard} title="Command Center" selected={isActive('/dashboard')} collapsed={false} />
                <NavOption href={getFullHref("/emails")} icon={Mail} title="Email Center" selected={isActive('/emails')} collapsed={false} />
                <NavOption href={getFullHref("/workspace")} icon={Briefcase} title="Workspace" selected={isActive('/workspace')} collapsed={false} />
                <NavOption href={getFullHref("/pages")} icon={FileText} title="Landing Pages" selected={isActive('/pages')} collapsed={false} />
                <NavOption href={getFullHref("/orders")} icon={ShoppingCart} title="Orders" selected={isActive('/orders')} collapsed={false} />

                <div className="py-4">
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                </div>

                {features.crm && (
                    <>
                        <NavOption href={getFullHref("/deals")} icon={Target} title="Deals Pipeline" selected={isActive('/deals')} collapsed={false} />
                        <NavOption href={getFullHref("/leads")} icon={Users} title="Leads & Customers" selected={isActive('/leads')} collapsed={false} notifs={stats.leadsToday || 0} />
                    </>
                )}

                <div className="py-4">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">System</div>
                </div>

                <NavOption href={getFullHref("/settings")} icon={Settings} title="Settings" selected={isActive('/settings')} collapsed={false} />
            </nav>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                <Button
                    variant="ghost"
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 justify-start"
                    onClick={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        window.location.href = '/login';
                    }}
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span className="font-bold">Sign Out</span>
                </Button>
            </div>
        </div>
    );
}

function getPageTitle(pathname: string): string {
    const titles: Record<string, string> = {
        '/dashboard': 'Dashboard',
        '/emails': 'Email Center',
        '/workspace': 'Workspace',
        '/pages': 'Landing Pages',
        '/orders': 'Orders',
        '/deals': 'Pipeline',
        '/companies': 'Companies',
        '/leads': 'Leads',
        '/team': 'Team',
        '/roles': 'Roles',
        '/billing': 'Billing',
        '/settings': 'Settings',
        '/profile': 'Profile',
    };

    for (const [path, title] of Object.entries(titles)) {
        if (pathname.startsWith(path)) return title;
    }
    return '';
}
