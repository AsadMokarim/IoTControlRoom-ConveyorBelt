import React, { useState, useEffect } from 'react';
import CameraFeedCard from './CameraFeedCard';

const defaultCameras = [
  {
    id: 'cam_1',
    label: 'Belt Overview (Main Drive)',
    ip: '10.42.0.118',
    port: 81,
    streamPath: '/stream',
  },
  {
    id: 'cam_2',
    label: 'Splice Joint Inspection',
    ip: '10.42.0.119',
    port: 81,
    streamPath: '/stream',
  },
];

const CameraGrid = () => {
  const [cameras, setCameras] = useState(() => {
    // Check localStorage for any operator-saved IP overrides
    try {
      const saved = localStorage.getItem('conveyor_cameras');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return defaultCameras;
  });

  useEffect(() => {
    // Fetch live config from server (.env configured addresses)
    fetch('/api/control/devices')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.cameras && data.cameras.length > 0) {
          setCameras((prevCams) =>
            data.cameras.map((serverCam) => {
              const localOverride = prevCams.find((c) => c.id === serverCam.id);
              // If operator has manually saved an IP in localStorage, keep it; otherwise use server .env IP
              const savedOverride = localStorage.getItem(`conveyor_cam_${serverCam.id}_ip`);
              return {
                ...serverCam,
                ip: savedOverride || serverCam.ip,
                port: Number(serverCam.port) || 81,
              };
            })
          );
        }
      })
      .catch((err) => {
        console.warn('Could not load camera configs from server, using local defaults:', err);
      });
  }, []);

  const handleUpdateCamera = (camId, newIp, newPort) => {
    setCameras((prev) => {
      const updated = prev.map((c) => (c.id === camId ? { ...c, ip: newIp, port: newPort } : c));
      try {
        localStorage.setItem('conveyor_cameras', JSON.stringify(updated));
        localStorage.setItem(`conveyor_cam_${camId}_ip`, newIp);
      } catch (_) {}
      return updated;
    });

    // Notify backend server to sync config
    fetch('/api/control/devices/camera', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: camId, ip: newIp, port: newPort }),
    }).catch(() => {});
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: cameras.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '20px',
      }}
    >
      {cameras.map((cam) => (
        <CameraFeedCard key={cam.id} camera={cam} onUpdateCamera={handleUpdateCamera} />
      ))}
    </div>
  );
};

export default CameraGrid;
