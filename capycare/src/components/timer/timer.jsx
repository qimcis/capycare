"use client"
import React, { useState, useEffect, useCallback } from "react";

export default function Timer() {
    const [time, setTime] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [isPomodoro, setIsPomodoro] = useState(true);
    const [theme, setTheme] = useState('light');
    const [key, setKey] = useState(0); // Add this line
    const pomodoroTime = 25 * 60;
    const shortBreakTime = 5 * 60;
    const longBreakTime = 15 * 60;

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        setKey(prev => prev + 1); // Force re-render
        console.log('Initial theme:', savedTheme);

        const handleStorageChange = (e) => {
            if (e.key === 'theme') {
                const updatedTheme = e.newValue || 'light';
                setTheme(updatedTheme);
                document.documentElement.setAttribute('data-theme', updatedTheme);
                setKey(prev => prev + 1); // Force re-render
                console.log('Theme updated:', updatedTheme);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        let interval;
        if (isRunning && time > 0) {
            interval = setInterval(() => {  
                setTime((prevTime) => prevTime - 1);
            }, 1000);
        } else if (time === 0) {
            handleTimerComplete();
        }
        return () => clearInterval(interval);
    }, [isRunning, time]);

    const handleTimerComplete = () => {
        setIsRunning(false);
        if (isPomodoro) {
            setIsPomodoro(false);
            setTime(shortBreakTime);
        } else {
            setIsPomodoro(true);
            setTime(pomodoroTime);
        }
    }

    const toggleTimer = useCallback(() => {
        setIsRunning((prevIsRunning) => !prevIsRunning);
    }, []);

    const resetTimer = useCallback(() => {
        setIsRunning(false);
        if (isPomodoro) {
            setTime(pomodoroTime);
        } else {
            setTime(shortBreakTime);
        }
    }, [isPomodoro]);

    const switchMode = useCallback((mode) => {
        setIsRunning(false);
        setIsPomodoro(mode === 'pomodoro');
        if (mode === 'pomodoro') {
            setTime(pomodoroTime);
        } else if (mode === 'shortBreak') {
            setTime(shortBreakTime);
        } else if (mode === 'longBreak') {
            setTime(longBreakTime);
        }
    }, []);

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return { minutes, seconds };
    }

    const { minutes, seconds } = formatTime(time);

    return (
        <div key={key} className="h-screen flex flex-col items-center justify-center">
            <div className="flex flex-row space-x-4 mb-4">
                <button className={`btn ${isPomodoro ? 'btn-primary' : ''}`} onClick={() => switchMode('pomodoro')}>Pomodoro</button>
                <button className={`btn ${!isPomodoro && time === shortBreakTime ? 'btn-primary' : ''}`} onClick={() => switchMode('shortBreak')}>Short Break</button>
                <button className={`btn ${!isPomodoro && time === longBreakTime ? 'btn-primary' : ''}`} onClick={() => switchMode('longBreak')}>Long Break</button>
            </div>
            <span className="countdown font-mono text-9xl timer-text">
                <span style={{"--value": minutes.toString().padStart(2, '0')}}></span>:
                <span style={{"--value": seconds.toString().padStart(2, '0')}}></span>
            </span>
            <div className="space-x-4 mt-4">
                <button className="btn btn-primary" onClick={toggleTimer}>
                    {isRunning ? 'Pause' : 'Start'}
                </button>
                <button className="btn" onClick={resetTimer}>Reset</button>
            </div>
        </div>
    );
}