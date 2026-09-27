import React from 'react';

const SystemStatus = ({ status = 'normal' }) => {
  return (
    <span className={`status-badge ${status.toLowerCase()}`}>
      {status.toUpperCase()}
    </span>
  );
};

export default SystemStatus;
