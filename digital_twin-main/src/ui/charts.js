/**
 * charts.js
 * 
 * Lightweight canvas-based rolling line charts for vibration and temperature trends.
 * No external charting library — drawn with Canvas 2D API.
 * 
 * Each chart maintains a rolling window of ~60 data points.
 */

const MAX_POINTS = 60;
const CHART_COLORS = {
  vibration: { line: '#3b82f6', fill: 'rgba(59, 130, 246, 0.1)', grid: '#1e293b' },
  temperature: { line: '#f97316', fill: 'rgba(249, 115, 22, 0.1)', grid: '#1e293b' },
};

class MiniChart {
  constructor(canvasId, label, unit, colors, minVal, maxVal) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.label = label;
    this.unit = unit;
    this.colors = colors;
    this.minVal = minVal;
    this.maxVal = maxVal;
    this.data = [];

    if (this.canvas) {
      this._resize();
      window.addEventListener('resize', () => this._resize());
    }
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.draw();
  }

  push(value) {
    this.data.push(value);
    if (this.data.length > MAX_POINTS) {
      this.data.shift();
    }
  }

  draw() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const dpr = window.devicePixelRatio || 1;
    const padding = { top: 28 * dpr, right: 12 * dpr, bottom: 20 * dpr, left: 45 * dpr };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(0, 0, w, h);

    // --- Grid lines ---
    ctx.strokeStyle = this.colors.grid;
    ctx.lineWidth = 0.5 * dpr;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      const val = this.maxVal - ((this.maxVal - this.minVal) / gridLines) * i;
      ctx.fillStyle = '#64748b';
      ctx.font = `${10 * dpr}px Inter, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(1), padding.left - 6 * dpr, y + 3 * dpr);
    }

    // --- Chart title ---
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${11 * dpr}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(this.label, padding.left, 16 * dpr);

    // Current value
    if (this.data.length > 0) {
      const currentVal = this.data[this.data.length - 1];
      ctx.fillStyle = this.colors.line;
      ctx.font = `bold ${11 * dpr}px Inter, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(`${currentVal.toFixed(2)} ${this.unit}`, w - padding.right, 16 * dpr);
    }

    // --- Data line ---
    if (this.data.length < 2) return;

    const range = this.maxVal - this.minVal;

    ctx.beginPath();
    for (let i = 0; i < this.data.length; i++) {
      const x = padding.left + (chartW / (MAX_POINTS - 1)) * i;
      const normalized = (this.data[i] - this.minVal) / range;
      const y = padding.top + chartH - normalized * chartH;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = this.colors.line;
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    // Fill area under the line
    const lastX = padding.left + (chartW / (MAX_POINTS - 1)) * (this.data.length - 1);
    ctx.lineTo(lastX, padding.top + chartH);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = this.colors.fill;
    ctx.fill();
  }
}

let vibrationChart = null;
let temperatureChart = null;

/**
 * Initialize charts.
 */
export function initCharts() {
  vibrationChart = new MiniChart(
    'chart-vibration', 'Vibration Trend', 'g',
    CHART_COLORS.vibration, 0, 10
  );
  temperatureChart = new MiniChart(
    'chart-temperature', 'Temperature Trend', '°C',
    CHART_COLORS.temperature, 30, 80
  );
}

/**
 * Push new data points and redraw charts.
 */
export function updateCharts(sensorData) {
  if (vibrationChart) {
    vibrationChart.push(sensorData.vibration);
    vibrationChart.draw();
  }
  if (temperatureChart) {
    temperatureChart.push(sensorData.temperature);
    temperatureChart.draw();
  }
}
