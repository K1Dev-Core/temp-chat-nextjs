import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.json');

export interface Message {
    id: string;
    text: string;
    timestamp: number;
    deleteAt: number;
    username: string;
    type: 'text' | 'image' | 'link';
    imageUrl?: string;
    linkUrl?: string;
    linkTitle?: string;
}

export interface OnlineUser {
    userId: string;
    username: string;
    lastSeen: number;
    joinedAt: number;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    links: string[];
    createdAt: number;
    updatedAt: number;
    author: string;
}

export interface Database {
    messages: Message[];
    onlineUsers: OnlineUser[];
    notes: Note[];
}

export const readDatabase = (): Database => {
    try {
        if (!fs.existsSync(dbPath)) {
            const initialDb: Database = { messages: [], onlineUsers: [], notes: [] };
            fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2));
            return initialDb;
        }
        const data = fs.readFileSync(dbPath, 'utf8');
        const db = JSON.parse(data);

        // Ensure onlineUsers array exists for backward compatibility
        if (!db.onlineUsers) {
            db.onlineUsers = [];
        }

        // Ensure notes array exists for backward compatibility
        if (!db.notes) {
            db.notes = [];
        }

        return db;
    } catch (error) {
        console.error('Error reading database:', error);
        return { messages: [], onlineUsers: [], notes: [] };
    }
};

export const writeDatabase = (data: Database): boolean => {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing database:', error);
        return false;
    }
};

export const addMessage = (message: Omit<Message, 'id' | 'timestamp'>): Message | null => {
    try {
        const db = readDatabase();
        const newMessage: Message = {
            ...message,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
        };

        db.messages.push(newMessage);

        if (writeDatabase(db)) {
            return newMessage;
        }
        return null;
    } catch (error) {
        console.error('Error adding message:', error);
        return null;
    }
};

export const getMessages = (): Message[] => {
    try {
        const db = readDatabase();
        const now = Date.now();

        const validMessages = db.messages.filter(msg => msg.deleteAt > now);

        if (validMessages.length !== db.messages.length) {
            db.messages = validMessages;
            writeDatabase(db);
        }

        return validMessages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
        console.error('Error getting messages:', error);
        return [];
    }
};

export const deleteExpiredMessages = (): number => {
    try {
        const db = readDatabase();
        const now = Date.now();
        const beforeCount = db.messages.length;

        db.messages = db.messages.filter(msg => msg.deleteAt > now);

        if (writeDatabase(db)) {
            return beforeCount - db.messages.length;
        }
        return 0;
    } catch (error) {
        console.error('Error deleting expired messages:', error);
        return 0;
    }
};

export const generateUsername = (userAgent?: string): string => {
    // Get browser and OS info for more device-based username
    let deviceType = 'User';
    let browserType = 'Web';

    if (userAgent) {
        if (userAgent.includes('iPhone') || userAgent.includes('iPad')) deviceType = 'iOS';
        else if (userAgent.includes('Android')) deviceType = 'Android';
        else if (userAgent.includes('Windows')) deviceType = 'Windows';
        else if (userAgent.includes('Mac')) deviceType = 'Mac';
        else if (userAgent.includes('Linux')) deviceType = 'Linux';

        if (userAgent.includes('Chrome')) browserType = 'Chrome';
        else if (userAgent.includes('Firefox')) browserType = 'Firefox';
        else if (userAgent.includes('Safari')) browserType = 'Safari';
        else if (userAgent.includes('Edge')) browserType = 'Edge';
    }

    const number = Math.floor(Math.random() * 1000);
    return `${deviceType}${browserType}${number}`;
};

// Generate a persistent user ID based on browser fingerprint
export const generateUserId = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `user_${timestamp}_${random}`;
};

// Online Users Management
export const updateUserOnlineStatus = (userId: string, username: string): boolean => {
    try {
        const db = readDatabase();
        const now = Date.now();

        const existingUserIndex = db.onlineUsers.findIndex(user => user.userId === userId);

        if (existingUserIndex >= 0) {
            // Update existing user's last seen time
            db.onlineUsers[existingUserIndex].lastSeen = now;
            db.onlineUsers[existingUserIndex].username = username; // Update username in case it changed
        } else {
            // Add new online user
            db.onlineUsers.push({
                userId,
                username,
                lastSeen: now,
                joinedAt: now
            });
        }

        return writeDatabase(db);
    } catch (error) {
        console.error('Error updating user online status:', error);
        return false;
    }
};

