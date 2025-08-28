import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserMinus } from 'lucide-react';

interface Notification {
    id: string;
    type: 'join' | 'leave';
    username: string;
    timestamp: number;
}

interface NotificationProps {
    notifications: Notification[];
    onClearNotification: (id: string) => void;
}

const UserNotifications = ({ notifications, onClearNotification }: NotificationProps) => {
    useEffect(() => {
        // Auto-clear notifications after 3 seconds (reduced from 5)
        notifications.forEach(notification => {
            setTimeout(() => {
                onClearNotification(notification.id);
            }, 3000);
        });
    }, [notifications, onClearNotification]);

    if (notifications.length === 0) return null;

    // Group notifications by type and show combined count
    const joinCount = notifications.filter(n => n.type === 'join').length;
    const leaveCount = notifications.filter(n => n.type === 'leave').length;

    // Show only the most recent notification of each type
    const latestJoin = notifications.filter(n => n.type === 'join').pop();
    const latestLeave = notifications.filter(n => n.type === 'leave').pop();

    const displayNotifications = [];
    if (latestJoin) displayNotifications.push({ ...latestJoin, count: joinCount });
    if (latestLeave) displayNotifications.push({ ...latestLeave, count: leaveCount });

    return (
        React.createElement('div', {
            className: 'fixed top-16 sm:top-20 right-2 sm:right-4 z-50 space-y-2',
            style: { maxWidth: '280px' }
        },
            displayNotifications.map((notification: any) =>
                React.createElement('div', {
                    key: `${notification.type}-${notification.timestamp}`,
                    className: 'flex items-center space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-lg animate-fade-in',
                    style: {
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        color: 'var(--text-primary)'
                    }
                },
                    React.createElement(
                        notification.type === 'join' ? UserPlus : UserMinus,
                        {
                            className: 'w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0',
                            style: {
                                color: notification.type === 'join' ? 'var(--accent-green)' : 'var(--accent-orange)'
                            }
                        }
                    ),
                    React.createElement('span', { className: 'text-xs sm:text-sm truncate flex-1' },
                        notification.count > 1
                            ? `${notification.count} users ${notification.type === 'join' ? 'joined' : 'left'}`
                            : `${notification.username} ${notification.type === 'join' ? 'joined' : 'left'}`
                    )
                )
            )
        )
    );
};

export default UserNotifications;