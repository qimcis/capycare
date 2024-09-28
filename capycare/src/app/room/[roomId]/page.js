'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Timer from '@/components/timer/timer';
import { joinRoom, leaveRoom, handlePresenceJoin, handlePresenceLeave } from '@/app/api/api'; 

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RoomPage() {
    const { roomId } = useParams();
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        let channel;

        const setupRoom = async () => {
            try {
                await joinRoom(roomId);

                // Set up Supabase real-time connection
                channel = supabase.channel(`room-${roomId}`);

                channel
                    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                        console.log('User joined:', newPresences);
                        newPresences.forEach(presence => handlePresenceJoin(roomId, presence));
                        setUsers(prevUsers => [...prevUsers, ...newPresences]);
                    })
                    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                        console.log('User left:', leftPresences);
                        leftPresences.forEach(presence => handlePresenceLeave(roomId, presence));
                        setUsers(prevUsers => prevUsers.filter(user => !leftPresences.find(left => left.id === user.id)));
                    })
                    .subscribe(async (status) => {
                        if (status === 'SUBSCRIBED') {
                            await channel.track({
                                user_id: 'current_user_id', // Replace with actual user ID
                                username: 'current_username', // Replace with actual username
                                avatar: 'current_user_avatar' // Replace with actual avatar URL
                            });
                        }
                    });

            } catch (error) {
                console.error('Error joining room:', error);
                setError('Failed to join the room. Please try again.');
            }
        };

        setupRoom();

        return () => {
            // Clean up function
            if (channel) {
                channel.unsubscribe();
            }
            leaveRoom(roomId, 'current_user_id'); // Replace with actual user ID
        };
    }, [roomId]);

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div>
            <h1>Room {roomId}</h1>
            <h2>Users in Room:</h2>
            <ul>
                {users.map(user => (
                    <li key={user.id}>{user.username}</li>
                ))}
            </ul>
            <Timer/>
        </div>
    );
}