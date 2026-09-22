import React, { useState, useEffect } from 'react';
import CameraFeedCard from './CameraFeedCard';

const defaultCameras = [
  {
    id: 'cam_1',
    label: 'Belt Overview (Main Drive)',
    ip: '192.168.4.3',
    port: 81,
    streamPath: '/stream',
  },
  {
    id: 'cam_2',
    label: 'Splice Joint Inspection',
    ip: '192.168.4.4',
    port: 81,
    streamPath: '/stream',
  },
];

const CameraGrid = () => {
  const [cameras, setCameras] = useState(defaultCameras);

  useEffect(() => {
    fetch('/api/control/devices')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.cameras && data.cameras.length > 0) {
          setCameras(data.cameras);
        }
      })
      .catch((err) => {
        console.warn('Could not load camera configs from server, using defaults:', err);
      });
  }, []);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: cameras.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '20px',
      }}
    >
      {cameras.map((cam) => (
        <CameraFeedCard key={cam.id} camera={cam} />
      ))}
    </div>
  );
};

export default CameraGrid;
