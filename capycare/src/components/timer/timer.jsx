"use client"

import { useState, useEffect } from "react";

export default function Timer() {
    const [counter, setCounter] = useState(60); // Start from 60 seconds
    const [isRunning, setIsRunning] = useState(false);
  
    useEffect(() => {
        let timer;
        if (isRunning && counter > 0) {
            timer = setInterval(() => setCounter(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [isRunning, counter]);
  
    const startTimer = () => setIsRunning(true);
    const stopTimer = () => setIsRunning(false);

    const hours = Math.floor(counter / 3600);
    const minutes = Math.floor((counter % 3600) / 60);
    const seconds = counter % 60;
  
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <span className="countdown font-mono text-7xl">
          <span style={{"--value": hours}}></span>:
          <span style={{"--value": minutes}}></span>:
          <span style={{"--value": seconds}}></span>
        </span>
        <div className="flex flex-row space-x-4">
            <input type="button" value="Start" className="btn" onClick={startTimer}/>
            <input type="button" value="Stop" className="btn" onClick={stopTimer} />
        </div>
    </div>
    )
  }