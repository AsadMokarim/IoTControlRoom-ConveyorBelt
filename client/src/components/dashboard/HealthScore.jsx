import React from 'react';
import { calculateHealthScore } from '../../utils/healthScore';

const HealthScore = ({ avgTemp, maxTemp, vibration, alerts }) => {
  const { score, label, primaryColor, secondaryColor } = calculateHealthScore(avgTemp, maxTemp, vibration, alerts);
  
  const background = `radial-gradient(
        circle at center,
        #0f172a 59%,
        transparent 60%
    ),
    conic-gradient(
        ${primaryColor} 0%,
        ${secondaryColor} ${score}%,
        rgba(148, 163, 184, 0.18) ${score}%,
        rgba(148, 163, 184, 0.18) 100%
    )`;

  return (
    <>
      <div className="health-score-eyebrow">
        <span className="health-status-dot" aria-hidden="true"></span>
        SYSTEM HEALTH
      </div>
      <h2 id="health-score-title">Overall Health Score</h2>

      <div className="health-score-main">
        <div className="health-score-ring" id="health-score-ring" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={score} aria-label="Overall health score" style={{ background }}>
          <div className="health-score-ring-glow"></div>
          <div className="health-score-inner">
            <strong id="health-score">{score}</strong>
            <small>/100</small>
          </div>
        </div>

        <div className="health-score-summary">
          <div className="health-score-label" id="health-score-label">{label}</div>
          <p className="health-score-description" id="health-score-description">
            Analyzing current machine telemetry
          </p>
        </div>
      </div>

      <div className="health-score-divider"></div>

      <div className="health-score-footer">
        <div className="health-score-based-on">
          <span>Score based on</span>
          <div className="health-score-links">
            <a href="#average-temperature-gauge" title="Average temperature">
              <span className="formula-icon">🌡</span><span>Temperature</span>
            </a>
            <a href="#maximum-temperature-gauge" title="Maximum temperature">
              <span className="formula-icon">🔥</span><span>Max temp</span>
            </a>
            <a href="#vibration-meter" title="Vibration">
              <span className="formula-icon">〽</span><span>Vibration</span>
            </a>
            <a href="#alert-ring" title="Active alerts">
              <span className="formula-icon">⚠</span><span>Alerts</span>
            </a>
          </div>
        </div>
        <div className="health-score-scale" aria-hidden="true">
          <span>Critical</span>
          <span>Good</span>
          <span>Excellent</span>
        </div>
      </div>
    </>
  );
};

export default HealthScore;
