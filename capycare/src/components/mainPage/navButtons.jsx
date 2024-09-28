"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NavButtons() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roomId, setRoomId] = useState('');

    const createRoom = async () => {
        try {
            const response = await fetch('/api/createRoom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error('Failed to create room');
            }
            
            const { roomId } = await response.json();
            router.push(`/room/${roomId}`);
        } catch (error) {
            console.error('Error creating room:', error);
            // Handle error (e.g., show an error message to the user)
        }
    };

    const joinRoom = () => {
        if (roomId.trim()) {
            router.push(`/room/${roomId.trim()}`);
            setIsModalOpen(false);
        } else {
            alert('Please enter a valid room ID');
        }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center space-y-4">
            <button className="btn btn-wide" onClick={createRoom}>Create Room</button>
            <button className="btn btn-wide" onClick={() => setIsModalOpen(true)}>Join Room</button>

            <input type="checkbox" id="join-room-modal" className="modal-toggle" checked={isModalOpen} onChange={() => setIsModalOpen(!isModalOpen)} />
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
                        <button className="btn btn-primary" onClick={joinRoom}>Join</button>
                        <button className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
}