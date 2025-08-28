import { NextResponse } from 'next/server';
import { deleteExpiredMessages } from '@/lib/database';

export async function POST() {
    try {
        const deletedCount = deleteExpiredMessages();
        return NextResponse.json({
            success: true,
            deletedCount,
            message: `Deleted ${deletedCount} expired messages`
        });
    } catch (error) {
        console.error('Error cleaning up messages:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to clean up messages' },
            { status: 500 }
        );
    }
}