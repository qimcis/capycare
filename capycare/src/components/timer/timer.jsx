"use client"
import { useState, useEffect, useCallback } from "react";

export default function Timer() {
    const [time, setTime] = useState(25*60);
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState('pomodoro');
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
        if (mode === 'pomodoro') {
            switchMode('shortBreak');
        } else {
            switchMode('pomodoro');
        }
    }
 
    const toggleTimer = useCallback(() => {
        setIsRunning((prevIsRunning) => !prevIsRunning)
    }, [])

    const resetTimer = useCallback(() => {
        setIsRunning(false);
        setTime(mode === 'pomodoro' ? pomodoroTime : 
                mode === 'shortBreak' ? shortBreakTime : longBreakTime);
    }, [mode]);

    const switchMode = useCallback((newMode) => {
        setIsRunning(false);
        setMode(newMode);
        if (newMode === 'pomodoro') {
            setTime(pomodoroTime);
        } else if (newMode === 'shortBreak') {
            setTime(shortBreakTime);
        } else if (newMode === 'longBreak') {
            setTime(longBreakTime);
        }
    }, [])

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return {minutes, seconds};
    }

    const { minutes, seconds } = formatTime(time);

    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="flex flex-row space-x-4 mb-8">
            <button 
              className={`btn ${mode === 'pomodoro' ? 'btn-primary' : ''}`}
              onClick={() => switchMode('pomodoro')}
            >
              Pomodoro
            </button>
            <button 
              className={`btn ${mode === 'shortBreak' ? 'btn-primary' : ''}`}
              onClick={() => switchMode('shortBreak')}
            >
              Short Break
            </button>
            <button 
              className={`btn ${mode === 'longBreak' ? 'btn-primary' : ''}`}
              onClick={() => switchMode('longBreak')}
            >
              Long Break
            </button>
        </div>
        <span className="countdown font-mono text-9xl">
            <span style={{"--value": minutes}}></span>:
            <span style={{"--value": seconds}}></span>
        </span>
        <div className="space-x-4 mt-8">
          <button className="btn btn-primary" onClick={toggleTimer}>
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button className="btn" onClick={resetTimer}>Reset</button>
        </div>
      </div>
    )
}