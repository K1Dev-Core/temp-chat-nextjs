import { NextRequest, NextResponse } from 'next/server';
import { updateNote, deleteNote, getNotes } from '@/lib/database';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const notes = getNotes();
        const note = notes.find(n => n.id === params.id);

        if (!note) {
            return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, note });
    } catch (error) {
        console.error('Error fetching note:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch note' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { title, content, category, tags, links } = body;

        // Validate required fields
        if (!title || !content) {
            return NextResponse.json(
                { success: false, error: 'Title and content are required' },
                { status: 400 }
            );
        }

        const updatedNote = updateNote(params.id, {
            title: title.trim(),
            content: content.trim(),
            category: category?.trim() || 'General',
            tags: Array.isArray(tags) ? tags.map((tag: string) => tag.trim()).filter(Boolean) : [],
            links: Array.isArray(links) ? links.map((link: string) => link.trim()).filter(Boolean) : [],
        });

        if (updatedNote) {
            return NextResponse.json({ success: true, note: updatedNote });
        } else {
            return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
        }

    } catch (error) {
        console.error('Error updating note:', error);
        return NextResponse.json({ success: false, error: 'Invalid request data' }, { status: 400 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const success = deleteNote(params.id);

        if (success) {
            return NextResponse.json({ success: true, message: 'Note deleted successfully' });
        } else {
            return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
        }

    } catch (error) {
        console.error('Error deleting note:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete note' }, { status: 500 });
    }
}