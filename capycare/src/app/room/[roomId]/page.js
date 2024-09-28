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

const capyCharacters = [
    'capybara_default.png'
]

function getRandomCapyCharacter() {
    const randomIndex = Math.floor(Math.random() * capyCharacters.length);
    return `/capyCharacters/${capyCharacters[randomIndex]}`;
}

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
                        setUsers(prevUsers => [
                            ...prevUsers,
                            ...newPresences.map(user => ({
                                ...user,
                                avatar: getRandomCapyCharacter()
                            }))
                        ]);
                    })
                    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                        console.log('User left:', leftPresences);
                        leftPresences.forEach(presence => handlePresenceLeave(roomId, presence));
                        setUsers(prevUsers => prevUsers.filter(user => !leftPresences.find(left => left.id === user.id)));
                    })
                    .subscribe(async (status) => {
                        if (status === 'SUBSCRIBED') {
                            const userData = {
                                id: 'current_user_id', // Replace with actual user ID
                                username: 'current_username', // Replace with actual username
                                avatar: getRandomCapyCharacter()
                            };
                            await channel.track(userData);
                            setUsers(prevUsers => [...prevUsers, userData]);
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

    console.log('Current users:', users);

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl mb-10">Room {roomId}</h1>
            <div className="relative">
                <div className="flex justify-center mb-[-10rem]">
                    <div className="flex flex-wrap gap-4 justify-center">
                        {users.map(user => (
                            <div key={user.id} className="flex flex-col items-center">
                                <div 
                                    className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden"
                                >
                                    <img
                                        src={user.avatar}
                                        alt={user.username}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="text-sm mt-1">{user.username}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <Timer />
            </div>
        </div>
        
    );
}