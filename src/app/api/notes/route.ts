import { NextRequest, NextResponse } from 'next/server';
import { addNote, getNotes, getAllCategories, getAllTags, searchNotes } from '@/lib/database';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const tag = searchParams.get('tag');
        const search = searchParams.get('search');
        const action = searchParams.get('action');

        // Handle different query types
        if (action === 'categories') {
            const categories = getAllCategories();
            return NextResponse.json({ success: true, categories });
        }

        if (action === 'tags') {
            const tags = getAllTags();
            return NextResponse.json({ success: true, tags });
        }

        if (search) {
            const notes = searchNotes(search);
            return NextResponse.json({ success: true, notes });
        }

        // For now, return all notes (filtering will be handled client-side)
        const notes = getNotes();
        return NextResponse.json({ success: true, notes });

    } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch notes' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, content, category, tags, links, author } = body;

        // Validate required fields
        if (!title || !content || !author) {
            return NextResponse.json(
                { success: false, error: 'Title, content, and author are required' },
                { status: 400 }
            );
        }

        // Create new note
        const newNote = addNote({
            title: title.trim(),
            content: content.trim(),
            category: category?.trim() || 'General',
            tags: Array.isArray(tags) ? tags.map((tag: string) => tag.trim()).filter(Boolean) : [],
            links: Array.isArray(links) ? links.map((link: string) => link.trim()).filter(Boolean) : [],
            author: author.trim(),
        });

        if (newNote) {
            return NextResponse.json({ success: true, note: newNote }, { status: 201 });
        } else {
            return NextResponse.json({ success: false, error: 'Failed to create note' }, { status: 500 });
        }

    } catch (error) {
        console.error('Error creating note:', error);
        return NextResponse.json({ success: false, error: 'Invalid request data' }, { status: 400 });
    }
}