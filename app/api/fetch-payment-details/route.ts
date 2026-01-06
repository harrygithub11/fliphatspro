
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import Razorpay from 'razorpay';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const paymentId = searchParams.get('payment_id');

        if (!paymentId) {
            return NextResponse.json(
                { error: 'Payment ID is required' },
                { status: 400 }
            );
        }

        // Fetch payment details from Razorpay
        const payment = await razorpay.payments.fetch(paymentId);

        if (!payment) {
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            );
        }

        // Extract useful customer details
        // Razorpay payment object normally contains: email, contact, notes
        const customerDetails = {
            email: payment.email,
            contact: payment.contact,
            notes: payment.notes,
            amount: payment.amount,
            status: payment.status,
            method: payment.method
        };

        return NextResponse.json(customerDetails);

    } catch (error: any) {
        console.error('Error fetching payment details:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch payment details' },
            { status: 500 }
        );
    }
}
