import { useState, useEffect } from 'react';

const useTheme = () => {
  const [isLight, setIsLight] = useState(() => {
    const saved = localStorage.getItem('user-theme-preference');
    if (saved) {
      return saved === 'light';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  });

  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light-mode');
      localStorage.setItem('user-theme-preference', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('user-theme-preference', 'dark');
    }
  }, [isLight]);

  const toggleTheme = () => {
    setIsLight(prev => !prev);
  };

  return { isLight, toggleTheme };
};

export default useTheme;
