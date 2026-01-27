'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldAlert, Lock, User, Loader2 } from 'lucide-react';

export default function MasterLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/master/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                router.push('/master/dashboard');
                router.refresh();
            } else {
                setError(data.error || 'Access Denied');
            }
        } catch (error) {
            setError('Connection error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black">
            <div className="w-full max-w-sm bg-zinc-900 p-8 rounded-2xl shadow-2xl border border-zinc-800">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-600/20">
                        <ShieldAlert className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">GOD MODE</h1>
                    <p className="text-zinc-500 text-sm mt-1">Platform Control Center Access</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                            <Input
                                placeholder="Master Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                                autoFocus
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                            <Input
                                type="password"
                                placeholder="Master Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-400 text-center font-medium bg-red-950/30 py-2 rounded border border-red-900/50">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-11 text-base font-semibold bg-red-600 hover:bg-red-700 text-white"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Authenticating...
                            </>
                        ) : (
                            'Enter Control Center'
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center text-xs text-zinc-600">
                    <p>⚠️ Authorized Personnel Only</p>
                    <p className="mt-1 text-zinc-700">All access attempts are logged</p>
                </div>
            </div>
        </div>
    );
}
