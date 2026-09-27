import React from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children, isLight, onToggleTheme }) => {
  return (
    <div className="app-shell">
      <Sidebar isLight={isLight} onToggleTheme={onToggleTheme} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
