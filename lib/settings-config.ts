
import { LucideIcon, Building2, Palette, Monitor } from 'lucide-react';

export type SettingStorageType = 'tenant' | 'tenant_setting';
export type SettingInputType = 'text' | 'textarea' | 'color' | 'image' | 'boolean' | 'select' | 'email';

export interface SettingField {
    key: string;
    label: string;
    description?: string;
    type: SettingInputType;
    storage: SettingStorageType;
    placeholder?: string;
    defaultValue?: any;
    options?: { label: string; value: string }[]; // For select
    validation?: {
        required?: boolean;
        pattern?: RegExp;
        minLength?: number;
    };
}

export interface SettingSection {
    id: string;
    title: string;
    description: string;
    icon?: any; // LucideIcon type issues in some builds, keeping loose
    fields: SettingField[];
}

export const WORKSPACE_SETTINGS_SCHEMA: SettingSection[] = [
    {
        id: 'general',
        title: 'General',
        description: 'Basic workspace information.',
        icon: Building2,
        fields: [
            {
                key: 'name',
                label: 'Workspace Name',
                type: 'text',
                storage: 'tenant',
                validation: { required: true, minLength: 2 },
                placeholder: 'My Company'
            },
            {
                key: 'slug',
                label: 'Workspace URL (Slug)',
                description: 'Unique identifier for your workspace URL.',
                type: 'text',
                storage: 'tenant',
                // validation: { pattern: /^[a-z0-9-]+$/ }, // Handled in API/UI
            },
            {
                key: 'domain',
                label: 'Custom Domain',
                description: 'Connect your own domain (CNAME to app.fliphats.com).',
                type: 'text',
                storage: 'tenant',
                placeholder: 'crm.yourcompany.com'
            },
            {
                key: 'support_email',
                label: 'Support Email',
                description: 'Displayed to users for help.',
                type: 'email',
                storage: 'tenant_setting',
                placeholder: 'support@company.com'
            }
        ]
    },
    {
        id: 'branding',
        title: 'Branding',
        description: 'Customize the look and feel.',
        icon: Palette,
        fields: [
            {
                key: 'logoUrl',
                label: 'Logo',
                type: 'image',
                storage: 'tenant',
                description: 'Upload your company logo (PNG, JPG). Max 2MB.'
            }
        ]
    },
    {
        id: 'features',
        title: 'Features',
        description: 'Enable or disable optional modules.',
        icon: Monitor,
        fields: [
            {
                key: 'feature_crm',
                label: 'CRM & Leads',
                type: 'boolean',
                storage: 'tenant_setting',
                defaultValue: true
            },
            {
                key: 'feature_projects',
                label: 'Project Management',
                type: 'boolean',
                storage: 'tenant_setting',
                defaultValue: true
            },
            {
                key: 'feature_helpdesk',
                label: 'Helpdesk Tickets',
                type: 'boolean',
                storage: 'tenant_setting',
                defaultValue: false
            }
        ]
    },
    {
        id: 'integrations',
        title: 'Integrations',
        description: 'Manage external services and APIs.',
        icon: Monitor, // Should be something else like Plug/Link
        fields: [
            {
                key: 'razorpay_key_id',
                label: 'Razorpay Key ID',
                type: 'text',
                storage: 'tenant_setting',
                placeholder: 'rzp_test_...'
            },
            {
                key: 'razorpay_key_secret',
                label: 'Razorpay Key Secret',
                type: 'text', // Should ideally be password/encrypted
                storage: 'tenant_setting',
                placeholder: '••••••••'
            },
            {
                key: 'facebook_pixel_id',
                label: 'Facebook Pixel ID',
                type: 'text',
                storage: 'tenant_setting',
                placeholder: '123456789...'
            },
            {
                key: 'google_analytics_id',
                label: 'Google Analytics ID',
                type: 'text',
                storage: 'tenant_setting',
                placeholder: 'G-XXXXXXXXXX'
            },
            {
                key: 'facebook_page_id',
                label: 'Facebook Page ID',
                type: 'text',
                storage: 'tenant_setting'
            },
            {
                key: 'facebook_access_token',
                label: 'Facebook Access Token',
                type: 'text',
                storage: 'tenant_setting'
            }
        ]
    }
];
