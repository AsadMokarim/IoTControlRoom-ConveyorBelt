import React from 'react';

const ThermalMap = ({ zones = [] }) => {
  const getTemperatureClass = (temperature) => {
      if (temperature >= 85) return "temperature-critical";
      if (temperature >= 70) return "temperature-warning";
      if (temperature >= 55) return "temperature-moderate";
      return "temperature-normal";
  };

  return (
    <div id="thermal-map" className="thermal-map">
        {zones.map((zone, index) => (
            <div key={index} className={`thermal-tile ${getTemperatureClass(zone.temperature)}`}>
                <span>{zone.name}</span>
                <strong>{zone.temperature} °C</strong>
            </div>
        ))}
    </div>
  );
};

export default ThermalMap;
