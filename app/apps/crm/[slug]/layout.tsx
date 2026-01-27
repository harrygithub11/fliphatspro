import { SlugProvider } from '@/lib/slug-context';

interface SlugLayoutProps {
    children: React.ReactNode;
    params: { slug: string };
}

export default function SlugLayout({ children, params }: SlugLayoutProps) {
    return (
        <SlugProvider slug={params.slug}>
            {children}
        </SlugProvider>
    );
}
