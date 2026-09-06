export const calculateHealthScore = (avgTemp = 0, maxTemp = 0, vibration = 0, alerts = 0) => {
  let score = 100;
  
  if (avgTemp > 50) score -= (avgTemp - 50) * 0.5;
  if (maxTemp > 70) score -= (maxTemp - 70) * 0.7;
  if (vibration > 3) score -= (vibration - 3) * 5;
  score -= alerts * 10;
  
  score = Math.round(Math.max(0, Math.min(100, score)));
  
  let label = 'Excellent condition';
  let primaryColor = '#10b981';
  let secondaryColor = '#047857';
  
  if (score < 60) {
    label = 'Critical condition';
    primaryColor = '#ef4444';
    secondaryColor = '#b91c1c';
  } else if (score < 80) {
    label = 'Requires attention';
    primaryColor = '#f59e0b';
    secondaryColor = '#b45309';
  }
  
  return { score, label, primaryColor, secondaryColor };
};
