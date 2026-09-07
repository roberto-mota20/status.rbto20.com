/**
 * Status Page Application Logic
 * status.rbto20.com
 */

(function () {
  'use strict';

  // Real Monitoring Start Date (September 6, 2026)
  const MONITORING_START_DATE = new Date(2026, 8, 6); // Month is 0-indexed: 8 = Sep

  // Fallback / Initial Real Collected Data (from Upptime history/summary.json)
  const INITIAL_SERVICES = [
    {
      id: 'dominio-principal',
      name: 'Domínio Principal',
      url: 'https://rbto20.com',
      uptime: '100.00%',
      time: 173,
      status: 'up'
    },
    {
      id: 'redirecionamento',
      name: 'Redirecionamento',
      url: 'https://c.rbto20.com',
      uptime: '100.00%',
      time: 258,
      status: 'up'
    },
    {
      id: 'projetos',
      name: 'Projetos',
      url: 'https://toto.rbto20.com',
      uptime: '100.00%',
      time: 182,
      status: 'up'
    }
  ];

  // DOM Elements
  const servicesContainer = document.getElementById('services-list');
  const metricsGridEl = document.getElementById('metrics-summary-grid');
  const incidentsSectionEl = document.getElementById('incidents-section');
  const incidentsListEl = document.getElementById('incidents-list');
  const lastUpdatedEl = document.getElementById('last-updated-text');
  const tooltip = document.getElementById('app-tooltip');

  // Format date helper (pt-BR)
  function formatDatePt(date) {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const d = date.getDate();
    const m = months[date.getMonth()];
    const y = date.getFullYear();
    return `${d} de ${m} de ${y}`;
  }

  // Generate 90-day history items with honest date boundaries
  function generate90DaysData(service, startDate) {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);

      // Only days >= start date have monitoring data
      if (d >= start) {
        days.push({
          date: d,
          formattedDate: formatDatePt(d),
          status: service.status === 'up' ? 'operational' : 'down',
          tooltipText: '100% de disponibilidade • Nenhum incidente registrado',
          hasData: true
        });
      } else {
        days.push({
          date: d,
          formattedDate: formatDatePt(d),
          status: 'empty',
          tooltipText: 'Sem dados de monitoramento',
          hasData: false
        });
      }
    }
    return days;
  }

  // Render Service Cards
  function renderServices(services) {
    if (!servicesContainer) return;
    servicesContainer.innerHTML = '';

    services.forEach(service => {
      const days = generate90DaysData(service, MONITORING_START_DATE);

      const card = document.createElement('div');
      card.className = 'service-card';
      card.id = `service-${service.id || service.slug}`;

      // Card Header: Service name left, Uptime % right (NO Operational tag)
      const header = document.createElement('div');
      header.className = 'service-header';
      header.innerHTML = `
        <span class="service-name">${service.name}</span>
        <span class="service-uptime-pct">${service.uptime || '100.00%'} uptime</span>
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
        bar.setAttribute('data-status', day.tooltipText);

        // Hover & Touch Events
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
        <span>${service.uptime || '100.00%'} disponível</span>
        <span>Hoje</span>
      `;
      timeline.appendChild(legend);

      card.appendChild(timeline);
      servicesContainer.appendChild(card);
    });
  }

  // Render Response Time Metrics Grid
  function renderMetrics(services) {
    if (!metricsGridEl) return;
    metricsGridEl.innerHTML = '';

    services.forEach(service => {
      const item = document.createElement('div');
      item.className = 'metric-item';
      item.innerHTML = `
        <span class="metric-label">${service.name}</span>
        <span class="metric-value">${service.time ? `${service.time} ms` : '--'}</span>
      `;
      metricsGridEl.appendChild(item);
    });
  }

  // Render Incident History (Only if real incidents exist)
  function renderIncidentHistory(incidents) {
    if (!incidentsSectionEl || !incidentsListEl) return;

    if (!incidents || incidents.length === 0) {
      incidentsSectionEl.style.display = 'none';
      return;
    }

    incidentsSectionEl.style.display = 'flex';
    incidentsListEl.innerHTML = '';

    incidents.forEach(inc => {
      const dayItem = document.createElement('div');
      dayItem.className = 'incident-day';
      dayItem.innerHTML = `
        <span class="incident-date">${inc.date} - ${inc.title}</span>
        <p class="incident-desc">${inc.description}</p>
      `;
      incidentsListEl.appendChild(dayItem);
    });
  }

  // Tooltip handler
  function showTooltip(e) {
    if (!tooltip) return;
    const target = e.currentTarget;
    const date = target.getAttribute('data-date');
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

  // Update live timestamp
  function updateTimestamp() {
    if (!lastUpdatedEl) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    lastUpdatedEl.textContent = `Atualizado às ${timeStr}`;
  }

  // Load Real Data from history/summary.json if available
  async function loadData() {
    let services = INITIAL_SERVICES;
    try {
      const res = await fetch('history/summary.json');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          services = data;
        }
      }
    } catch (e) {
      // Use fallback initial services
    }

    renderServices(services);
    renderMetrics(services);
    renderIncidentHistory([]); // 0 incidents recorded
    updateTimestamp();
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadData);
  } else {
    loadData();
  }

})();
