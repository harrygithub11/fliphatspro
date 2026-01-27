'use client';

import { Building2, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NoTenantPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 mb-6">
                    <Building2 className="h-10 w-10 text-orange-400" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-white mb-3">
                    No Workspace Access
                </h1>

                {/* Description */}
                <p className="text-gray-400 mb-8 leading-relaxed">
                    You haven't been added to any workspace yet.
                    Please contact your administrator to get an invitation,
                    or create a new workspace to get started.
                </p>

                {/* Actions */}
                <div className="space-y-3">
                    <Link
                        href="/tenants/create"
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                    >
                        <Building2 className="h-5 w-5" />
                        Create New Workspace
                    </Link>

                    <Link
                        href="mailto:support@example.com"
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl border border-gray-600 text-gray-300 font-medium hover:bg-gray-800 hover:border-gray-500 transition-all duration-200"
                    >
                        <Mail className="h-5 w-5" />
                        Contact Support
                    </Link>
                </div>

                {/* Back to Login */}
                <div className="mt-8 pt-6 border-t border-gray-700/50">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
