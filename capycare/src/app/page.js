"use client";
import { useState, useEffect } from 'react';
import { NavBar } from "@/components/navBar/navbar";
import { NavButtons } from "@/components/mainPage/navButtons";
import { Title } from "@/components/mainPage/title";

export default function Home() {
  const [theme, setTheme] = useState('light');
  const [backgroundImage, setBackgroundImage] = useState('/images/daytime.png');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    updateBackground(savedTheme);
  }, []);

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

  const textColorClass = theme === 'light' ? 'text-gray-800' : 'text-white';
  const bgColorClass = theme === 'light' ? 'bg-white' : 'bg-gray-800';

  return (
    <div
      className={`flex flex-col min-h-screen ${textColorClass}`}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <NavBar
        showSettings={false}
        onThemeChange={handleThemeChange}
        currentTheme={theme}
      />
      <div className={`flex-grow flex flex-col items-center justify-center space-y-8 ${bgColorClass} bg-opacity-0`}>
        <Title theme={theme} />
        <NavButtons theme={theme} />
      </div>
    </div>
  );
}