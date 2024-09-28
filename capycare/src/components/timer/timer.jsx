"use client"
import React, { useState, useEffect, useCallback } from "react";

export default function Timer({ initialTime, isRunningProp, onTimerChange }) {
    const [time, setTime] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(isRunningProp);
    const [isPomodoro, setIsPomodoro] = useState(true);
    const [theme, setTheme] = useState('light');
    const [key, setKey] = useState(0);
    const pomodoroTime = 25 * 60;
    const shortBreakTime = 5 * 60;
    const longBreakTime = 15 * 60;

    useEffect(() => {
        setTime(initialTime);
        setIsRunning(isRunningProp);
    }, [initialTime, isRunningProp]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        setKey(prev => prev + 1);

        const handleStorageChange = (e) => {
            if (e.key === 'theme') {
                const updatedTheme = e.newValue || 'light';
                setTheme(updatedTheme);
                document.documentElement.setAttribute('data-theme', updatedTheme);
                setKey(prev => prev + 1);
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
                setTime(prevTime => prevTime - 1);
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
        onTimerChange({ time: isPomodoro ? shortBreakTime : pomodoroTime, isRunning: false });
    };

    const toggleTimer = useCallback(() => {
        const newIsRunning = !isRunning;
        setIsRunning(newIsRunning);
        onTimerChange({ time, isRunning: newIsRunning });
    }, [isRunning, time, onTimerChange]);

    const resetTimer = useCallback(() => {
        setIsRunning(false);
        const newTime = isPomodoro ? pomodoroTime : shortBreakTime;
        setTime(newTime);
        onTimerChange({ time: newTime, isRunning: false });
    }, [isPomodoro, onTimerChange]);

    const switchMode = useCallback((mode) => {
        setIsRunning(false);
        setIsPomodoro(mode === 'pomodoro');
        let newTime;
        if (mode === 'pomodoro') {
            newTime = pomodoroTime;
        } else if (mode === 'shortBreak') {
            newTime = shortBreakTime;
        } else if (mode === 'longBreak') {
            newTime = longBreakTime;
        }
        setTime(newTime);
        onTimerChange({ time: newTime, isRunning: false });
    }, [onTimerChange]);

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return { minutes, seconds };
    };

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