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

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        updateBackground(savedTheme);

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
        if (timerState.isPomodoro) {
            setTimerState(prevState => ({
                ...prevState,
                time: newSettings.pomodoroTime * 60
            }));
        }
    };

    const handleTimerChange = async (newState) => {
        setTimerState(newState);
        await supabase.channel(`room-${roomId}`).send({
            type: 'broadcast',
            event: 'timer_update',
            payload: newState,
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
            <div className={`container mx-auto p-4 `}>
                <div className="flex justify-between items-center mb-10">
                    <h1 className={`text-2xl ${textColorClass}`}>Room {roomId}</h1>
                    <button onClick={handleLeaveRoom} className={`btn btn-error btn-sm ${textColorClass}`}>Leave Room</button>
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
                                <span className={`badge mt-2 mb-[-1rem]`}>{user.username}</span>
                            </div>
                        ))}
                    </div>
                    <Timer 
                        initialTime={timerState.time}
                        isRunningProp={timerState.isRunning}
                        onTimerChange={handleTimerChange}
                        settings={settings}
                        theme={theme}
                    />
                </div>
                <div className="mt-8"> 
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