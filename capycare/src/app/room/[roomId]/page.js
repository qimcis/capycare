"use client";

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import Timer from '@/components/timer/timer';
import { joinRoom, leaveRoom, handlePresenceJoin, handlePresenceLeave, getRandomCapyCharacter } from '@/app/api/api';
import { NavBar } from '@/components/navBar/navbar';
import { ChatButton } from '@/components/chatButton/chatbutton';
import Image from 'next/image';
import { useState, useEffect } from 'react';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RoomPage() {
    const { roomId } = useParams();
    const searchParams = useSearchParams();
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const router = useRouter();
    const [currentUserUUID, setCurrentUserUUID] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [settings, setSettings] = useState({
        pomodoroTime: 25 * 60,
        breakTime: 5 * 60,
        isChatEnabled: true
    });
    const [timerState, setTimerState] = useState({
        time: settings.pomodoroTime,
        isRunning: false
    });

    useEffect(() => {
        let channel;
        const setupRoom = async () => {
            try {
                const uuid = uuidv4();
                setCurrentUserUUID(uuid);

                const username = searchParams.get('username') || 'Anonymous';
                const currentUserData = {
                    id: uuid,
                    username: username,
                    avatar: getRandomCapyCharacter()
                };

                await joinRoom(roomId, currentUserData);
                setUsers([currentUserData]);

                channel = supabase.channel(`room-${roomId}`);
                channel
                    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                        console.log('User joined:', newPresences);
                        newPresences.forEach(presence => handlePresenceJoin(roomId, presence));
                        setUsers(prevUsers => [
                            ...prevUsers,
                            ...newPresences.filter(newUser => !prevUsers.some(existingUser => existingUser.id === newUser.id))
                        ]);
                    })
                    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                        console.log('User left:', leftPresences);
                        leftPresences.forEach(presence => handlePresenceLeave(roomId, presence));
                        setUsers(prevUsers => prevUsers.filter(user => !leftPresences.find(left => left.id === user.id)));
                    })
                    .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
                        setMessages(prevMessages => [...prevMessages, payload]);
                    })
                    .on('broadcast', { event: 'timer_update' }, ({ payload }) => {
                        setTimerState(payload);
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
            if (channel) {
                channel.unsubscribe();
            }
            if (currentUserUUID) {
                leaveRoom(roomId, currentUserUUID);
            }
        };
    }, [roomId, searchParams]);

    const handleLeaveRoom = async () => {
        try {
            if (currentUserUUID) {
                await leaveRoom(roomId, currentUserUUID);
            }
            router.push('/'); 
        } catch (error) {
            console.error('Error leaving room:', error);
            setError('Failed to leave the room. Please try again.');
        }
    };

    const sendMessage = async () => {
        if (newMessage.trim() !== '' && settings.isChatEnabled) {
            const message = {
                id: uuidv4(),
                userId: currentUserUUID,
                username: users.find(user => user.id === currentUserUUID)?.username || 'Unknown User',
                text: newMessage,
                timestamp: new Date().toISOString(),
            };

            await supabase.channel(`room-${roomId}`).send({
                type: 'broadcast',
                event: 'chat_message',
                payload: message,
            });

            setNewMessage('');
        }
    };

    const handleSettingsChange = (newSettings) => {
        setSettings(newSettings);
    };

    const handleTimerChange = async (newState) => {
        setTimerState(newState);
        await supabase.channel(`room-${roomId}`).send({
            type: 'broadcast',
            event: 'timer_update',
            payload: newState,
        });
    };

    if (error) {
        return <div className="alert alert-error">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-base-200">
            <NavBar showSettings={true} onSettingsChange={handleSettingsChange} />
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-2xl">Room {roomId}</h1>
                    <button onClick={handleLeaveRoom} className="btn btn-error btn-sm">Leave Room</button>
                </div>
                <div className="flex flex-col items-center">
                    <div className="flex flex-wrap gap-8 justify-center mb-[-12rem]">
                        {users.map(user => (
                            <div key={user.id} className="flex flex-col items-center">
                                <Image
                                    src={user.avatar}
                                    alt={user.username}
                                    width={150}
                                    height={150}
                                />
                                <span className="badge badge-primary mt-2 mb-[-1rem]">{user.username}</span>
                            </div>
                        ))}
                    </div>
                    <Timer 
                        initialTime={timerState.time}
                        isRunningProp={timerState.isRunning}
                        onTimerChange={handleTimerChange}
                    />
                </div>
            </div>
            {settings.isChatEnabled && (
                <ChatButton 
                    messages={messages} 
                    sendMessage={sendMessage} 
                    newMessage={newMessage} 
                    setNewMessage={setNewMessage} 
                />
            )}
        </div>
    );
}