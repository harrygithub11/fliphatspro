import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | Fliphat Media',
    description: 'Privacy Policy for Fliphat Media - Learn how we collect, use, and protect your personal data.',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-4 py-16 max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                    Privacy Policy
                </h1>

                <div className="prose prose-invert prose-lg max-w-none">
                    <p className="text-zinc-400 mb-8">
                        Fliphat Media ("we", "our", "us") respects your privacy and is committed to protecting the personal data of our clients, partners, and website visitors. This Privacy Policy explains what data we collect, how we use it, and your rights under applicable data protection laws.
                    </p>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold mb-4 text-white">1. Information We Collect</h2>
                        <p className="text-zinc-300 mb-3">We may collect the following categories of personal data:</p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                            <li>Contact information such as name, email address, phone number, and company name</li>
                            <li>Business information including project requirements and communication history</li>
                            <li>Payment and billing information processed securely through third-party providers</li>
                            <li>Technical data such as IP address, browser type, device information, cookies, and usage data</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold mb-4 text-white">2. How We Use Your Information</h2>
                        <p className="text-zinc-300 mb-3">We use your data to:</p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                            <li>Provide marketing, advertising, web development, automation, and consulting services</li>
                            <li>Communicate with clients and prospects</li>
                            <li>Manage contracts, invoices, and payments</li>
                            <li>Improve our website, services, and campaign performance</li>
                            <li>Comply with legal and regulatory obligations</li>
                            <li>Prevent fraud and misuse</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold mb-4 text-white">3. Data Sharing and Disclosure</h2>
                        <p className="text-zinc-300 mb-3">
                            We do not sell or rent your personal data.
                        </p>
                        <p className="text-zinc-300">
                            We may share limited data with trusted third-party service providers such as advertising platforms, analytics tools, CRM systems, and payment processors, strictly for service delivery purposes.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold mb-4 text-white">4. Data Retention</h2>
                        <p className="text-zinc-300">
                            We retain personal data only as long as necessary to fulfill service delivery, contractual, legal, and accounting requirements. Data is securely deleted or anonymized when no longer required.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold mb-4 text-white">5. Your Rights</h2>
                        <p className="text-zinc-300">
                            You have the right to access, correct, delete, restrict, or object to the processing of your personal data, and request data portability where applicable.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold mb-4 text-white">6. Cookies and Tracking</h2>
                        <p className="text-zinc-300">
                            We use cookies and similar technologies to improve website functionality, analytics, and performance. You may control cookies through your browser settings.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold mb-4 text-white">7. Contact Information</h2>
                        <p className="text-zinc-300 mb-2">
                            For any questions or requests related to this Privacy Policy, contact:
                        </p>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mt-4">
                            <p className="text-zinc-300 mb-2">
                                <span className="font-semibold text-white">Email:</span>{' '}
                                <a href="mailto:contact@fliphatmedia.com" className="text-red-500 hover:text-red-400 transition-colors">
                                    contact@fliphatmedia.com
                                </a>
                            </p>
                            <p className="text-zinc-300 mb-2">
                                <span className="font-semibold text-white">Company:</span> Fliphat Media
                            </p>
                            <p className="text-zinc-300">
                                <span className="font-semibold text-white">Location:</span> India (operating globally)
                            </p>
                        </div>
                    </section>

                    <div className="mt-12 pt-8 border-t border-zinc-800 text-center">
                        <p className="text-zinc-500 text-sm">
                            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
