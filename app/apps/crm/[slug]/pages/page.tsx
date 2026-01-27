'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, ExternalLink, Trash2, Eye, Copy, Zap } from 'lucide-react';
import Link from 'next/link';

import { useParams } from 'next/navigation';

interface LandingPage {
    id: number;
    name: string;
    slug: string;
    is_active: number;
    page_views: number;
    conversions: number;
    created_at: string;
}

export default function AdminPagesList() {
    const params = useParams();
    const slug = params?.slug as string;
    const [pages, setPages] = useState<LandingPage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const res = await fetch('/api/admin/pages');
            const data = await res.json();
            if (Array.isArray(data)) setPages(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const deletePage = async (id: number) => {
        if (!confirm('Are you sure you want to delete this page?')) return;
        try {
            const res = await fetch(`/api/admin/pages/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setPages(pages.filter(p => p.id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const duplicatePage = async (id: number) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/pages/${id}/duplicate`, { method: 'POST' });
            if (res.ok) {
                await fetchPages(); // Refresh the list
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to duplicate page');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while duplicating the page');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Landing Pages</h1>
                    <p className="text-muted-foreground">Manager your dynamic sales pages.</p>
                </div>
                <Link href={`/${slug}/pages/create`}>
                    <Button className="bg-red-600 hover:bg-red-700">
                        <Plus className="w-4 h-4 mr-2" /> Create Next Page
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Pages</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>URL Slug</TableHead>
                                <TableHead>Stats</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">Loading...</TableCell>
                                </TableRow>
                            ) : pages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No pages found. Create your first one!</TableCell>
                                </TableRow>
                            ) : (
                                pages.map((page) => (
                                    <TableRow key={page.id}>
                                        <TableCell className="font-medium">{page.name}</TableCell>
                                        <TableCell>
                                            <code className="bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded text-xs text-muted-foreground">
                                                /sale/{page.slug}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-4 text-xs">
                                                <span className="flex items-center gap-1" title="Views">
                                                    <Eye className="w-3 h-3" /> {page.page_views}
                                                </span>
                                                <span className="flex items-center gap-1" title="Sales/Leads">
                                                    <Zap className="w-3 h-3 text-orange-500 fill-orange-500" /> {page.conversions}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {page.is_active ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">Draft</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/sale/${page.slug}`} target="_blank">
                                                    <Button variant="ghost" size="sm">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/${slug}/pages/${page.id}`}>
                                                    <Button variant="outline" size="sm">
                                                        <Edit className="w-4 h-4 mr-2" /> Edit
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => duplicatePage(page.id)}
                                                    title="Duplicate Page"
                                                >
                                                    <Copy className="w-4 h-4 mr-2" /> Duplicate
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => deletePage(page.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
