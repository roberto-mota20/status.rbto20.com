/**
 * Status Page Application Logic (GitHub Status Design Style)
 * Roberto Mota | status.rbto20.com
 */

(function () {
  'use strict';

  // Service configuration
  const SERVICES = [
    {
      id: 'dominio-principal',
      name: 'Domínio Principal',
      url: 'https://rbto20.com',
      defaultUptime: 100.0,
      defaultLatency: 173,
    },
    {
      id: 'redirecionamento',
      name: 'Redirecionamento',
      url: 'https://c.rbto20.com',
      defaultUptime: 100.0,
      defaultLatency: 248,
    },
    {
      id: 'projetos',
      name: 'Projetos',
      url: 'https://toto.rbto20.com',
      defaultUptime: 100.0,
      defaultLatency: 182,
    }
  ];

  // Global state
  let currentActivePeriod = '24h';
  let latencyDataCache = {};

  // DOM Elements
  const servicesContainer = document.getElementById('services-list');
  const lastUpdatedEl = document.getElementById('last-updated-text');
  const chartSvg = document.getElementById('latency-chart-svg');
  const avgLatencyEl = document.getElementById('avg-latency-val');
  const maxLatencyEl = document.getElementById('max-latency-val');
  const minLatencyEl = document.getElementById('min-latency-val');
  const incidentsListEl = document.getElementById('incidents-list');
  const tooltip = document.getElementById('app-tooltip');

  // Format date helper in pt-BR
  function formatDatePt(date) {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const d = date.getDate();
    const m = months[date.getMonth()];
    const y = date.getFullYear();
    return `${d} de ${m} de ${y}`;
  }

  // Generate 90-day history items for a service
  function generate90DaysData(serviceId, overallUptime) {
    const days = [];
    const today = new Date();
    
    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      
      // Default: 100% operational
      let status = 'operational';
      let uptime = 100.0;
      let incidents = [];

      days.push({
        date: d,
        formattedDate: formatDatePt(d),
        status: status,
        uptime: uptime,
        incidents: incidents
      });
    }
    return days;
  }

  // Render Service Cards with 90-Day Bars
  function renderServices() {
    if (!servicesContainer) return;
    servicesContainer.innerHTML = '';

    SERVICES.forEach(service => {
      const days = generate90DaysData(service.id, service.defaultUptime);
      
      const card = document.createElement('div');
      card.className = 'service-card';
      card.id = `service-${service.id}`;

      // Card Header
      const header = document.createElement('div');
      header.className = 'service-header';
      header.innerHTML = `
        <div class="service-title-group">
          <span class="service-name">${service.name}</span>
          <span class="status-pill is-operational">
            <span>●</span>
            <span>Operacional</span>
          </span>
        </div>
        <div class="service-meta-right">
          <span class="service-uptime-pct">${service.defaultUptime.toFixed(2)}% uptime</span>
        </div>
      `;
      card.appendChild(header);

      // 90-Day Timeline
      const timeline = document.createElement('div');
      timeline.className = 'uptime-timeline';

      const barsContainer = document.createElement('div');
      barsContainer.className = 'uptime-bars';

      days.forEach(day => {
        const bar = document.createElement('div');
        bar.className = `uptime-bar is-${day.status}`;
        bar.setAttribute('data-date', day.formattedDate);
        bar.setAttribute('data-uptime', `${day.uptime.toFixed(1)}%`);
        bar.setAttribute('data-status', day.status === 'operational' ? '100% de disponibilidade' : 'Degradação registrada');

        // Hover & Touch Events for Tooltip
        bar.addEventListener('mouseenter', showTooltip);
        bar.addEventListener('mouseleave', hideTooltip);
        bar.addEventListener('touchstart', showTooltip, { passive: true });

        barsContainer.appendChild(bar);
      });

      timeline.appendChild(barsContainer);

      // Legend
      const legend = document.createElement('div');
      legend.className = 'uptime-legend';
      legend.innerHTML = `
        <span>90 dias atrás</span>
        <span>100.0% disponível</span>
        <span>Hoje</span>
      `;
      timeline.appendChild(legend);

      card.appendChild(timeline);
      servicesContainer.appendChild(card);
    });
  }

  // Tooltip handler
  function showTooltip(e) {
    if (!tooltip) return;
    const target = e.currentTarget;
    const date = target.getAttribute('data-date');
    const uptime = target.getAttribute('data-uptime');
    const status = target.getAttribute('data-status');

    tooltip.innerHTML = `<strong>${date}</strong><br>${status}`;
    tooltip.classList.add('visible');

    const rect = target.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    tooltip.style.left = `${rect.left + rect.width / 2 + scrollLeft}px`;
    tooltip.style.top = `${rect.top + scrollTop}px`;
  }

  function hideTooltip() {
    if (!tooltip) return;
    tooltip.classList.remove('visible');
  }

  // Generate Synthesized Latency Curve for Period
  function generateLatencyData(period) {
    const pointsCount = period === '24h' ? 24 : period === '7d' ? 28 : period === '30d' ? 30 : 45;
    const baseLatency = 180;
    const points = [];

    for (let i = 0; i < pointsCount; i++) {
      // Natural minor variations around 170ms - 220ms
      const noise = (Math.sin(i * 0.6) * 15) + (Math.cos(i * 1.2) * 10) + ((Math.random() - 0.5) * 8);
      const val = Math.round(baseLatency + noise);
      points.push(val);
    }
    return points;
  }

  // Render SVG Latency Chart
  function renderLatencyChart(period) {
    if (!chartSvg) return;
    currentActivePeriod = period;

    const data = generateLatencyData(period);
    const minVal = Math.min(...data) - 20;
    const maxVal = Math.max(...data) + 20;
    const avgVal = Math.round(data.reduce((a, b) => a + b, 0) / data.length);

    if (avgLatencyEl) avgLatencyEl.textContent = `${avgVal} ms`;
    if (minLatencyEl) minLatencyEl.textContent = `${Math.min(...data)} ms`;
    if (maxLatencyEl) maxLatencyEl.textContent = `${Math.max(...data)} ms`;

    const svgWidth = 600;
    const svgHeight = 150;
    const padding = { top: 20, right: 15, bottom: 25, left: 35 };

    const plotWidth = svgWidth - padding.left - padding.right;
    const plotHeight = svgHeight - padding.top - padding.bottom;

    const stepX = plotWidth / (data.length - 1);

    // Calculate coordinates
    const coords = data.map((val, idx) => {
      const x = padding.left + (idx * stepX);
      const normalizedY = (val - minVal) / (maxVal - minVal);
      const y = padding.top + (plotHeight - (normalizedY * plotHeight));
      return { x, y, val, idx };
    });

    // Build SVG Path
    let pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const midX = (prev.x + curr.x) / 2;
      pathD += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${padding.top + plotHeight} L ${coords[0].x} ${padding.top + plotHeight} Z`;

    chartSvg.innerHTML = `
      <defs>
        <linearGradient id="tealGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#009688" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#009688" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      
      <!-- Grid Lines -->
      <line x1="${padding.left}" y1="${padding.top}" x2="${svgWidth - padding.right}" y2="${padding.top}" class="chart-grid-line" />
      <line x1="${padding.left}" y1="${padding.top + plotHeight / 2}" x2="${svgWidth - padding.right}" y2="${padding.top + plotHeight / 2}" class="chart-grid-line" />
      <line x1="${padding.left}" y1="${padding.top + plotHeight}" x2="${svgWidth - padding.right}" y2="${padding.top + plotHeight}" class="chart-grid-line" />

      <!-- Y Axis Labels -->
      <text x="${padding.left - 6}" y="${padding.top + 4}" text-anchor="end" class="chart-axis-text">${maxVal}ms</text>
      <text x="${padding.left - 6}" y="${padding.top + plotHeight / 2 + 3}" text-anchor="end" class="chart-axis-text">${Math.round((maxVal + minVal) / 2)}ms</text>
      <text x="${padding.left - 6}" y="${padding.top + plotHeight}" text-anchor="end" class="chart-axis-text">${minVal}ms</text>

      <!-- Area and Line -->
      <path d="${areaD}" class="chart-area" />
      <path d="${pathD}" class="chart-line" />
    `;
  }

  // Render Recent Incidents (Last 7 days)
  function renderIncidentHistory() {
    if (!incidentsListEl) return;
    incidentsListEl.innerHTML = '';

    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);

      const dayItem = document.createElement('div');
      dayItem.className = 'incident-day';

      const dateLabel = i === 0 ? 'Hoje' : i === 1 ? 'Ontem' : formatDatePt(d);
      dayItem.innerHTML = `
        <span class="incident-date">${dateLabel} - ${formatDatePt(d)}</span>
        <span class="incident-empty">Nenhum incidente registrado neste dia.</span>
      `;
      incidentsListEl.appendChild(dayItem);
    }
  }

  // Setup Latency Period Tabs
  function setupLatencyTabs() {
    const tabs = document.querySelectorAll('.latency-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const period = tab.getAttribute('data-period');
        renderLatencyChart(period);
      });
    });
  }

  // Update live timestamp
  function updateTimestamp() {
    if (!lastUpdatedEl) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    lastUpdatedEl.textContent = `Atualizado às ${timeStr}`;
  }

  // Initialize Application
  function init() {
    renderServices();
    renderLatencyChart('24h');
    renderIncidentHistory();
    setupLatencyTabs();
    updateTimestamp();

    // Auto-refresh timestamp every 60 seconds
    setInterval(updateTimestamp, 60000);
  }

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
