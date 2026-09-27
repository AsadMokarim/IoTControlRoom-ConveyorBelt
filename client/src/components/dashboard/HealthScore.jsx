import React from 'react';
import { calculateHealthScore } from '../../utils/healthScore';

const HealthScore = ({ avgTemp, maxTemp, vibration, alerts }) => {
  const { score, label, primaryColor, secondaryColor } = calculateHealthScore(avgTemp, maxTemp, vibration, alerts);
  
  const background = `radial-gradient(
        circle at center,
        var(--surface-container-low, #171c22) 59%,
        transparent 60%
    ),
    conic-gradient(
        ${primaryColor} 0%,
        ${secondaryColor} ${score}%,
        var(--surface-container-highest, #30353c) ${score}%,
        var(--surface-container-highest, #30353c) 100%
    )`;

  return (
    <>
      <div className="health-score-eyebrow label-caps">
        SYSTEM OPERATIONAL READINESS
      </div>
      <h2 id="health-score-title" className="headline-panel">Aggregate Health Index</h2>

      <div className="health-score-main">
        <div
          className="health-score-ring"
          id="health-score-ring"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={score}
          aria-label="Overall health score"
          style={{ background }}
        >
          <div className="health-score-inner">
            <strong id="health-score" className="display-process-val">{score}</strong>
            <small className="subhead-tag">/100</small>
          </div>
        </div>

        <div className="health-score-summary">
          <div className="health-score-label alarm-annunciator" id="health-score-label">{label}</div>
          <p className="health-score-description body-dense" id="health-score-description">
            Continuous multivariate telemetry evaluation from motor temperature, tri-axis vibration shock, and line current sensors.
          </p>
        </div>
      </div>

      <div className="health-score-divider"></div>

      <div className="health-score-footer">
        <div className="health-score-based-on">
          <span className="label-caps">Assessed Telemetry Vectors</span>
          <div className="health-score-links">
            <a href="#average-temperature-gauge" title="Average temperature">
              <span className="formula-icon">🌡</span><span>Temp ({avgTemp.toFixed(1)}°C)</span>
            </a>
            <a href="#vibration-meter" title="Vibration">
              <span className="formula-icon">〽</span><span>Vib ({vibration.toFixed(2)}g)</span>
            </a>
            <a href="#alert-ring" title="Active alerts">
              <span className="formula-icon">⚠</span><span>Alerts ({alerts})</span>
            </a>
          </div>
        </div>
        <div className="health-score-scale telemetry-data" aria-hidden="true">
          <span>&lt;60 CRIT</span>
          <span>60-79 WARN</span>
          <span>80-100 OPTIMAL</span>
        </div>
      </div>
    </>
  );
};

export default HealthScore;