export const getOnlineUsers = (): OnlineUser[] => {
    try {
        const db = readDatabase();
        const now = Date.now();
        const onlineThreshold = 10000; // 10 seconds

        // Filter users who were active within the last 10 seconds
        const activeUsers = db.onlineUsers.filter(user =>
            now - user.lastSeen < onlineThreshold
        );

        // Update database to remove inactive users
        if (activeUsers.length !== db.onlineUsers.length) {
            db.onlineUsers = activeUsers;
            writeDatabase(db);
        }

        return activeUsers;
    } catch (error) {
        console.error('Error getting online users:', error);
        return [];
    }
};

export const removeUserFromOnline = (userId: string): boolean => {
    try {
        const db = readDatabase();
        db.onlineUsers = db.onlineUsers.filter(user => user.userId !== userId);
        return writeDatabase(db);
    } catch (error) {
        console.error('Error removing user from online:', error);
        return false;
    }
};

// Notes Management
export const addNote = (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note | null => {
    try {
        const db = readDatabase();
        const now = Date.now();
        const newNote: Note = {
            ...note,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: now,
            updatedAt: now,
        };

        db.notes.push(newNote);

        if (writeDatabase(db)) {
            return newNote;
        }
        return null;
    } catch (error) {
        console.error('Error adding note:', error);
        return null;
    }
};

export const getNotes = (): Note[] => {
    try {
        const db = readDatabase();
        return db.notes.sort((a, b) => b.updatedAt - a.updatedAt); // Sort by most recently updated
    } catch (error) {
        console.error('Error getting notes:', error);
        return [];
    }
};

export const updateNote = (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>): Note | null => {
    try {
        const db = readDatabase();
        const noteIndex = db.notes.findIndex(note => note.id === id);

        if (noteIndex === -1) {
            return null;
        }

        db.notes[noteIndex] = {
            ...db.notes[noteIndex],
            ...updates,
            updatedAt: Date.now(),
        };

        if (writeDatabase(db)) {
            return db.notes[noteIndex];
        }
        return null;
    } catch (error) {
        console.error('Error updating note:', error);
        return null;
    }
};

export const deleteNote = (id: string): boolean => {
    try {
        const db = readDatabase();
        const originalLength = db.notes.length;
        db.notes = db.notes.filter(note => note.id !== id);

        if (db.notes.length < originalLength) {
            return writeDatabase(db);
        }
        return false;
    } catch (error) {
        console.error('Error deleting note:', error);
        return false;
    }
};

export const getNotesByCategory = (category: string): Note[] => {
    try {
        const db = readDatabase();
        return db.notes
            .filter(note => note.category === category)
            .sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
        console.error('Error getting notes by category:', error);
        return [];
    }
};

export const getNotesByTag = (tag: string): Note[] => {
    try {
        const db = readDatabase();
        return db.notes
            .filter(note => note.tags.includes(tag))
            .sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
        console.error('Error getting notes by tag:', error);
        return [];
    }
};

export const getAllCategories = (): string[] => {
    try {
        const db = readDatabase();
        const categories = [...new Set(db.notes.map(note => note.category))];
        return categories.filter(cat => cat && cat.trim() !== '');
    } catch (error) {
        console.error('Error getting categories:', error);
        return [];
    }
};

export const getAllTags = (): string[] => {
    try {
        const db = readDatabase();
        const allTags = db.notes.flatMap(note => note.tags);
        return [...new Set(allTags)].filter(tag => tag && tag.trim() !== '');
    } catch (error) {
        console.error('Error getting tags:', error);
        return [];
    }
};

export const searchNotes = (query: string): Note[] => {
    try {
        const db = readDatabase();
        const lowerQuery = query.toLowerCase();

        return db.notes
            .filter(note =>
                note.title.toLowerCase().includes(lowerQuery) ||
                note.content.toLowerCase().includes(lowerQuery) ||
                note.category.toLowerCase().includes(lowerQuery) ||
                note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
            )
            .sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
        console.error('Error searching notes:', error);
        return [];
    }
};