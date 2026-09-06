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

const VibrationChart = ({ value }) => {
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
            label: 'Vibration',
            data: [...valuesRef.current],
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.35
          }
        ]
      });
    }
  }, [value]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        }
      }
    },
    animation: {
      duration: 0
    }
  };

  return (
    <div className="vibration-chart-container" style={{ height: '200px' }}>
      {chartData && <Line data={chartData} options={options} />}
    </div>
  );
};

export default VibrationChart;
