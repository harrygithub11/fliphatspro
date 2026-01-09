import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SMTPAccountsAdmin } from '@/components/admin/email/SMTPAccountsAdmin';
import { EmailsTab } from '@/components/admin/email/EmailsTab';

export default function EmailPage() {
    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Email System</h1>

            <Tabs defaultValue="outbox" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="outbox">Outbox & Sent</TabsTrigger>
                    <TabsTrigger value="accounts">SMTP Accounts</TabsTrigger>
                    {/* <TabsTrigger value="templates">Templates</TabsTrigger> */}
                </TabsList>

                <TabsContent value="outbox">
                    <EmailsTab />
                </TabsContent>

                <TabsContent value="accounts">
                    <SMTPAccountsAdmin />
                </TabsContent>
            </Tabs>
        </div>
    );
}
