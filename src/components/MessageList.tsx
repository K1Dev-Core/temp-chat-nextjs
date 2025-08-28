import React from 'react';
import { Message } from '@/lib/database';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Clock } from 'lucide-react';

interface MessageListProps {
    messages: Message[];
    currentUsername: string;
}

const MessageList = ({ messages, currentUsername }: MessageListProps) => {
    const formatTimeRemaining = (deleteAt: number) => {
        const now = Date.now();
        const remaining = deleteAt - now;

        if (remaining <= 0) return { text: 'Expired', warning: true };

        const minutes = Math.floor(remaining / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        // Warning if less than 30 seconds remaining
        const isWarning = remaining < 30000;

        if (minutes > 0) {
            return { text: `${minutes}m ${seconds}s`, warning: isWarning };
        } else {
            return { text: `${seconds}s`, warning: isWarning };
        }
    };

    const renderMessageContent = (message: Message) => {
        const timeInfo = formatTimeRemaining(message.deleteAt);
        const isExpiring = timeInfo.warning;

        if (message.type === 'image' && message.imageUrl) {
            return (
                React.createElement('div', { className: 'space-y-2' },
                    // Add warning banner for expiring images
                    isExpiring && React.createElement('div', {
                        className: 'text-xs p-2 rounded flex items-center space-x-1',
                        style: { backgroundColor: 'var(--accent-red)', color: 'white' }
                    },
                        React.createElement('span', {}, '⚠️ Image will be deleted soon!')
                    ),
                    React.createElement('img', {
                        src: message.imageUrl,
                        alt: 'Shared image',
                        className: 'max-w-full rounded-lg shadow-sm',
                        style: isExpiring ? {
                            border: '2px solid var(--accent-red)',
                            opacity: '0.8'
                        } : {},
                        onError: (e: any) => {
                            e.currentTarget.style.display = 'none';
                        }
                    }),
                    message.text && React.createElement('p', { style: { color: 'var(--text-primary)' } }, message.text)
                )
            );
        }

        if (message.type === 'link' && message.linkUrl) {
            return (
                React.createElement('div', { className: 'space-y-2' },
                    React.createElement('a', {
                        href: message.linkUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'inline-flex items-center space-x-2 p-2 rounded-lg transition-colors',
                        style: { backgroundColor: 'var(--bg-tertiary)' }
                    },
                        React.createElement(ExternalLink, { className: 'w-4 h-4', style: { color: 'var(--accent-blue)' } }),
                        React.createElement('span', { className: 'text-sm truncate', style: { color: 'var(--accent-blue)' } },
                            message.linkTitle || message.linkUrl
                        )
                    ),
                    message.text && React.createElement('p', { style: { color: 'var(--text-primary)' } }, message.text)
                )
            );
        }

        return React.createElement('p', { className: 'break-words', style: { color: 'var(--text-primary)' } }, message.text);
    };

    if (messages.length === 0) {
        return (
            React.createElement('div', { className: 'flex-1 flex items-center justify-center p-6 sm:p-8', style: { color: 'var(--text-muted)' } },
                React.createElement('div', { className: 'text-center' },
                    React.createElement('p', { className: 'text-lg mb-2' }, 'No messages yet'),
                    React.createElement('p', { className: 'text-sm' }, 'Start the conversation!')
                )
            )
        );
    }

    return (
        React.createElement('div', { className: 'flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4' },
            messages.map((message) => {
                const isOwnMessage = message.username === currentUsername;
                const timeInfo = formatTimeRemaining(message.deleteAt);

                return React.createElement('div', {
                    key: message.id,
                    className: `flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`
                },
                    React.createElement('div', {
                        className: 'max-w-[280px] sm:max-w-xs md:max-w-md lg:max-w-lg px-3 sm:px-4 py-2 sm:py-3 rounded-lg',
                        style: isOwnMessage ? {
                            backgroundColor: 'var(--accent-blue)',
                            color: 'white'
                        } : {
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)'
                        }
                    },
                        React.createElement('div', { className: 'flex items-center justify-between mb-1 text-xs', style: { opacity: 0.7 } },
                            React.createElement('span', { className: 'truncate max-w-[120px] sm:max-w-none' }, message.username),
                            React.createElement('div', {
                                className: 'flex items-center space-x-1',
                                style: timeInfo.warning ? { color: 'var(--accent-red)' } : {}
                            },
                                React.createElement(Clock, { className: 'w-2.5 h-2.5 sm:w-3 sm:h-3' }),
                                React.createElement('span', {
                                    style: timeInfo.warning ? {
                                        color: 'var(--accent-red)',
                                        fontWeight: 'bold',
                                        animation: 'pulse 1s infinite'
                                    } : {}
                                }, timeInfo.text)
                            )
                        ),
                        renderMessageContent(message),
                        React.createElement('div', { className: 'text-xs mt-2', style: { opacity: 0.6 } },
                            formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
                        )
                    )
                );
            })
        )
    );
};

export default MessageList;