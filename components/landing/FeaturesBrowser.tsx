"use client";

import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FeatureItem {
    id?: string;
    title: string;
    description: string;
    icon: any;
}

const IconMap = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Zap;
    return <Icon className="w-6 h-6 text-red-600" />;
};

interface FeaturesBrowserProps {
    features?: FeatureItem[];
    headline?: string;
    subheadline?: string;
}

export function FeaturesBrowser({
    features = [],
    headline = "Get more value from your tools",
    subheadline = "Connect your tools, connect your teams. With everything included, your ecommerce journey is just a click away."
}: FeaturesBrowserProps) {
    // Fallback if empty
    if (!features || features.length === 0) {
        features = [
            {
                title: "Your Own Website",
                description: "A professional, mobile-responsive e-commerce store with your own domain included.",
                icon: "Laptop"
            },
            {
                title: "User-Friendly Dashboard",
                description: "All your data in one place. Intuitive interface to view sales, inventory and customer insights.",
                icon: "BarChart"
            },
            {
                title: "Real-Time Insights",
                description: "Stay up to date with instant analytics. React quickly to trends and optimize your sales.",
                icon: "Zap"
            },
            {
                title: "Marketing Tools",
                description: "Email automation, discount codes, and abandoned cart recovery tools built right in.",
                icon: "Rocket"
            }
        ];
    }

    return (
        <section className="container mx-auto px-4 py-24 relative z-10">
            {/* Browser Window Container */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="rounded-[2.5rem] bg-zinc-900/50 p-2 md:p-4 border border-zinc-800 backdrop-blur-sm shadow-2xl"
            >
                {/* Inner Content Area */}
                <div className="bg-black/80 rounded-[2rem] px-6 py-16 md:px-20 md:py-20 shadow-inner overflow-hidden relative">

                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />

                    <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 border-red-900/50 bg-red-900/10 text-red-500 rounded-full text-xs font-semibold uppercase tracking-wider">
                            Our Features
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white features-headline">
                            {headline}
                        </h2>
                        <p className="text-lg text-zinc-400 leading-relaxed">
                            {subheadline}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 lg:gap-10 relative z-10">
                        {features.map((item, i) => (
                            <motion.div
                                key={item.id || i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-red-600/40 hover:bg-zinc-900 transition-all duration-300"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-red-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <div className={`p-3 rounded-xl mb-4 w-fit bg-red-900/10 border border-red-900/20`}>
                                        {typeof item.icon === 'string' ? IconMap(item.icon) : item.icon}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
                                <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
