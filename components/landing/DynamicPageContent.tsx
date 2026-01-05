'use client';

import { useEffect } from 'react';
import { NewYearHero } from '@/components/landing/NewYearHero';
import { FeaturesBrowser } from '@/components/landing/FeaturesBrowser';
import { Pricing } from '@/components/landing/Pricing';
import { Testimonials } from '@/components/landing/Testimonials';
import { FAQ } from '@/components/landing/FAQ';
import { Footer } from '@/components/landing/Footer';
import { GlobalBackground } from '@/components/ui/GlobalBackground';
import { ThemeOverride } from '@/components/ui/ThemeOverride';
import { StickyCTA } from '@/components/landing/StickyCTA';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { LiveDemos } from '@/components/landing/LiveDemos';
import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { SetupProcess } from '@/components/landing/SetupProcess';
import { OrderFlow } from '@/components/landing/OrderFlow';
import { Zap } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Script from 'next/script';
import { DEFAULT_PAGE_CONTENT } from '@/lib/constants';
import { deepMerge } from '@/lib/utils';

// Helper to dynamic icon
const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    // @ts-ignore
    const Icon = LucideIcons[name || 'Zap'];
    return Icon ? <Icon className={className} /> : <LucideIcons.Zap className={className} />;
};

export function DynamicPageContent({ content: rawContent, slug }: { content: any, slug: string }) {
    const content = deepMerge(DEFAULT_PAGE_CONTENT, rawContent);

    useEffect(() => {
        // Track page view
        fetch(`/api/pages/${slug}/view`, { method: 'POST' }).catch(console.error);
    }, [slug]);

    const {
        hero = {},
        features = [],
        pricing = {},
        settings = {},
        integrations = {},
        cta_configuration = {}
    } = content;

    // Map features to component format
    const mappedFeatures = features?.map((f: any) => ({
        id: f.title, // simple key
        title: f.title,
        description: f.description,
        icon: <DynamicIcon name={f.icon} className="w-6 h-6 text-red-600" />
    })) || [];

    return (
        <main className="flex flex-col overflow-x-hidden relative selection:bg-red-500/30 selection:text-red-200 bg-black">
            {/* Dynamic Scripts */}
            {integrations?.google_analytics_id && (
                <>
                    <Script src={`https://www.googletagmanager.com/gtag/js?id=${integrations.google_analytics_id}`} />
                    <Script id="google-analytics">
                        {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${integrations.google_analytics_id}');
                        `}
                    </Script>
                </>
            )}

            <ThemeOverride />
            <GlobalBackground />

            {/* Hero */}
            <NewYearHero
                videoThumbnail={hero?.thumbnail_src}
                videoSrc={hero?.video_src}
                headline={hero?.headline}
                subheadline={hero?.subheadline}
                announcementBadge={hero?.announcement_badge}
                ctaText={hero?.cta_text}
                offerEndRequest={settings?.timer_end_date}
            />

            {/* Problem Agitation Section */}
            {content.problem_section?.enabled && (
                <ProblemSection
                    title={content.problem_section.title}
                    subtitle={content.problem_section.subtitle}
                    cards={content.problem_section.cards}
                />
            )}

            {/* Live Demos Section */}
            {content.live_demos?.enabled && (
                <LiveDemos
                    title={content.live_demos.title}
                    description={content.live_demos.description}
                    items={content.live_demos.items}
                />
            )}

            {/* Marquee Banner */}
            {content.marquee?.enabled && (
                <div className="w-full overflow-hidden relative z-20 py-4">
                    <div className="bg-red-600 text-white py-3 border-y border-white/10 rotate-1 scale-105 shadow-xl">
                        <div className="flex animate-marquee whitespace-nowrap gap-12 font-bold tracking-wider text-sm md:text-base items-center">
                            {[...Array(10)].map((_, i) => (
                                <span key={i} className="flex items-center gap-3">
                                    <Zap className="h-4 w-4 fill-current" /> {content.marquee.text} <Zap className="h-4 w-4 fill-current" />
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Dynamic Features */}
            {mappedFeatures.length > 0 && (
                <FeaturesBrowser
                    features={mappedFeatures}
                    headline={content.features_config?.headline}
                    subheadline={content.features_config?.subheadline}
                />
            )}


            {/* Testimonials */}
            <Testimonials testimonials={content.testimonials} />

            {/* Order Flow */}
            {content.order_flow?.enabled && (
                <OrderFlow
                    title={content.order_flow.title}
                    subtitle={content.order_flow.subtitle}
                    items={content.order_flow.items}
                />
            )}

            {/* Comparison Section */}
            {content.comparison_table?.enabled && (
                <ComparisonTable
                    title={content.comparison_table.title}
                    subtitle={content.comparison_table.subtitle}
                    badge={content.comparison_table.badge}
                    rows={content.comparison_table.rows}
                    source={slug}
                />
            )}

            {/* Setup Process */}
            {content.setup_process?.enabled && (
                <SetupProcess
                    title={content.setup_process.title}
                    subtitle={content.setup_process.subtitle}
                    badge={content.setup_process.badge}
                    items={content.setup_process.items}
                />
            )}

            {/* Pricing Section */}
            {pricing && (
                <div className="py-12" id="pricing">
                    <Pricing
                        price={pricing.sale_price}
                        originalPrice={pricing.original_price}
                        paymentLink={pricing.payment_link}
                        title={pricing.title}
                        description={pricing.description}
                        buttonText={pricing.button_text}
                        features={pricing.features}
                        source={slug}
                        ctaConfig={cta_configuration}
                    />
                </div>
            )}

            {/* FAQ */}
            <div className="py-24 bg-zinc-950 relative z-10 border-t border-white/10">
                <FAQ items={content.faq} />
            </div>

            <Footer source={slug} />

            <StickyCTA
                price={pricing?.sale_price || 0}
                originalPrice={pricing?.original_price}
                source={slug}
                paymentLink={pricing?.payment_link}
                offerEndDate={settings?.timer_end_date}
                ctaConfig={cta_configuration}
            />
        </main>
    );
}
