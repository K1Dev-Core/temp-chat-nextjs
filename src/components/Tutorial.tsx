import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Paperclip, Clock, Users, Zap } from 'lucide-react';

interface TutorialStep {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    target?: string;
}

interface TutorialProps {
    onComplete: () => void;
}

const Tutorial = ({ onComplete }: TutorialProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const tutorialSteps: TutorialStep[] = [
        {
            id: 'welcome',
            title: 'TempChat',
            description: 'Messages auto-delete. Choose 1m, 5m, or 10m timing.',
            icon: MessageCircle
        },
        {
            id: 'messaging',
            title: 'Quick Tips',
            description: 'Type message → Pick timer → Send. Images also supported.',
            icon: Zap
        },
        {
            id: 'files',
            title: 'Done!',
            description: 'That\'s it! Simple temporary messaging. Start chatting.',
            icon: Paperclip
        }
    ];

    const handleNext = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        setIsVisible(false);
        setTimeout(() => {
            onComplete();
        }, 300);
    };

    if (!isVisible) return null;

    const step = tutorialSteps[currentStep];
    const IconComponent = step.icon;

    return (
        React.createElement('div', {
            className: 'fixed inset-0 z-50 flex items-center justify-center',
            style: { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
        },
            React.createElement('div', {
                className: 'max-w-xs sm:max-w-sm mx-3 sm:mx-4 p-3 sm:p-4 rounded-lg shadow-2xl animate-fade-in',
                style: {
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)'
                }
            },
                // Header
                React.createElement('div', { className: 'flex items-center justify-between mb-2 sm:mb-3' },
                    React.createElement('div', { className: 'flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1' },
                        React.createElement(IconComponent, {
                            className: 'w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0',
                            style: { color: 'var(--accent-blue)' }
                        }),
                        React.createElement('h3', {
                            className: 'text-base sm:text-lg font-semibold truncate',
                            style: { color: 'var(--text-primary)' }
                        }, step.title)
                    ),
                    React.createElement('button', {
                        onClick: handleSkip,
                        className: 'p-1 rounded hover:opacity-70 transition-opacity flex-shrink-0',
                        style: { color: 'var(--text-muted)' },
                        title: 'Skip tutorial'
                    }, React.createElement(X, { className: 'w-4 h-4 sm:w-5 sm:h-5' }))
                ),

                // Content
                React.createElement('p', {
                    className: 'mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base',
                    style: { color: 'var(--text-secondary)' }
                }, step.description),

                // Progress dots
                React.createElement('div', { className: 'flex justify-center space-x-2 mb-3 sm:mb-4' },
                    tutorialSteps.map((_, index) =>
                        React.createElement('div', {
                            key: index,
                            className: 'w-2 h-2 rounded-full transition-all duration-200',
                            style: {
                                backgroundColor: index === currentStep
                                    ? 'var(--accent-blue)'
                                    : 'var(--border-primary)'
                            }
                        })
                    )
                ),

                // Footer
                React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('span', {
                        className: 'text-xs sm:text-sm',
                        style: { color: 'var(--text-muted)' }
                    }, `${currentStep + 1} of ${tutorialSteps.length}`),

                    React.createElement('div', { className: 'space-x-2 sm:space-x-3' },
                        currentStep > 0 && React.createElement('button', {
                            onClick: () => setCurrentStep(currentStep - 1),
                            className: 'px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded transition-colors',
                            style: {
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-primary)'
                            }
                        }, 'Back'),

                        React.createElement('button', {
                            onClick: handleNext,
                            className: 'px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded transition-colors',
                            style: {
                                backgroundColor: 'var(--accent-blue)',
                                color: 'white'
                            }
                        }, currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next')
                    )
                )
            )
        )
    );
};

export default Tutorial;