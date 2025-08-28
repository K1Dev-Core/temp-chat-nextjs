'use client';

import React, { useState, useEffect } from 'react';
import { Note } from '@/lib/database';
import { ThemeProvider } from '@/components/theme-provider';
import { 
  MessageCircle, 
  StickyNote, 
  Plus, 
  Search, 
  Filter, 
  Tag, 
  Edit3, 
  Trash2,
  ExternalLink,
  Hash,
  Clock,
  User,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [username, setUsername] = useState<string>('');

  // Form state for new/editing note
  const [formData, setFormData] = useState({
    content: '',
    tags: [] as string[],
    customTag: ''
  });

  // Predefined tags
  const predefinedTags = [
    'Web Application',
    'Digital Forensic', 
    'Reverse Engineering & Pwnable',
    'Network Security',
    'Mobile Security',
    'Programming',
    'Cryptography'
  ];

  useEffect(() => {
    // Get username from localStorage
    const storedUsername = localStorage.getItem('tempChatUsername') || 'Anonymous';
    setUsername(storedUsername);

    fetchNotes();
    fetchCategories();
    fetchTags();

    // Set up real-time polling for notes (every 3 seconds)
    const notesInterval = setInterval(() => {
      fetchNotes();
      fetchCategories();
      fetchTags();
    }, 3000);

    return () => clearInterval(notesInterval);
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes');
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/notes?action=categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/notes?action=tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.content.trim()) {
      alert('Content is required');
      return;
    }

    try {
      const noteData = {
        title: formData.content.split('\n')[0].substring(0, 50) + (formData.content.length > 50 ? '...' : ''), // Auto-generate title from first line
        content: formData.content,
        category: 'General',
        tags: formData.tags,
        links: [],
        author: username
      };

      const url = editingNote ? `/api/notes/${editingNote.id}` : '/api/notes';
      const method = editingNote ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (response.ok) {
        await fetchNotes();
        await fetchCategories();
        await fetchTags();
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    }
  };

  const handleDelete = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        const response = await fetch(`/api/notes/${noteId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await fetchNotes();
          await fetchCategories();
          await fetchTags();
        } else {
          alert('Failed to delete note');
        }
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      content: '',
      tags: [],
      customTag: ''
    });
    setShowNewNoteForm(false);
    setEditingNote(null);
  };

  const startEdit = (note: Note) => {
    setFormData({
      content: note.content,
      tags: [...note.tags],
      customTag: ''
    });
    setEditingNote(note);
    setShowNewNoteForm(true);
  };

  const togglePredefinedTag = (tag: string) => {
    if (formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: formData.tags.filter(t => t !== tag)
      });
    } else {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag]
      });
    }
  };

  const addCustomTag = () => {
    if (formData.customTag.trim() && !formData.tags.includes(formData.customTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.customTag.trim()],
        customTag: ''
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Filter notes based on search, category, and tag
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || note.category === selectedCategory;
    const matchesTag = selectedTag === '' || note.tags.includes(selectedTag);

    return matchesSearch && matchesCategory && matchesTag;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div style={{ color: 'var(--text-muted)' }}>Loading notes...</div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        {/* Header */}
        <header className="px-4 py-3" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                <ArrowLeft className="w-5 h-5" />
                <MessageCircle className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Chat</span>
              </Link>
              <div className="flex items-center space-x-2">
                <StickyNote className="w-6 h-6" style={{ color: 'var(--accent-blue)' }} />
                <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Quick Notes</h1>
              </div>
            </div>

            <button
              onClick={() => setShowNewNoteForm(!showNewNoteForm)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Quick Note</span>
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg pl-10 pr-4 py-2 focus:outline-none transition-colors"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="rounded-lg px-4 py-2 focus:outline-none transition-colors"
              style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">All Tags</option>
              {tags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          {/* New/Edit Note Form */}
          {showNewNoteForm && (
            <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                {editingNote ? 'Edit Note' : 'Quick Note'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Simple Text Area */}
                <div>
                  <textarea
                    placeholder="Write your note here..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    className="w-full rounded-lg px-4 py-3 focus:outline-none resize-y transition-colors"
                    style={{ 
                      backgroundColor: 'var(--bg-tertiary)', 
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                    required
                  />
                </div>

                {/* Predefined Tags */}
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Select Tags:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {predefinedTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => togglePredefinedTag(tag)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                          formData.tags.includes(tag) ? 'text-white' : ''
                        }`}
                        style={formData.tags.includes(tag) 
                          ? { backgroundColor: 'var(--accent-blue)', border: '1px solid var(--accent-blue)' }
                          : { backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }
                        }
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Tag Input */}
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add custom tag..."
                      value={formData.customTag}
                      onChange={(e) => setFormData({ ...formData, customTag: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                      className="flex-1 rounded-lg px-3 py-2 focus:outline-none transition-colors"
                      style={{ 
                        backgroundColor: 'var(--bg-tertiary)', 
                        border: '1px solid var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={addCustomTag}
                      className="px-4 py-2 rounded-lg transition-all hover:opacity-90"
                      style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Selected Tags */}
                {formData.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Selected Tags:</label>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-full text-sm flex items-center gap-1 text-white"
                          style={{ backgroundColor: 'var(--accent-blue)' }}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:opacity-70 transition-opacity"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
                  >
                    {editingNote ? 'Update Note' : 'Save Note'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 rounded-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notes List */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <StickyNote className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No notes found</h3>
                <p style={{ color: 'var(--text-muted)' }}>Create your first quick note to get started!</p>
              </div>
            ) : (
              filteredNotes.map(note => (
                <div
                  key={note.id}
                  className="rounded-lg p-4 transition-all hover:opacity-90"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => startEdit(note)}
                        className="transition-colors hover:opacity-70"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="transition-colors hover:opacity-70"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm mb-3 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                    {note.content}
                  </p>

                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded text-xs text-white"
                          style={{ backgroundColor: 'var(--accent-blue)' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-2" style={{ borderTop: '1px solid var(--border-primary)', color: 'var(--text-muted)' }}>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{note.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(note.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}