'use client';

import RoleForm from '@/components/admin/roles/RoleForm';

export default function CreateRolePage() {
    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <h1 className="text-2xl font-bold mb-6">Create New Role</h1>
            <RoleForm />
        </div>
    );
}
