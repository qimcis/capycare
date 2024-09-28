import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const rooms = new Map()

function createRoom() {
    const roomId = uuidv4();
    rooms.set(roomId, {users: [], status: 'waiting'})
    return roomId
}

function handler(req, res) {
    if (req.method === 'POST') {
        const roomId = createRoom();
        return res.status(200).json({ roomId });
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}

// NOTE
function joinRoom() {
    const room = rooms.get(roomId)
    if (room && room.status === 'waiting') {
        room.users.push(user)
        startGame(roomId)
    }
    return true
  }

function leaveRoom() {
    const room = rooms.get(roomId)
    if (room) {
        room.players = room.players.filter(p => p.id !== playerId)
    }
}

function handlePresenceJoin(roomId, presence) {
    const newUser = {
        id: presence.user_id,
        name: presence.username,
        avatar: presence.avatar
    }
    
    if (joinRoom(roomId, newUser)) {
        const room = rooms.get(roomId)
        console.log(`User joined room ${roomId}:`, newPlayer)
        console.log(`Updated players in room ${roomId}:`, room.players)
    }
}

function handlePresenceLeave(roomId, leftPresence) {
    leaveRoom(roomId, leftPresence.user_id)
    const room = gameRooms.get(roomId)
    if (room) {
        console.log(`User left room ${roomId}:`, leftPresence.user_id)
        console.log(`Updated players in room ${roomId}:`, room.players)
    }
}

function openRoom(roomId) {
    console.log(`Session started in room ${roomId}`)
    supabase.channel(`room-${roomId}`)
      .send({
        type: 'broadcast',
        event: 'room-open',
        payload: { roomId }
      })
}


function closeRoom(roomId) {
    console.log(`Session stopped in room ${roomId}`)
    supabase.channel(`room-${roomId}`)
      .send({
        type: 'broadcast',
        event: 'room-close',
        payload: { roomId }
      })
  }

  export {
    createRoom,
    joinRoom,
    leaveRoom,
    handlePresenceJoin,
    handlePresenceLeave,
    openRoom,
    closeRoom
  }
  