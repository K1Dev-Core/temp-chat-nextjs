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
        title: '',
        content: '',
        category: '',
        tags: [] as string[],
        links: [] as string[],
        tagInput: '',
        linkInput: ''
    });

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

        if (!formData.title.trim() || !formData.content.trim()) {
            alert('Title and content are required');
            return;
        }

        try {
            const noteData = {
                title: formData.title,
                content: formData.content,
                category: formData.category || 'General',
                tags: formData.tags,
                links: formData.links,
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
            title: '',
            content: '',
            category: '',
            tags: [],
            links: [],
            tagInput: '',
            linkInput: ''
        });
        setShowNewNoteForm(false);
        setEditingNote(null);
    };

    const startEdit = (note: Note) => {
        setFormData({
            title: note.title,
            content: note.content,
            category: note.category,
            tags: [...note.tags],
            links: [...note.links],
            tagInput: '',
            linkInput: ''
        });
        setEditingNote(note);
        setShowNewNoteForm(true);
    };

    const addTag = () => {
        if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...formData.tags, formData.tagInput.trim()],
                tagInput: ''
            });
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(tag => tag !== tagToRemove)
        });
    };

    const addLink = () => {
        if (formData.linkInput.trim() && !formData.links.includes(formData.linkInput.trim())) {
            setFormData({
                ...formData,
                links: [...formData.links, formData.linkInput.trim()],
                linkInput: ''
            });
        }
    };

    const removeLink = (linkToRemove: string) => {
        setFormData({
            ...formData,
            links: formData.links.filter(link => link !== linkToRemove)
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
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                    <div className="text-gray-400">Loading notes...</div>
                </div>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <div className="min-h-screen bg-gray-900 text-gray-100">
                {/* Header */}
                <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                                <MessageCircle className="w-5 h-5" />
                                <span className="hidden sm:inline">Back to Chat</span>
                            </Link>
                            <div className="flex items-center space-x-2">
                                <StickyNote className="w-6 h-6 text-blue-400" />
                                <h1 className="text-xl font-semibold">Notes</h1>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowNewNoteForm(!showNewNoteForm)}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">New Note</span>
                        </button>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto px-4 py-6">
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search notes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">All Categories</option>
                            {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>

                        <select
                            value={selectedTag}
                            onChange={(e) => setSelectedTag(e.target.value)}
                            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">All Tags</option>
                            {tags.map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                    </div>

                    {/* New/Edit Note Form */}
                    {showNewNoteForm && (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
                            <h2 className="text-xl font-semibold mb-4">
                                {editingNote ? 'Edit Note' : 'Create New Note'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Note title..."
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <textarea
                                        placeholder="Write your note content..."
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        rows={6}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-y"
                                        required
                                    />
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        placeholder="Category (e.g., Work, Personal, Ideas)"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>

                                {/* Tags */}
                                <div>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Add tags..."
                                            value={formData.tagInput}
                                            onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={addTag}
                                            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                                        >
                                            <Tag className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="bg-blue-600 text-blue-100 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="hover:text-red-300 transition-colors"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Links */}
                                <div>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="url"
                                            placeholder="Add links..."
                                            value={formData.linkInput}
                                            onChange={(e) => setFormData({ ...formData, linkInput: e.target.value })}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={addLink}
                                            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.links.map(link => (
                                            <div
                                                key={link}
                                                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 flex items-center justify-between"
                                            >
                                                <a
                                                    href={link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 transition-colors truncate"
                                                >
                                                    {link}
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => removeLink(link)}
                                                    className="text-gray-400 hover:text-red-400 transition-colors ml-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
                                    >
                                        {editingNote ? 'Update Note' : 'Create Note'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition-colors"
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
                            <div className="col-span-full text-center py-12 text-gray-400">
                                <StickyNote className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                                <h3 className="text-lg font-medium mb-2">No notes found</h3>
                                <p>Create your first note to get started!</p>
                            </div>
                        ) : (
                            filteredNotes.map(note => (
                                <div
                                    key={note.id}
                                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-semibold text-lg text-gray-100 line-clamp-2">
                                            {note.title}
                                        </h3>
                                        <div className="flex items-center gap-2 ml-2">
                                            <button
                                                onClick={() => startEdit(note)}
                                                className="text-gray-400 hover:text-blue-400 transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(note.id)}
                                                className="text-gray-400 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                                        {note.content}
                                    </p>

                                    {note.category && (
                                        <div className="flex items-center gap-1 mb-2">
                                            <Hash className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs text-gray-400">{note.category}</span>
                                        </div>
                                    )}

                                    {note.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {note.tags.map(tag => (
                                                <span
                                                    key={tag}
                                                    className="bg-blue-600 text-blue-100 px-2 py-1 rounded text-xs"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {note.links.length > 0 && (
                                        <div className="space-y-1 mb-3">
                                            {note.links.map(link => (
                                                <a
                                                    key={link}
                                                    href={link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block text-blue-400 hover:text-blue-300 text-xs truncate transition-colors"
                                                >
                                                    <ExternalLink className="w-3 h-3 inline mr-1" />
                                                    {link}
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-700 pt-2">
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