'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import Timer from '@/components/timer/timer';
import { joinRoom, leaveRoom, handlePresenceJoin, handlePresenceLeave } from '@/app/api/api';
import { NavBar } from '@/components/navBar/navbar';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const capyCharacters = [
    'capybara_default.png'
];

function getRandomCapyCharacter() {
    const randomIndex = Math.floor(Math.random() * capyCharacters.length);
    return `/capyCharacters/${capyCharacters[randomIndex]}`;
}

export default function RoomPage() {
    const { roomId } = useParams();
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const router = useRouter();
    const [currentUserUUID, setCurrentUserUUID] = useState(null);

    useEffect(() => {
        let channel;
        const setupRoom = async () => {
            try {
                const uuid = uuidv4();
                setCurrentUserUUID(uuid);

                const currentUserData = {
                    id: uuid,
                    username: 'current_username', // Replace with actual username
                    avatar: getRandomCapyCharacter()
                };

                await joinRoom(roomId, currentUserData);
                setUsers([currentUserData]); // Initialize users with only the current user

                // Set up Supabase real-time connection
                channel = supabase.channel(`room-${roomId}`);
                channel
                    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                        console.log('User joined:', newPresences);
                        newPresences.forEach(presence => handlePresenceJoin(roomId, presence));
                        setUsers(prevUsers => [
                            ...prevUsers,
                            ...newPresences.filter(newUser => !prevUsers.some(existingUser => existingUser.id === newUser.id))
                                .map(user => ({
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
                            await channel.track(currentUserData);
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
            if (currentUserUUID) {
                leaveRoom(roomId, currentUserUUID);
            }
        };
    }, [roomId]);

    const handleLeaveRoom = async () => {
        try {
            if (currentUserUUID) {
                await leaveRoom(roomId, currentUserUUID);
            }
            router.push('/'); // Redirect to home page or wherever you want after leaving
        } catch (error) {
            console.error('Error leaving room:', error);
            setError('Failed to leave the room. Please try again.');
        }
    };

    console.log('Current users:', users);

    if (error) {
        return <div className="alert alert-error">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-base-200">
            <NavBar />
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-2xl">Room {roomId}</h1>
                    <button onClick={handleLeaveRoom} className="btn btn-error btn-sm">Leave Room</button>
                </div>
                <div className="relative">
                    <div className="flex justify-center mb-[-10rem]">
                        <div className="flex flex-wrap gap-4 justify-center">
                            {users.map(user => (
                                <div key={user.id} className="flex flex-col items-center">
                                    <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden ring ring-primary ring-offset-base-100 ring-offset-2">
                                        <img
                                            src={user.avatar}
                                            alt={user.username}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <span className="badge badge-primary mt-2">{user.username}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Timer />
                </div>
            </div>
        </div>
    );
}