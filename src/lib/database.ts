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

export interface Database {
    messages: Message[];
    onlineUsers: OnlineUser[];
}

export const readDatabase = (): Database => {
    try {
        if (!fs.existsSync(dbPath)) {
            const initialDb: Database = { messages: [], onlineUsers: [] };
            fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2));
            return initialDb;
        }
        const data = fs.readFileSync(dbPath, 'utf8');
        const db = JSON.parse(data);

        // Ensure onlineUsers array exists for backward compatibility
        if (!db.onlineUsers) {
            db.onlineUsers = [];
        }

        return db;
    } catch (error) {
        console.error('Error reading database:', error);
        return { messages: [], onlineUsers: [] };
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