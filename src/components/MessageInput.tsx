import React, { useState, useRef } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string, deleteMinutes: number, type: 'text' | 'image' | 'link', imageUrl?: string, linkUrl?: string, linkTitle?: string) => void;
}

const MessageInput = ({ onSendMessage }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [deleteMinutes, setDeleteMinutes] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const deleteOptions = [
    { label: '1m', value: 1 },
    { label: '5m', value: 5 },
    { label: '10m', value: 10 },
  ];

  const handleSend = async () => {
    if (!message.trim() && !selectedFile) return;

    // Detect message type automatically
    let messageType: 'text' | 'image' | 'link' = 'text';
    let imageUrl: string | undefined;
    let linkUrl: string | undefined;
    let linkTitle: string | undefined;

    // Check if message contains a URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = message.match(urlRegex);
    if (urls && urls.length > 0) {
      messageType = 'link';
      linkUrl = urls[0];
      linkTitle = message.replace(urls[0], '').trim() || urls[0];
    }

    // Handle file upload
    if (selectedFile) {
      // Upload the file to the server
      if (selectedFile.type.startsWith('image/')) {
        messageType = 'image';
        try {
          setIsUploading(true);
          setUploadProgress(0);

          const formData = new FormData();
          formData.append('file', selectedFile);

          // Use XMLHttpRequest for progress tracking
          const uploadPromise = new Promise<{ success: boolean, imageUrl?: string, error?: string }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percentComplete);
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status === 200) {
                try {
                  const response = JSON.parse(xhr.responseText);
                  resolve(response);
                } catch (error) {
                  reject(new Error('Invalid response format'));
                }
              } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            });

            xhr.addEventListener('error', () => {
              reject(new Error('Upload failed'));
            });

            xhr.open('POST', '/api/upload');
            xhr.send(formData);
          });

          const uploadData = await uploadPromise;

          if (uploadData.success && uploadData.imageUrl) {
            imageUrl = uploadData.imageUrl;
          } else {
            alert('Failed to upload image: ' + (uploadData.error || 'Unknown error'));
            return;
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          alert('Failed to upload image: ' + (uploadError instanceof Error ? uploadError.message : 'Unknown error'));
          return;
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      }
    }

    onSendMessage(
      message,
      deleteMinutes,
      messageType,
      imageUrl,
      linkUrl,
      linkTitle
    );

    setMessage('');
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (1GB = 1,073,741,824 bytes)
      if (file.size > 1073741824) {
        alert('File size must be less than 1GB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const canSend = () => {
    return (message.trim().length > 0 || selectedFile !== null) && !isUploading;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend()) {
        handleSend();
      }
    }
  };

  return (
    React.createElement('div', { className: 'p-3 sm:p-4', style: { backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-primary)' } },
      selectedFile && React.createElement('div', { className: 'mb-2 sm:mb-3 p-2 sm:p-3 rounded-lg', style: { backgroundColor: 'var(--bg-tertiary)' } },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', { className: 'flex items-center space-x-2 min-w-0 flex-1' },
            React.createElement(Paperclip, { className: 'w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0', style: { color: 'var(--accent-blue)' } }),
            React.createElement('span', { className: 'text-sm truncate', style: { color: 'var(--text-primary)' } }, selectedFile.name),
            React.createElement('span', { className: 'text-xs ml-1 flex-shrink-0', style: { color: 'var(--text-muted)' } },
              `(${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB)`
            )
          ),
          !isUploading && React.createElement('button', {
            onClick: () => {
              setSelectedFile(null);
              setUploadProgress(0);
              setIsUploading(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
            },
            className: 'text-sm hover:opacity-70 transition-opacity',
            style: { color: 'var(--accent-red)' }
          }, 'Remove')
        ),
        // Progress bar
        isUploading && React.createElement('div', { className: 'mt-3' },
          React.createElement('div', { className: 'flex items-center justify-between mb-1' },
            React.createElement('span', { className: 'text-xs', style: { color: 'var(--text-secondary)' } }, 'Uploading...'),
            React.createElement('span', { className: 'text-xs', style: { color: 'var(--text-secondary)' } }, `${uploadProgress}%`)
          ),
          React.createElement('div', {
            className: 'w-full rounded-full h-2',
            style: { backgroundColor: 'var(--bg-primary)' }
          },
            React.createElement('div', {
              className: 'h-2 rounded-full transition-all duration-300',
              style: {
                width: `${uploadProgress}%`,
                backgroundColor: 'var(--accent-blue)'
              }
            })
          )
        )
      ),
      React.createElement('div', { className: 'flex flex-col sm:flex-row items-stretch sm:items-end space-y-2 sm:space-y-0 sm:space-x-3' },
        React.createElement('div', { className: 'flex-1 order-1 sm:order-1' },
          React.createElement('textarea', {
            value: message,
            onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value),
            onKeyPress: handleKeyPress,
            placeholder: selectedFile ? 'Add a message (optional)...' : 'Type a message...',
            className: 'w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg resize-none focus:outline-none transition-all text-sm sm:text-base',
            style: {
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              minHeight: '40px',
              maxHeight: '100px'
            },
            rows: 1
          })
        ),
        React.createElement('div', { className: 'flex items-center justify-between sm:justify-start space-x-2 order-2 sm:order-2' },
          React.createElement('input', {
            ref: fileInputRef,
            type: 'file',
            onChange: handleFileSelect,
            className: 'hidden',
            accept: 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar'
          }),
          React.createElement('button', {
            onClick: () => fileInputRef.current?.click(),
            disabled: isUploading,
            className: 'p-2 sm:p-2 rounded-lg transition-all hover:opacity-70',
            style: {
              backgroundColor: 'var(--bg-tertiary)',
              color: isUploading ? 'var(--text-muted)' : 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              opacity: isUploading ? 0.5 : 1
            },
            title: isUploading ? 'Upload in progress...' : 'Attach file (max 1GB)'
          }, React.createElement(Paperclip, { className: 'w-4 h-4 sm:w-5 sm:h-5' })),
          React.createElement('div', { className: 'flex items-center space-x-1 rounded-lg p-1', style: { backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' } },
            deleteOptions.map((option) =>
              React.createElement('button', {
                key: option.value,
                onClick: () => setDeleteMinutes(option.value),
                className: 'px-2 py-1 text-xs rounded transition-all',
                style: deleteMinutes === option.value ? {
                  backgroundColor: 'var(--accent-blue)',
                  color: 'white'
                } : {
                  color: 'var(--text-muted)'
                },
                title: `Delete after ${option.label.replace('m', ' minute')}${option.value > 1 ? 's' : ''}`
              }, option.label)
            )
          ),
          React.createElement('button', {
            onClick: handleSend,
            disabled: !canSend(),
            className: 'p-2 sm:p-2 rounded-lg transition-all min-w-[44px]',
            style: canSend() ? {
              backgroundColor: 'var(--accent-blue)',
              color: 'white'
            } : {
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              cursor: 'not-allowed',
              border: '1px solid var(--border-primary)'
            },
            title: isUploading ? 'Uploading...' : 'Send message'
          }, isUploading
            ? React.createElement(Loader2, { className: 'w-4 h-4 sm:w-5 sm:h-5 animate-spin' })
            : React.createElement(Send, { className: 'w-4 h-4 sm:w-5 sm:h-5' })
          )
        )
      )
    )
  );
};

export default MessageInput;