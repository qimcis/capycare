"use client"

import { useState, useEffect, useCallback } from "react";

export default function Timer() {
    const [time, setTime] = useState(25*60); 
    const [isRunning, setIsRunning] = useState(false);
    const [isPomodoro, setIsPomodoro] = useState(true);

    const pomodoroTime = 25 * 60;
    const shortBreakTime = 5 * 60;
    const longBreakTime = 15 * 60;

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
        setIsRunning((prevIsRunning) => !prevIsRunning)
    })

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
        setIsPomodoro == 'pomodoro';
        if (mode === 'pomodoro') {
            setTime(pomodoroTime);
        } else if (mode === 'shortBreak') {
            setTime(shortBreakTime);
        } else if (mode === 'longBreak') {
            setTime(longBreakTime);
        }
    })
    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return {minutes, seconds}; 
    }

    const { minutes, seconds } = formatTime(time);
  
    return (
      <div className="h-screen flex flex-col items-center justify-center">

        <div className="flex flex-row space-x-4">
            <button className="btn" onClick={() => switchMode('pomodoro')}>Pomodoro</button>
            <button className="btn" onClick={() => switchMode('shortBreak')}>Short Break</button>
            <button className="btn" onClick={() => switchMode('longBreak')}>Long Break</button>
        </div>
        <span className="countdown font-Jost text-9xl">
            <span style={{"--value": minutes}}></span>:
            <span style={{"--value": seconds}}></span>
        </span>
        <div className="space-x-4 space-y-4">
        <button className="btn" onClick={toggleTimer}>
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button className="btn" onClick={resetTimer}>Reset</button>
        </div>
    </div>
    )
  }