declare module 'mailparser' {
    export function simpleParser(source: any, options?: any): Promise<ParsedMail>;

    export interface ParsedMail {
        messageId?: string;
        date?: Date;
        subject?: string;
        from?: { value: { address: string; name: string }[] };
        to?: { value: { address: string; name: string }[] };
        text?: string;
        html?: string;
        textAsHtml?: string;
        inReplyTo?: string;
        references?: string[];
        attachments?: any[];
        [key: string]: any;
    }
}
