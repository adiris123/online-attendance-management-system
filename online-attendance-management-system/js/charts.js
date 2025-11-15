// charts.js - Tiny helper for rendering attendance chart using Canvas 2D
// This is a lightweight custom chart (no external libraries) showing present/absent bars.

function renderAttendanceChart(canvas, labels, presentData, absentData) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width = canvas.clientWidth || 600;
  const height = canvas.height = canvas.clientHeight || 220;

  ctx.clearRect(0, 0, width, height);

  // chart area
  const padding = { top: 16, right: 12, bottom: 40, left: 32 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(1, ...presentData, ...absentData);
  const barGroupWidth = chartW / Math.max(labels.length, 1);
  const barWidth = barGroupWidth / 3;

  ctx.font = "11px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#9ca3af";

  // axes
  ctx.strokeStyle = "rgba(148,163,184,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  // y-axis ticks
  const steps = Math.min(maxVal, 5);
  for (let i = 0; i <= steps; i++) {
    const val = (maxVal / steps) * i;
    const y = height - padding.bottom - (val / maxVal) * chartH;
    ctx.fillStyle = "#6b7280";
    ctx.fillText(String(Math.round(val)), 4, y + 3);
    ctx.strokeStyle = "rgba(31,41,55,0.45)";
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  // bars
  labels.forEach((label, idx) => {
    const groupX = padding.left + idx * barGroupWidth;

    const pVal = presentData[idx] || 0;
    const aVal = absentData[idx] || 0;

    const pHeight = (pVal / maxVal) * chartH;
    const aHeight = (aVal / maxVal) * chartH;

    const baseY = height - padding.bottom;

    // Present bar
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.roundRect(groupX + barWidth * 0.4, baseY - pHeight, barWidth, pHeight, 4);
    ctx.fill();

    // Absent bar
    ctx.fillStyle = "#f97373";
    ctx.beginPath();
    ctx.roundRect(groupX + barWidth * 1.6, baseY - aHeight, barWidth, aHeight, 4);
    ctx.fill();

    // label
    ctx.fillStyle = "#94a3b8";
    ctx.save();
    ctx.translate(groupX + barGroupWidth / 2, height - padding.bottom + 16);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText(label, -20, 0);
    ctx.restore();
  });

  // legend
  const legendY = padding.top - 4;
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(width - padding.right - 120, legendY, 10, 10);
  ctx.fillStyle = "#e5e7eb";
  ctx.fillText("Present", width - padding.right - 105, legendY + 9);

  ctx.fillStyle = "#f97373";
  ctx.fillRect(width - padding.right - 60, legendY, 10, 10);
  ctx.fillStyle = "#e5e7eb";
  ctx.fillText("Absent", width - padding.right - 45, legendY + 9);
}