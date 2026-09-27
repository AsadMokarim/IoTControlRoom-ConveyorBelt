import React from 'react';

const DigitalTwinStatus = ({ components }) => {
  return (
    <div className="digital-twin-table-wrapper">
        <table className="digital-twin-table">
            <thead>
                <tr>
                    <th>Component</th>
                    <th>Condition</th>
                    <th>Temperature</th>
                    <th>Vibration</th>
                    <th>Last Check</th>
                </tr>
            </thead>

            <tbody>
                {components.map((comp, index) => (
                    <tr key={index}>
                        <td>
                            <div className="component-name">
                                <span className={`component-dot ${comp.condition}`}></span>
                                {comp.name}
                            </div>
                        </td>
                        <td>
                            <span className={`condition-badge ${comp.condition}`}>
                                {comp.condition.charAt(0).toUpperCase() + comp.condition.slice(1)}
                            </span>
                        </td>
                        <td>{comp.temperature}</td>
                        <td>{comp.vibration}</td>
                        <td>{comp.lastCheck}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
};

export default DigitalTwinStatus;
