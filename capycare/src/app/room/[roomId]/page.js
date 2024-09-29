"use client";
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import Timer from '@/components/timer/timer';
import { joinRoom, leaveRoom, handlePresenceJoin, handlePresenceLeave, getRandomCapyCharacter } from '@/app/api/api';
import { NavBar } from '@/components/navBar/navbar';
import { ChatButton } from '@/components/chatButton/chatbutton';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import TaskList from '@/components/taskList/tasklist';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RoomPage() {
    const [theme, setTheme] = useState('light');
    const [backgroundImage, setBackgroundImage] = useState('/images/daytime.png');
    const { roomId } = useParams();
    const searchParams = useSearchParams();
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const router = useRouter();
    const [currentUserUUID, setCurrentUserUUID] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [settings, setSettings] = useState({
        pomodoroTime: 25,
        shortBreakTime: 5,
        longBreakTime: 15,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        isChatEnabled: true
    });
    const [timerState, setTimerState] = useState({
        time: settings.pomodoroTime * 60,
        isRunning: false,
        isPomodoro: true
    });
    
    const [capyPositions, setCapyPositions] = useState({});
    const animationInterval = useRef(null);
    const channelRef = useRef(null);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        updateBackground(savedTheme);

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

                const channel = supabase.channel(`room-${roomId}`);
                channelRef.current = channel;

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
                    .on('broadcast', { event: 'capy_position_update' }, ({ payload }) => {
                        setCapyPositions(prev => ({
                            ...prev,
                            [payload.id]: payload.position
                        }));
                    })
                    .subscribe(async (status) => {
                        if (status === 'SUBSCRIBED') {
                            await channel.track(currentUserData);
                            startAnimation();
                        }
                    });

            } catch (error) {
                console.error('Error joining room:', error);
                setError('Failed to join the room. Please try again.');
            }
        };

        setupRoom();

        return () => {
            if (channelRef.current) {
                channelRef.current.unsubscribe();
            }
            if (currentUserUUID) {
                leaveRoom(roomId, currentUserUUID);
            }
            if (animationInterval.current) {
                clearInterval(animationInterval.current);
            }
        };
    }, [roomId, searchParams]);

    useEffect(() => {
        if (channelRef.current) {
            channelRef.current.on('broadcast', { event: 'capy_position_update' }, ({ payload }) => {
                setCapyPositions(prev => ({
                    ...prev,
                    [payload.id]: {
                        ...prev[payload.id],
                        ...payload.position
                    }
                }));
            });
        }
    }, [channelRef.current]);

    const startAnimation = () => {
// Replace your `moveCapybaras` function with this one
const moveCapybaras = () => {
    setCapyPositions(prev => {
        const newPositions = { ...prev };
        Object.keys(newPositions).forEach(id => {
            let capybara = newPositions[id];
            
            // Initialize if undefined
            if (!capybara) {
                capybara = newPositions[id] = {
                    direction: 'right',
                    x: 0,
                    y: 0,
                    bob: 0,
                    moving: true,
                    bobbingUp: true
                };
            }

            // If the capybara is paused or idle, handle bobbing
            if (!capybara.moving) {
                if (capybara.bob !== 0) {
                    capybara.bob = capybara.bob > 0 ? capybara.bob - 0.1 : capybara.bob + 0.1;
                    if (Math.abs(capybara.bob) < 0.1) capybara.bob = 0;
                }
                return;
            }

            // Movement logic
            const currentDirection = capybara.direction;
            const moveAmount = 0.2;
            const bobbingSpeed = 0.1;
            const maxBob = 5;
            const shouldPause = Math.random() > 0.995;

            // Random pause
            if (shouldPause) {
                capybara.moving = false;
                setTimeout(() => {
                    setCapyPositions(prevState => ({
                        ...prevState,
                        [id]: { ...prevState[id], moving: true }
                    }));
                }, Math.random() * 3000 + 1000);
            }

            // Random direction change
            const shouldChangeDirection = Math.random() > 0.998;
            const newDirection = shouldChangeDirection
                ? currentDirection === 'left' ? 'right' : 'left'
                : currentDirection;

            capybara.direction = newDirection;
            capybara.x += newDirection === 'right' ? moveAmount : -moveAmount;

            // Bobbing animation
            if (capybara.bobbingUp) {
                capybara.bob += bobbingSpeed;
                if (capybara.bob >= maxBob) {
                    capybara.bobbingUp = false;
                }
            } else {
                capybara.bob -= bobbingSpeed;
                if (capybara.bob <= 0) {
                    capybara.bob = 0;
                    capybara.bobbingUp = true;
                }
            }

            capybara.x = Math.min(400, Math.max(-400, capybara.x));
        });

        // Broadcast each capybara's position, not just the current user's
        if (channelRef.current) {
            Object.keys(newPositions).forEach(userId => {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'capy_position_update',
                    payload: {
                        id: userId,
                        position: newPositions[userId]
                    },
                });
            });
        }

        return newPositions;
    });
};

    
        // Use setInterval for more consistent timing across devices
        animationInterval.current = setInterval(moveCapybaras, 16); // ~60 FPS
    };

    const updateBackground = (newTheme) => {
        const newBackgroundImage = newTheme === 'light'
            ? '/images/daytime.png'
            : '/images/nighttime.png';
        setBackgroundImage(newBackgroundImage);
    };

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        updateBackground(newTheme);
        localStorage.setItem('theme', newTheme);
    };

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
        setTimerState(prevState => ({
            ...prevState,
            time: prevState.isPomodoro 
                ? newSettings.pomodoroTime * 60 
                : prevState.isShortBreak 
                    ? newSettings.shortBreakTime * 60 
                    : newSettings.longBreakTime * 60
        }));
    };    

    const handleTimerChange = async (newState) => {
        const updatedState = {
            ...newState,
            time: newState.time, // Ensure this is in seconds
        };
        setTimerState(updatedState);
        await supabase.channel(`room-${roomId}`).send({
            type: 'broadcast',
            event: 'timer_update',
            payload: updatedState,
        });
    };

    const textColorClass = theme === 'light' ? 'text-gray-800' : 'text-white';
    const bgColorClass = theme === 'light' ? 'bg-white' : 'bg-gray-800';

    if (error) {
        return <div className={`alert alert-error ${textColorClass}`}>{error}</div>;
    }

    return (
        <div 
        className={`min-h-screen flex flex-col ${textColorClass}`}
        style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        }}
        >   
            <NavBar 
                showSettings={true} 
                onSettingsChange={handleSettingsChange}
                settings={settings}
                onThemeChange={handleThemeChange}
                currentTheme={theme}
            />
            <div className={`container mx-auto p-4`}>
                <div className="flex justify-between items-center mb-10">
                    <h1 className={`text-2xl ${textColorClass}`}>Room {roomId}</h1>
                    <button onClick={handleLeaveRoom} className={`btn btn-error btn-sm ${textColorClass}`}>Leave Room</button>
                </div>
                <div className="flex flex-col items-center">
                    <div className="flex flex-wrap gap-8 justify-center mb-[-12rem]">
                        {users.map(user => (
                            <div
                                key={user.id}
                                className="flex flex-col items-center"
                                style={{
                                    transform: `translateX(${capyPositions[user.id]?.x || 0}px) translateY(${capyPositions[user.id]?.y || 0}px)`,
                                    transition: 'transform 0.05s linear',
                                }}
                            >
                                <Image
                                    src={user.avatar}
                                    alt={user.username}
                                    width={150}
                                    height={150}
                                    style={{
                                        transform: `
                                            translateY(${capyPositions[user.id]?.bob || 0}px) 
                                            scaleX(${(capyPositions[user.id]?.direction === 'right' ? -1 : 1) || 1})
                                        `,
                                        transition: 'transform 0.05s linear',
                                    }}
                                />
                                <span className={`badge mt-2 mb-[-1rem]`}>{user.username}</span>
                            </div>
                        ))}
                    </div>
                    <Timer 
                        initialTime={timerState.time} // Pass the time in seconds
                        isRunningProp={timerState.isRunning}
                        onTimerChange={handleTimerChange}
                        settings={settings}
                        theme={theme}
                        pomodoroTime={settings.pomodoroTime * 60} // Convert to seconds
                        shortBreakTime={settings.shortBreakTime * 60} // Convert to seconds
                        longBreakTime={settings.longBreakTime * 60} // Convert to seconds
                    />
                </div>
                <div className="mt-8 mb-[-10rem]"> 
                    {/* This empty div ensures there's space above the TaskList */}
                </div>
                <div className="mt-20">
                    <TaskList theme={theme} />
                </div>
            </div>
            {settings.isChatEnabled && (
                <ChatButton 
                    messages={messages} 
                    sendMessage={sendMessage} 
                    newMessage={newMessage} 
                    setNewMessage={setNewMessage} 
                    theme={theme}
                />
            )}
        </div>
    );
}