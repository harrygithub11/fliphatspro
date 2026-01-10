import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailsTab } from "@/components/admin/email/EmailsTab";
import { SMTPAccountsAdmin } from "@/components/admin/email/SMTPAccountsAdmin";
import { InboxView } from "@/components/admin/email/InboxView";

export default function EmailPage() {
    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Email System</h2>
                    <p className="text-muted-foreground">
                        Manage your email campaigns, accounts, and inbox.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="inbox" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="inbox">Inbox</TabsTrigger>
                    <TabsTrigger value="outbox">Outbox & Sent</TabsTrigger>
                    <TabsTrigger value="accounts">Email Accounts</TabsTrigger>
                </TabsList>

                <TabsContent value="inbox" className="space-y-4">
                    <InboxView />
                </TabsContent>

                <TabsContent value="outbox" className="space-y-4">
                    <EmailsTab />
                </TabsContent>

                <TabsContent value="accounts" className="space-y-4">
                    <SMTPAccountsAdmin />
                </TabsContent>
            </Tabs>
        </div>
    );
}
