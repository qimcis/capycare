"use client"

import React, { useState } from 'react';
import './NavBar.css'; 
import Link from 'next/link';

export function NavBar({ showSettings = false, onSettingsChange, onThemeChange, currentTheme }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pomodoroTime, setPomodoroTime] = useState(25);
    const [shortBreakTime, setShortBreakTime] = useState(5);
    const [longBreakTime, setLongBreakTime] = useState(15);
    const [isChatEnabled, setIsChatEnabled] = useState(true);

    const toggleTheme = () => {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        onThemeChange(newTheme);
    };
    
    const textColorClass = currentTheme === 'light' ? 'text-black' : 'text-white';

    const handleSettingsSave = () => {
        onSettingsChange({
            pomodoroTime: pomodoroTime, // Convert to seconds
            shortBreakTime: shortBreakTime, // Convert to seconds
            longBreakTime: longBreakTime, // Convert to seconds
            isChatEnabled
        });
        setIsModalOpen(false);
    };
    

    return (
        <>
            <div className={`navbar bg-transparent ${textColorClass}`}>
                    <div className="flex-1">
                        <Link href="/" className={`btn btn-ghost text-xl ${textColorClass}`}>
                            CapyCare
                        </Link>                
                    </div>
                <div className="flex-none">
                    <label className="swap swap-rotate mr-2">
                        <input
                            type="checkbox"
                            className="theme-controller"
                            onChange={toggleTheme}
                            checked={currentTheme === 'dark'}                        
                        />
                        {/* sun icon */}
                        <svg
                            className={`swap-off h-6 w-6 fill-current ${textColorClass}`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24">
                            <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
                        </svg>
                        {/* moon icon */}
                        <svg
                            className={`swap-on h-6 w-6 fill-current ${textColorClass}`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24">
                            <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
                        </svg>
                    </label>
                    {showSettings && (
                        <button className={`btn btn-square btn-ghost ${textColorClass}`} onClick={() => setIsModalOpen(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932,0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5v.008h.008V16.5H12zM12 16.5v.008h.008V16.5H12zM12 16.5v.008h.008V16.5H12z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h2 className="text-lg font-bold">Settings</h2>
                        <div className="my-4">
                            <label className="label">
                                <span className="label-text">Pomodoro Time (min):</span>
                            </label>
                            <input
                                type="number"
                                value={pomodoroTime}
                                onChange={(e) => setPomodoroTime(e.target.value)}
                                className="input input-bordered w-full max-w-xs"
                                min="1"
                                max="60"
                            />
                        </div>
                        <div className="my-4">
                            <label className="label">
                                <span className="label-text">Short Break Time (min):</span>
                            </label>
                            <input
                                type="number"
                                value={shortBreakTime}
                                onChange={(e) => setShortBreakTime(e.target.value)}
                                className="input input-bordered w-full max-w-xs"
                                min="1"
                                max="60"
                            />
                        </div>
                        <div className="my-4">
                            <label className="label">
                                <span className="label-text">Long Break Time (min):</span>
                            </label>
                            <input
                                type="number"
                                value={longBreakTime}
                                onChange={(e) => setLongBreakTime(e.target.value)}
                                className="input input-bordered w-full max-w-xs"
                                min="1"
                                max="60"
                            />
                        </div>
                        <div className="my-4">
                            <label className="label cursor-pointer">
                                <span className="label-text">Enable Chat</span>
                                <input
                                    type="checkbox"
                                    checked={isChatEnabled}
                                    onChange={() => setIsChatEnabled(!isChatEnabled)}
                                    className="toggle"
                                />
                            </label>
                        </div>
                        <div className="modal-action">
                            <button className="btn" onClick={handleSettingsSave}>Save</button>
                            <button className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
