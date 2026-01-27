import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Download, Globe } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getProposalData(id: string) {
    const connection = await pool.getConnection();
    try {
        const [rows]: any = await connection.execute(`
            SELECT o.*, c.name, c.email, c.phone, c.notes 
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE o.id = ?
        `, [id]);
        return rows[0] || null;
    } finally {
        connection.release();
    }
}

export default async function ProposalPage({ params }: { params: { id: string } }) {
    const proposal = await getProposalData(params.id);

    if (!proposal) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-zinc-50 py-10 px-4 flex justify-center">
            <Card className="w-full max-w-3xl shadow-lg bg-white">
                <CardHeader className="flex flex-row justify-between items-start border-b pb-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Globe className="w-6 h-6 text-primary" />
                            <h1 className="text-2xl font-bold tracking-tight">WebHost Inc.</h1>
                        </div>
                        <p className="text-sm text-muted-foreground">Premium Web Solutions</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-semibold text-zinc-800">PROPOSAL</h2>
                        <p className="text-sm text-muted-foreground">#PROP-{proposal.id.toString().padStart(4, '0')}</p>
                        <Badge variant="outline" className="mt-2 capitalize">{proposal.proposal_status}</Badge>
                    </div>
                </CardHeader>

                <CardContent className="p-8 space-y-8">
                    {/* Client Info */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Prepared For</h3>
                            <p className="font-semibold text-lg">{proposal.name}</p>
                            <p className="text-sm text-zinc-600">{proposal.email}</p>
                            <p className="text-sm text-zinc-600">{proposal.phone}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Date</h3>
                            <p className="text-sm font-medium">{new Date(proposal.created_at).toLocaleDateString()}</p>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-4 mb-2">Valid Until</h3>
                            <p className="text-sm font-medium">{new Date(new Date().setDate(new Date().getDate() + 14)).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Deliverables */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Project Deliverables</h3>
                        <div className="bg-zinc-50 p-4 rounded-lg border text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                            {/* In a real app, content would be dynamic. For now we use the description if available, else standard text */}
                            <p>Based on our discussion, we are pleased to propose the following services:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Custom Website Design & Development</li>
                                <li>Responsive Mobile Optimization</li>
                                <li>SEO Setup & Basic Analytics</li>
                                <li>1 Year Free Hosting & Domain</li>
                            </ul>
                        </div>
                    </div>

                    {/* Financials */}
                    <div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="font-medium">Web Design & Development Package</span>
                            <span className="font-medium">₹{Number(proposal.amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground">Tax (18% GST)</span>
                            <span className="text-muted-foreground">₹{(Number(proposal.amount) * 0.18).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-4 text-lg font-bold">
                            <span>Total Estimate</span>
                            <span className="text-primary">₹{(Number(proposal.amount) * 1.18).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-4">
                        <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" /> Download PDF
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Accept Proposal
                        </Button>
                    </div>

                    <div className="text-center text-xs text-muted-foreground pt-8">
                        <p>Thank you for your business!</p>
                        <p>WebHost Inc. | 123 Tech Park, Bangalore, India</p>
                    </div>
                </CardContent>
            </Card>

            {/* STATUS TRACKER (Visible Everywhere) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-2xl z-50">
                <div className="max-w-3xl mx-auto">
                    <h3 className="text-sm font-semibold mb-3">Project Status</h3>
                    <div className="flex items-center justify-between relative">
                        {['initiated', 'paid', 'processing', 'delivered'].map((step, i, arr) => {
                            const stepIndex = arr.indexOf(step);
                            const currentStatusIndex = arr.indexOf(proposal.status || 'initiated');
                            const isCompleted = stepIndex <= currentStatusIndex;
                            const isCurrent = stepIndex === currentStatusIndex;

                            return (
                                <div key={step} className="flex flex-col items-center relative z-10 w-full">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-zinc-100 text-zinc-400'
                                        } ${isCurrent ? 'ring-2 ring-offset-2 ring-primary' : ''}`}>
                                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                                    </div>
                                    <span className={`text-[10px] mt-2 font-medium uppercase tracking-wide ${isCompleted ? 'text-primary' : 'text-zinc-400'}`}>
                                        {step.replace('_', ' ')}
                                    </span>
                                    {/* Connector Line */}
                                    {i !== arr.length - 1 && (
                                        <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-10 ${stepIndex < currentStatusIndex ? 'bg-primary' : 'bg-zinc-100'
                                            }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
