import { NextResponse } from 'next/server';
import { getMessages } from '@/lib/database';

export async function GET() {
    try {
        const messages = getMessages();
        return NextResponse.json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}