'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const faqData = [
    {
        question: "Is this really a one-time payment?",
        answer: "Yes! Unlike Shopify or Wix, you don't pay us monthly platform fees. You own the code and the store. The only recurring cost after 1 year is standard hosting (approx ₹3k/year)."
    },
    {
        question: "Do I need technical knowledge?",
        answer: "Zero. We set up everything for you. You get a simple admin panel (like Amazon seller dashboard) to add products and view orders."
    },
    {
        question: "How long does setup take?",
        answer: "Once you share your requirements, we typically hand over the live store within 24 working hours."
    },
    {
        question: "Can I accept UPI payments?",
        answer: "Absolutely. We integrate standard Indian payment gateways like Razorpay or PhonePe so you can accept UPI, Cards, and Netbanking."
    },
    {
        question: "Is it mobile friendly?",
        answer: "100%. The store is mobile-first, ensuring your customers have a smooth shopping experience on any device."
    },
];

export function FAQ() {
    return (
        <div className="w-full max-w-3xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-white">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
                {faqData.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border border-zinc-800 rounded-lg bg-zinc-900/30 px-4 mb-4">
                        <AccordionTrigger className="text-left font-medium text-white hover:text-red-500 hover:no-underline py-4 text-lg">
                            {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-zinc-400 pb-4 text-base leading-relaxed">
                            {item.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}
