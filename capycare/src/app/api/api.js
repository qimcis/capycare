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

function getRandomCapyCharacter() {
    const numberOfCapyCharacters = 15;
    const randomIndex = Math.floor(Math.random() * numberOfCapyCharacters) + 1;
    return `/images/capy${randomIndex}.png`;
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
        user.avatar = getRandomCapyCharacter(); 
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
        avatar: getRandomCapyCharacter() 
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

function starTimer(roomId) {
    const room = rooms.get(roomId);
    if (room) {
        room.status = 'playing';
        openRoom(roomId);
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
    getUserUUID
};