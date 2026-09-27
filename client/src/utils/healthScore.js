export const calculateHealthScore = (avgTemp = 0, maxTemp = 0, vibration = 0, alerts = 0) => {
  let score = 100;
  
  if (avgTemp > 50) score -= (avgTemp - 50) * 0.5;
  if (maxTemp > 70) score -= (maxTemp - 70) * 0.7;
  if (vibration > 3) score -= (vibration - 3) * 5;
  score -= alerts * 10;
  
  score = Math.round(Math.max(0, Math.min(100, score)));
  
  let label = 'OPERATIONAL (OPTIMAL)';
  let primaryColor = '#4edea3';
  let secondaryColor = '#10b981';
  
  if (score < 60) {
    label = 'CRITICAL / INTERLOCK';
    primaryColor = '#ffb4ab';
    secondaryColor = '#93000a';
  } else if (score < 80) {
    label = 'DEGRADED / ATTENTION';
    primaryColor = '#ffb95f';
    secondaryColor = '#e29100';
  }
  
  return { score, label, primaryColor, secondaryColor };
};
