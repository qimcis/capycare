import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const rooms = new Map();
const userUUIDs = new Map(); // Map to store user_id to UUID mapping

function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const capyCharacters = Array.from({ length: 15 }, (_, index) => `/images/capy${index + 1}.png`);

function getRandomCapyCharacter() {
    const randomIndex = Math.floor(Math.random() * capyCharacters.length);
    return capyCharacters[randomIndex];
}

// Get avatar based on existing mapping or create a new one
function getUserAvatar(user) {
    const room = rooms.get(user.roomId);
    const existingUser = room.users.find((u) => u.id === user.id);
    if (existingUser) {
        return existingUser.avatar;
    } else {
        const newAvatar = getRandomCapyCharacter();
        return newAvatar;
    }
}

function createRoom() {
    let roomId;
    do {
        roomId = generateRoomCode();
    } while (rooms.has(roomId));
    rooms.set(roomId, { users: [], status: 'waiting' });
    return roomId;
}

function joinRoom(roomId, user) {
    const room = rooms.get(roomId);
    if (room && room.status === 'waiting') {
        const uuid = uuidv4();
        userUUIDs.set(user.id, uuid);
        user.uuid = uuid; 
        user.avatar = getUserAvatar(user); // Either get an existing or assign a new avatar

        room.users.push(user);
        if (room.users.length === 1) {
            startGame(roomId);
        }
        return true;
    }
    return false;
}

function leaveRoom(roomId, userId) {
    const room = rooms.get(roomId);
    if (room) {
        room.users = room.users.filter(user => user.id !== userId);
        if (room.users.length === 0) {
            rooms.delete(roomId);
        }
        // Remove UUID when user leaves
        userUUIDs.delete(userId);
    }
}

function handlePresenceJoin(roomId, presence) {
    const newUser = {
        id: presence.user_id,
        name: presence.username,
        roomId: roomId,
    };

    if (joinRoom(roomId, newUser)) {
        const room = rooms.get(roomId);
        console.log(`User joined room ${roomId}:`, newUser);
        console.log(`Updated users in room ${roomId}:`, room.users);
    }
}

function handlePresenceLeave(roomId, leftPresence) {
    leaveRoom(roomId, leftPresence.user_id);
    const room = rooms.get(roomId);
    if (room) {
        console.log(`User left room ${roomId}:`, leftPresence.user_id);
        console.log(`Updated users in room ${roomId}:`, room.users);
    }
}

function openRoom(roomId) {
    console.log(`Session started in room ${roomId}`);
    supabase.channel(`room-${roomId}`)
      .send({
        type: 'broadcast',
        event: 'room-open',
        payload: { roomId }
      });
}

function closeRoom(roomId) {
    console.log(`Session stopped in room ${roomId}`);
    supabase.channel(`room-${roomId}`)
      .send({
        type: 'broadcast',
        event: 'room-close',
        payload: { roomId }
      });
}

// Start game or session
function startGame(roomId) {
    const room = rooms.get(roomId);
    if (room) {
        room.status = 'playing';
        openRoom(roomId);
    }
}

// Randomize avatar only for the current user when they reload the page
function randomizeOwnAvatar(userId, roomId) {
    const room = rooms.get(roomId);
    const user = room.users.find(u => u.id === userId);
    if (user) {
        user.avatar = getRandomCapyCharacter();
    }
}

function getUserUUID(userId) {
    return userUUIDs.get(userId);
}

export {
    getRandomCapyCharacter,
    createRoom,
    joinRoom,
    leaveRoom,
    handlePresenceJoin,
    handlePresenceLeave,
    openRoom,
    closeRoom,
    randomizeOwnAvatar,
    getUserUUID
};
