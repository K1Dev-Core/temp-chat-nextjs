'use client';

import React from 'react';
import { Moon, Sun, Circle } from 'lucide-react';
import { useTheme } from './theme-provider';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const themes = [
        { value: 'black', icon: Moon, label: 'Black' },
        { value: 'gray', icon: Circle, label: 'Gray' }, 
        { value: 'white', icon: Sun, label: 'White' }
    ] as const;

    return (
        React.createElement('div', { className: 'flex items-center space-x-1 bg-gray-700 rounded-lg p-1' },
            themes.map(({ value, icon: Icon, label }) =>
                React.createElement('button', {
                    key: value,
                    onClick: () => setTheme(value),
                    className: `flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                        theme === value
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-600'
                    }`,
                    title: `Switch to ${label} theme`
                },
                    React.createElement(Icon, { className: 'w-3 h-3' }),
                    React.createElement('span', { className: 'hidden sm:inline' }, label)
                )
            )
        )
    );
}