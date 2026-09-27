import React, { useRef, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

const VibrationChart = ({ value, color = '#4edea3', label = 'Telemetry' }) => {
  const labelsRef = useRef(Array.from({ length: 20 }, (_, i) => ''));
  const valuesRef = useRef(Array.from({ length: 20 }, () => 0));
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (value !== undefined) {
      valuesRef.current.push(value);
      labelsRef.current.push(new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }));
      
      if (valuesRef.current.length > 20) {
        valuesRef.current.shift();
        labelsRef.current.shift();
      }
      
      setChartData({
        labels: [...labelsRef.current],
        datasets: [
          {
            label,
            data: [...valuesRef.current],
            borderColor: color,
            backgroundColor: color === '#4edea3' ? 'rgba(78, 222, 163, 0.08)' : 'rgba(173, 198, 255, 0.08)',
            borderWidth: 1.5,
            pointRadius: 0,
            fill: true,
            tension: 0.2
          }
        ]
      });
    }
  }, [value, color, label]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont: { family: 'JetBrains Mono', size: 11 },
        backgroundColor: '#1b2026',
        borderColor: '#3c4a42',
        borderWidth: 1,
        displayColors: false
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(60, 74, 66, 0.35)'
        },
        ticks: {
          color: '#86948a',
          font: { family: 'JetBrains Mono', size: 10 }
        }
      }
    },
    animation: {
      duration: 0
    }
  };

  return (
    <div className="vibration-chart-container" style={{ height: '100%' }}>
      {chartData && <Line data={chartData} options={options} />}
    </div>
  );
};

export default VibrationChart;
