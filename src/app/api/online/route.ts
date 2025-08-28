import { NextRequest, NextResponse } from 'next/server';
import { updateUserOnlineStatus, getOnlineUsers } from '@/lib/database';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, username } = body;

        if (!userId || !username) {
            return NextResponse.json(
                { success: false, error: 'User ID and username are required' },
                { status: 400 }
            );
        }

        const success = updateUserOnlineStatus(userId, username);

        if (success) {
            const onlineUsers = getOnlineUsers();
            return NextResponse.json({
                success: true,
                onlineUsers,
                onlineCount: onlineUsers.length
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Failed to update online status' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error updating online status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update online status' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const onlineUsers = getOnlineUsers();
        return NextResponse.json({
            success: true,
            onlineUsers,
            onlineCount: onlineUsers.length
        });
    } catch (error) {
        console.error('Error getting online users:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get online users' },
            { status: 500 }
        );
    }
}