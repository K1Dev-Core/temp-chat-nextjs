'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message, OnlineUser } from '@/lib/database';
import MessageInput from '@/components/MessageInput';
import MessageList from '@/components/MessageList';
import Tutorial from '@/components/Tutorial';
import { ThemeProvider } from '@/components/theme-provider';
import { MessageCircle, Users, Zap, HelpCircle, StickyNote } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const [nextExpiration, setNextExpiration] = useState<number | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [previousOnlineCount, setPreviousOnlineCount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [onlineActivity, setOnlineActivity] = useState<'none' | 'increase' | 'decrease'>('none');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const updateOnlineStatus = async () => {
    if (!userId || !username) return;

    try {
      const response = await fetch('/api/online', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, username }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const currentUsers = data.onlineUsers;
          const currentUsernames = currentUsers.map((user: OnlineUser) => user.username);
          const previousUsernames = onlineUsers.map(user => user.username);

          // Check for new users (joined)
          const joinedUsers = currentUsers.filter((user: OnlineUser) =>
            !previousUsernames.includes(user.username) && user.username !== username
          );

          // Check for users who left
          const leftUsers = onlineUsers.filter(user =>
            !currentUsernames.includes(user.username) && user.username !== username
          );

          // Track activity without notifications
          const currentCount = currentUsers.length;
          const previousCount = onlineUsers.length;

          if (previousCount > 0 && currentCount !== previousCount) {
            if (currentCount > previousCount) {
              setOnlineActivity('increase');
            } else {
              setOnlineActivity('decrease');
            }

            // Clear activity indicator after 2 seconds
            setTimeout(() => {
              setOnlineActivity('none');
            }, 2000);
          }

          setOnlineUsers(currentUsers);
          setPreviousOnlineCount(currentUsers.length);
        }
      }
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTutorialComplete = () => {
    localStorage.setItem('tempChatTutorialSeen', 'true');
    setShowTutorial(false);
  };

  // Debug function to reset tutorial (can be removed later)
  const resetTutorial = () => {
    localStorage.removeItem('tempChatTutorialSeen');
    setShowTutorial(true);
  };

  const formatNextExpiration = () => {
    if (!nextExpiration) return null;

    const now = Date.now();
    const remaining = nextExpiration - now;

    if (remaining <= 0) return 'Cleaning up...';

    // Count messages expiring soon (within 1 minute)
    const expiringCount = messages.filter(msg =>
      msg.deleteAt - now <= 60000 && msg.deleteAt > now
    ).length;

    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    const countStr = expiringCount > 0 ? ` (${expiringCount} expiring soon)` : '';

    return `Next cleanup: ${timeStr}${countStr}`;
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages;

        // Only update if there are new messages
        if (newMessages.length !== messages.length ||
          (newMessages.length > 0 && newMessages[newMessages.length - 1].timestamp > lastMessageTime)) {
          setMessages(newMessages);
          if (newMessages.length > 0) {
            setLastMessageTime(newMessages[newMessages.length - 1].timestamp);

            // Find the next message to expire
            const now = Date.now();
            const upcomingExpirations = newMessages
              .map((msg: Message) => msg.deleteAt)
              .filter((deleteAt: number) => deleteAt > now)
              .sort((a: number, b: number) => a - b);

            setNextExpiration(upcomingExpirations.length > 0 ? upcomingExpirations[0] : null);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize user session
  useEffect(() => {
    // Generate or get existing user ID from localStorage
    let storedUserId = localStorage.getItem('tempChatUserId');
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('tempChatUserId', storedUserId);
    }
    setUserId(storedUserId);

    // Get or generate username
    let storedUsername = localStorage.getItem('tempChatUsername');
    if (!storedUsername) {
      // Generate device-based username
      const userAgent = navigator.userAgent;
      let deviceType = 'User';
      if (userAgent.includes('iPhone') || userAgent.includes('iPad')) deviceType = 'iOS';
      else if (userAgent.includes('Android')) deviceType = 'Android';
      else if (userAgent.includes('Windows')) deviceType = 'Windows';
      else if (userAgent.includes('Mac')) deviceType = 'Mac';

      storedUsername = `${deviceType}${Math.floor(Math.random() * 1000)}`;
      localStorage.setItem('tempChatUsername', storedUsername);
    }
    setUsername(storedUsername);

    // Check if this is the user's first visit
    const hasSeenTutorial = localStorage.getItem('tempChatTutorialSeen');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const sendMessage = async (text: string, deleteMinutes: number, type: 'text' | 'image' | 'link', imageUrl?: string, linkUrl?: string, linkTitle?: string) => {
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          deleteMinutes,
          type,
          imageUrl,
          linkUrl,
          linkTitle,
          username,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(prev => [...prev, data.message]);
          if (!username) {
            setUsername(data.message.username);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    if (userId && username) {
      // Update online status immediately
      updateOnlineStatus();

      // Update online status every 5 seconds
      const onlineInterval = setInterval(() => {
        updateOnlineStatus();
      }, 5000);

      return () => clearInterval(onlineInterval);
    }
  }, [userId, username]);

  useEffect(() => {
    if (userId) {
      fetchMessages();

      // Use shorter interval for more real-time feel
      const interval = setInterval(() => {
        fetchMessages();
      }, 1000); // 1 second for real-time feel

      return () => clearInterval(interval);
    }
  }, [userId, lastMessageTime]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const cleanupInterval = setInterval(async () => {
      try {
        await fetch('/api/cleanup', { method: 'POST' });
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }, 30000);

    return () => clearInterval(cleanupInterval);
  }, []);



  if (isLoading) {
    return (
      React.createElement(ThemeProvider, {
        children:
          React.createElement('div', { className: 'min-h-screen flex items-center justify-center', style: { backgroundColor: 'var(--bg-primary)' } },
            React.createElement('div', { className: 'p-6 rounded-lg', style: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' } },
              React.createElement('div', { className: 'flex items-center space-x-3' },
                React.createElement(MessageCircle, { className: 'w-6 h-6 animate-pulse', style: { color: 'var(--accent-blue)' } }),
                React.createElement('p', { style: { color: 'var(--text-primary)' } }, 'Loading TempChat...')
              )
            )
          )
      })
    );
  }

  return (
    React.createElement(ThemeProvider, {
      children: [
        showTutorial && React.createElement(Tutorial, {
          key: 'tutorial',
          onComplete: handleTutorialComplete
        }),
        React.createElement('div', { key: 'main', className: 'min-h-screen flex flex-col', style: { backgroundColor: 'var(--bg-primary)' } },
          React.createElement('header', { className: 'p-3 sm:p-4', style: { backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' } },
            React.createElement('div', { className: 'max-w-4xl mx-auto flex items-center justify-between' },
              React.createElement('div', { className: 'flex items-center space-x-2 sm:space-x-3' },
                React.createElement(MessageCircle, { className: 'w-5 h-5 sm:w-6 sm:h-6', style: { color: 'var(--accent-blue)' } }),
                React.createElement('h1', { className: 'text-lg sm:text-xl font-semibold', style: { color: 'var(--text-primary)' } }, 'TempChat'),
                React.createElement('div', {
                  className: 'flex items-center space-x-1 sm:space-x-2 px-1.5 sm:px-2 py-1 rounded transition-all duration-200', style: {
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    borderColor: onlineActivity === 'increase' ? 'var(--accent-green)' :
                      onlineActivity === 'decrease' ? 'var(--accent-orange)' : 'var(--border-primary)'
                  }
                },
                  React.createElement(Users, {
                    className: 'w-3 h-3 sm:w-4 sm:h-4', style: {
                      color: onlineActivity === 'increase' ? 'var(--accent-green)' :
                        onlineActivity === 'decrease' ? 'var(--accent-orange)' : 'var(--accent-green)'
                    }
                  }),
                  React.createElement('span', {
                    className: 'text-xs sm:text-sm', style: {
                      color: onlineActivity !== 'none' ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }
                  },
                    `${onlineUsers.length}`
                  )
                )
              ),
              React.createElement('div', { className: 'flex items-center space-x-2 sm:space-x-4' },
                nextExpiration && React.createElement('span', {
                  className: 'hidden sm:block text-xs px-2 py-1 rounded',
                  style: {
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-primary)'
                  }
                }, formatNextExpiration()),
                username && React.createElement('span', { className: 'hidden md:block text-sm', style: { color: 'var(--text-secondary)' } }, username),
                React.createElement(Link, {
                  href: '/notes',
                  className: 'flex items-center space-x-1 p-1.5 sm:p-2 rounded-lg transition-all hover:opacity-70',
                  style: {
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-primary)'
                  },
                  title: 'Open Notes'
                },
                  React.createElement(StickyNote, { className: 'w-3.5 h-3.5 sm:w-4 sm:h-4' }),
                  React.createElement('span', { className: 'hidden sm:inline text-xs' }, 'Notes')
                ),
                React.createElement('button', {
                  onClick: () => setShowTutorial(true),
                  className: 'p-1.5 sm:p-2 rounded-lg transition-all hover:opacity-70',
                  style: {
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-primary)'
                  },
                  title: 'Show tutorial'
                }, React.createElement(HelpCircle, { className: 'w-3.5 h-3.5 sm:w-4 sm:h-4' }))
              )
            )
          ),
          React.createElement('main', { className: 'flex-1 flex flex-col max-w-4xl mx-auto w-full px-2 sm:px-0' },
            React.createElement('div', { className: 'flex-1 flex flex-col min-h-0' },
              React.createElement(MessageList, { messages, currentUsername: username }),
              React.createElement('div', { ref: messagesEndRef })
            ),
            React.createElement(MessageInput, { onSendMessage: sendMessage })
          )
        )
      ]
    })
  );
}
