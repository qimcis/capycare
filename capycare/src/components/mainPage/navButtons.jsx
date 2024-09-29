"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NavButtons() {
    const router = useRouter();
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');
    const [usernameModalAction, setUsernameModalAction] = useState(null);

    const openUsernameModal = (action) => {
        setIsUsernameModalOpen(true);
        setIsJoinModalOpen(false);
        setUsernameModalAction(action);
    };

    const handleUsernameSubmit = () => {
        if (username.trim()) {
            setIsUsernameModalOpen(false);
            if (usernameModalAction === 'create') {
                createRoom();
            } else if (usernameModalAction === 'join') {
                joinRoom();
            }
        } else {
            alert('Please enter a valid username');
        }
    };

    const createRoom = async () => {
        try {
            const response = await fetch('/api/createRoom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }),
            });
           
            if (!response.ok) {
                throw new Error('Failed to create room');
            }
           
            const { roomId } = await response.json();
            router.push(`/room/${roomId}?username=${encodeURIComponent(username)}`);
        } catch (error) {
            console.error('Error creating room:', error);
            // handle error
        }
    };

    const joinRoom = () => {
        if (roomId.trim()) {
            router.push(`/room/${roomId.trim()}?username=${encodeURIComponent(username)}`);
        } else {
            alert('Please enter a valid room ID');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <button className="btn btn-wide" onClick={() => openUsernameModal('create')}>Create Room</button>
            <button className="btn btn-wide" onClick={() => setIsJoinModalOpen(true)}>Join Room</button>

            {/* Join Room Modal */}
            <input type="checkbox" id="join-room-modal" className="modal-toggle" checked={isJoinModalOpen} onChange={() => setIsJoinModalOpen(!isJoinModalOpen)} />
            <div className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Join a Room</h3>
                    <input
                        type="text"
                        placeholder="Enter Room ID"
                        className="input input-bordered w-full max-w-xs mt-2"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    />
                    <div className="modal-action">
                        <button className="btn btn-primary" onClick={() => openUsernameModal('join')}>Next</button>
                        <button className="btn" onClick={() => setIsJoinModalOpen(false)}>Cancel</button>
                    </div>
                </div>  
            </div>

            {/* Username Modal */}
            <input type="checkbox" id="username-modal" className="modal-toggle" checked={isUsernameModalOpen} onChange={() => setIsUsernameModalOpen(!isUsernameModalOpen)} />
            <div className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Enter Your Username</h3>
                    <input
                        type="text"
                        placeholder="Enter Username"
                        className="input input-bordered w-full max-w-xs mt-2"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <div className="modal-action">
                        <button className="btn btn-primary" onClick={handleUsernameSubmit}>Submit</button>
                        <button className="btn" onClick={() => setIsUsernameModalOpen(false)}>Cancel</button>
                    </div>
                </div>  
            </div>
        </div>
    );
}