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
    
    // State to manage the positions and directions of capybaras
    const [capyPositions, setCapyPositions] = useState({});

    useEffect(() => {
        let channel;
        let animationFrameId;
    
        const setupRoom = async () => {
            try {
                const uuid = uuidv4();
                setCurrentUserUUID(uuid);
    
                const username = searchParams.get('username') || 'Anonymous';
                const currentUserData = {
                    id: uuid,
                    username: username,
                    avatar: getRandomCapyCharacter(),
                };
    
                await joinRoom(roomId, currentUserData);
                setUsers([currentUserData]);
    
                setCapyPositions((prev) => ({
                    ...prev,
                    [uuid]: { direction: 'right', x: 0, y: 0, bob: 0, moving: true, bobbingUp: true }
                }));
    
                channel = supabase.channel(`room-${roomId}`);
                channel
                    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                        newPresences.forEach(presence => handlePresenceJoin(roomId, presence));
                        setUsers(prevUsers => [
                            ...prevUsers,
                            ...newPresences.filter(newUser => !prevUsers.some(existingUser => existingUser.id === newUser.id)),
                        ]);
    
                        newPresences.forEach(presence => {
                            const id = presence.user_id;
                            setCapyPositions(prev => ({
                                ...prev,
                                [id]: { direction: 'right', x: 0, y: 0, bob: 0, moving: true, bobbingUp: true }
                            }));
                        });
                    })
                    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                        leftPresences.forEach(presence => handlePresenceLeave(roomId, presence));
                        setUsers(prevUsers => prevUsers.filter(user => !leftPresences.find(left => left.id === user.id)));
    
                        leftPresences.forEach(presence => {
                            const id = presence.user_id;
                            setCapyPositions(prev => {
                                const { [id]: removed, ...rest } = prev;
                                return rest;
                            });
                        });
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
    
                const moveCapybaras = () => {
                    setCapyPositions(prev => {
                        const newPositions = { ...prev };
                        Object.keys(newPositions).forEach(id => {
                            const capybara = newPositions[id];
                            if (!capybara.moving) {
                                // Smooth return to default Y position
                                if (capybara.bob !== 0) {
                                    newPositions[id].bob = capybara.bob > 0 ? capybara.bob - 0.1 : capybara.bob + 0.1;
                                    if (Math.abs(capybara.bob) < 0.1) newPositions[id].bob = 0;
                                }
                                return;
                            }
                
                            const currentDirection = capybara.direction;
                            const moveAmount = 0.2; // Smaller movement for smoother animation
                            const bobbingSpeed = 0.1; // Slower bobbing for smoother effect
                            const maxBob = 5;
                            const shouldPause = Math.random() > 0.995; // Reduced chance to pause for smoother movement
                
                            if (shouldPause) {
                                capybara.moving = false;
                                setTimeout(() => {
                                    setCapyPositions(prevState => ({
                                        ...prevState,
                                        [id]: { ...prevState[id], moving: true }
                                    }));
                                }, Math.random() * 3000 + 1000);
                            }
                
                            const shouldChangeDirection = Math.random() > 0.998; // Very low chance to change direction
                            const newDirection = shouldChangeDirection
                                ? currentDirection === 'left' ? 'right' : 'left'
                                : currentDirection;
                
                            newPositions[id].direction = newDirection;
                            newPositions[id].x += newDirection === 'right' ? moveAmount : -moveAmount;
                
                            // Smoother bobbing logic
                            if (capybara.bobbingUp) {
                                newPositions[id].bob += bobbingSpeed;
                                if (newPositions[id].bob >= maxBob) {
                                    newPositions[id].bobbingUp = false;
                                }
                            } else {
                                newPositions[id].bob -= bobbingSpeed;
                                if (newPositions[id].bob <= 0) {
                                    newPositions[id].bob = 0;
                                    newPositions[id].bobbingUp = true;
                                }
                            }
                
                            // Keep within horizontal bounds
                            newPositions[id].x = Math.min(400, Math.max(-400, newPositions[id].x));
                        });
                        return newPositions;
                    });
                    
                    animationFrameId = requestAnimationFrame(moveCapybaras);
                };
    
                moveCapybaras(); // Start the animation loop
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
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
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
                            <div
                                key={user.id}
                                className="flex flex-col items-center"
                                style={{
                                    transform: `translateX(${capyPositions[user.id]?.x}px) translateY(${capyPositions[user.id]?.y}px)`,
                                    transition: 'transform 0.05s linear', // Smoother transition
                                }}
                            >
                                <Image
                                    src={user.avatar}
                                    alt={user.username}
                                    width={150}
                                    height={150}
                                    style={{
                                        transform: `
                                            translateY(${capyPositions[user.id]?.bob}px) 
                                            scaleX(${capyPositions[user.id]?.direction === 'right' ? -1 : 1})
                                        `,
                                        transition: 'transform 0.05s linear', // Smoother transition
                                    }}
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