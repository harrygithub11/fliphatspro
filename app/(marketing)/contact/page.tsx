import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MapPin, Phone, ArrowLeft, Clock, MessageSquare, ShieldCheck, Globe } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Contact Us - Fliphats',
    description: 'Get in touch with the Fliphats team.',
};

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navigation Header */}
            <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link href="/login" className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Login
                    </Link>
                    <div className="font-semibold text-sm">Fliphats Support</div>
                </div>
            </nav>

            {/* Hero / Main Contact Section */}
            <div className="py-16 px-6 sm:px-10 border-b">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">How can we help?</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Whether you have a question about features, pricing, or enterprise solutions, our team is ready to answer all your questions.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 items-start">
                        {/* Contact Form Details */}
                        <div className="space-y-10">
                            <div className="space-y-6">
                                <h2 className="text-2xl font-semibold">Contact Information</h2>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Mail className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-lg">Sales & Support</h3>
                                            <p className="text-muted-foreground mb-1">Our friendly team is here to help.</p>
                                            <a href="mailto:support@fliphats.com" className="font-semibold hover:underline text-primary">support@fliphats.com</a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <MapPin className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-lg">Headquarters</h3>
                                            <p className="text-muted-foreground mb-1">Come say hello at our office HQ.</p>
                                            <p className="font-semibold">100 Smith Street<br />Collingwood VIC 3066 AU</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Phone className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-lg">Phone</h3>
                                            <p className="text-muted-foreground mb-1">Mon-Fri from 8am to 5pm.</p>
                                            <a href="tel:+61400000000" className="font-semibold hover:underline text-primary">+61 400 000 000</a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-2xl font-semibold">Global Presence</h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl border bg-zinc-50 dark:bg-zinc-900/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">Australia (HQ)</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Melbourne, Victoria</p>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-zinc-50 dark:bg-zinc-900/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">United States</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">San Francisco, CA</p>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-zinc-50 dark:bg-zinc-900/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">United Kingdom</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">London</p>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-zinc-50 dark:bg-zinc-900/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">Singapore</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Marina Bay</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Application Form */}
                        <div className="bg-white dark:bg-zinc-900 p-8 md:p-10 rounded-3xl shadow-xl border border-zinc-100 dark:border-zinc-800">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold mb-2">Send us a message</h2>
                                <p className="text-muted-foreground">We typically respond within 1-2 hours.</p>
                            </div>

                            <form className="space-y-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="first-name">First name</Label>
                                        <Input id="first-name" placeholder="John" className="h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last-name">Last name</Label>
                                        <Input id="last-name" placeholder="Doe" className="h-11" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Work Email</Label>
                                    <Input id="email" type="email" placeholder="you@company.com" className="h-11" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input id="subject" placeholder="What is this regarding?" className="h-11" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea id="message" placeholder="Tell us more about your needs..." className="min-h-[160px] resize-none" />
                                </div>

                                <div className="pt-2">
                                    <Button type="submit" className="w-full h-12 text-base">Send Message</Button>
                                </div>
                                <p className="text-xs text-center text-muted-foreground mt-4">
                                    By sending this form you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Support & FAQ Section (To add massive length/value) */}
            <div className="py-20 px-6 sm:px-10 bg-zinc-50 dark:bg-zinc-950/50">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">Support Center</div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to know about the product and billing. If you can't find the answer you're looking for, please reach out to our team.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-16">
                        <div className="space-y-12">
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Is there a free trial available?</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Yes, you can try us for free for 30 days. If you want, we’ll provide you with a free, personalized 30-minute onboarding call to get you up and running as soon as possible.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Can I change my plan later?</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Of course. You can upgrade or downgrade your plan at any time from your billing settings. Refunds are pro-rated based on the time remaining in your billing cycle.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">What is your cancellation policy?</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    We understand that things change. You can cancel your plan at any time and we'll refund you the difference already paid for that month. No lock-in contracts, ever.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Does Fliphats support multi-currency?</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Yes, we support over 135 currencies. Your dashboard will automatically convert transactions to your home currency for easy reporting and analytics.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">How secure is my data?</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Security is our top priority. We use bank-level encryption (AES-256) for all data at rest and in transit. We are SOC 2 Type II compliant and conduct regular penetration testing.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Can I import data from other tools?</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Yes, we offer one-click migrations from popular tools like Salesforce, HubSpot, and Trello. For other tools, we provide comprehensive CSV import capabilities and a robust API.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-12">
                            <div>
                                <h3 className="text-xl font-semibold mb-3">How does billing work?</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Plans are billed monthly or annually. Annual plans come with a 20% discount. We accept all major credit cards including Visa, Mastercard, and American Express.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Do you offer 24/7 support?</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Our team is distributed globally to provide near 24/7 coverage. For Enterprise customers, we offer guaranteed 1-hour response times and dedicated account managers.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Can I get a refund?</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    If you're unhappy with the service, let us know within your first 30 days and we'll issue a full refund, no questions asked.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Do you offer custom enterprise plans?</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Absolutely. For large teams with specific compliance, security, or feature requirements, we offer custom Enterprise plans. Contact sales for a quote.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">What browsers do you support?</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    We support the latest versions of Chrome, Firefox, Safari, and Edge. We focus on modern web standards to deliver the best performance and experience.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">How do I delete my account?</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    You can delete your account from the settings menu. Please note that this action is permanent and all your data will be wiped from our servers immediately.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Support Policy / SLA Section */}
            <div className="py-20 px-6 sm:px-10 border-t">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-6">Support Policy & SLA</h2>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            We are committed to providing exceptional support to all our users. This Support Policy outlines what you can expect from us and how we prioritize and handle support requests.
                        </p>
                    </div>

                    <div className="space-y-10">
                        <div>
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                Response Times
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                We aim to respond to all support tickets within 24 hours. However, actual response times may vary based on the plan you are subscribed to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong className="text-foreground">Free Plan:</strong> Best effort response, usually within 48 hours.</li>
                                <li><strong className="text-foreground">Pro Plan:</strong> Priority response, usually within 12 hours.</li>
                                <li><strong className="text-foreground">Enterprise Plan:</strong> Guaranteed 1-hour response time for critical issues (24/7).</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-primary" />
                                Support Channels
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                We offer multiple channels for support to ensure you can reach us in the way that suits you best:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong className="text-foreground">Email Support:</strong> Available to all users.</li>
                                <li><strong className="text-foreground">Live Chat:</strong> Available to Pro and Enterprise users during business hours.</li>
                                <li><strong className="text-foreground">Phone Support:</strong> Exclusive to Enterprise users.</li>
                                <li><strong className="text-foreground">Knowledge Base:</strong> Self-serve documentation and tutorials available 24/7.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                                What We Support
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Our support team is happy to assist with:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Questions about product features and functionality.</li>
                                <li>Troubleshooting bugs or issues with the platform.</li>
                                <li>Billing and account management inquiries.</li>
                                <li>Basic guidance on setting up integrations.</li>
                            </ul>
                            <p className="text-muted-foreground mt-4">
                                Please note that we do not typically provide support for third-party applications, custom code implementations, or issues related to your local network or hardware.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
