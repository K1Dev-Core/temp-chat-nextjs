import { NextRequest, NextResponse } from 'next/server';
import { addMessage, generateUsername } from '@/lib/database';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, deleteMinutes, type = 'text', imageUrl, linkUrl, linkTitle, username } = body;

        if (!text && !imageUrl && !linkUrl) {
            return NextResponse.json(
                { success: false, error: 'Message content is required' },
                { status: 400 }
            );
        }

        if (!deleteMinutes || ![1, 5, 10].includes(deleteMinutes)) {
            return NextResponse.json(
                { success: false, error: 'Delete time must be 1, 5, or 10 minutes' },
                { status: 400 }
            );
        }

        const deleteAt = Date.now() + (deleteMinutes * 60 * 1000);
        const userAgent = request.headers.get('user-agent') || '';
        const finalUsername = username || generateUsername(userAgent);

        const message = addMessage({
            text: text || '',
            deleteAt,
            username: finalUsername,
            type,
            imageUrl,
            linkUrl,
            linkTitle,
        });

        if (message) {
            return NextResponse.json({ success: true, message });
        } else {
            return NextResponse.json(
                { success: false, error: 'Failed to add message' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error adding message:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add message' },
            { status: 500 }
        );
    }
}