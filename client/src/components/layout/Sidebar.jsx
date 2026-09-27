import React from 'react';

const Sidebar = ({ isLight, onToggleTheme }) => {
  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logo-icon">💠</span>
        <h2>Control Room</h2>
      </div>
      <nav className="nav-menu">
        <a href="#overview" className="nav-item active">
          <span className="nav-icon">📊</span>
          Overview
        </a>
        <a href="#digital-twin" className="nav-item">
          <span className="nav-icon">🤖</span>
          Digital Twin
        </a>
        <a href="#sensors" className="nav-item">
          <span className="nav-icon">🎛️</span>
          Sensors
        </a>
      </nav>
      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={onToggleTheme}>
          <span className="toggle-icon">🌓</span>
          <span>{isLight ? 'Switch to Dark' : 'Switch to Light'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
