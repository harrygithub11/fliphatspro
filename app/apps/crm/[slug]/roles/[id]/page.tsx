'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RoleForm from '@/components/admin/roles/RoleForm';
import { useToast } from '@/components/ui/use-toast';

export default function EditRolePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [role, setRole] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchRole(params.id as string);
        }
    }, [params.id]);

    const fetchRole = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/roles/${id}`);
            const data = await res.json();

            if (data.success) {
                // Ensure permissions is parsed if it came as string (though fetch handles json usually)
                if (typeof data.role.permissions === 'string') {
                    data.role.permissions = JSON.parse(data.role.permissions);
                }
                setRole(data.role);
            } else {
                toast({ title: 'Error', description: data.message, variant: 'destructive' });
                router.push('/roles');
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to fetch role details', variant: 'destructive' });
            router.push('/roles');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-muted-foreground">Loading role details...</div>;
    }

    if (!role) return null;

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Edit Role: {role.name}</h1>
                <p className="text-muted-foreground text-sm">Update permissions and settings for this role.</p>
            </div>

            <RoleForm initialData={role} isSystem={role.is_system} />
        </div>
    );
}
