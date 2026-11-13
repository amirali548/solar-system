import { BODIES } from '../data/planets.js';

export class UIController {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.panelOpen = false;
    this.activeId = null;
    this.paused = false;
    this.heroTimer = null;
    this.tooltipVisible = false;
    this.clockTimer = null;

    this.el = {
      navTrack: document.getElementById('nav-track'),
      panel: document.getElementById('info-panel'),
      panelClose: document.getElementById('panel-close'),
      panelClass: document.getElementById('panel-class'),
      panelOrder: document.getElementById('panel-order'),
      panelName: document.getElementById('panel-name'),
      panelTagline: document.getElementById('panel-tagline'),
      panelDesc: document.getElementById('panel-desc'),
      statGrid: document.getElementById('stat-grid'),
      panelFacts: document.getElementById('panel-facts'),
      panelScroll: document.getElementById('panel-scroll'),
      previewCanvas: document.getElementById('preview-canvas'),
      tooltip: document.getElementById('tooltip'),
      loader: document.getElementById('loader'),
      loaderBar: document.getElementById('loader-bar-fill'),
      loaderPercent: document.getElementById('loader-percent'),
      loaderStatus: document.getElementById('loader-status'),
      hero: document.getElementById('hero'),
      playBtn: document.getElementById('play-btn'),
      playIcon: document.getElementById('play-icon'),
      speedSlider: document.getElementById('speed-slider'),
      speedValue: document.getElementById('speed-value'),
      orbitsBtn: document.getElementById('orbits-btn'),
      resetBtn: document.getElementById('reset-btn'),
      backBtn: document.getElementById('back-btn'),
      focusTag: document.getElementById('focus-tag'),
      focusTagName: document.getElementById('focus-tag-name'),
      focusTagClass: document.getElementById('focus-tag-class'),
      clock: document.getElementById('clock'),
      fatal: document.getElementById('fatal'),
      fatalMessage: document.getElementById('fatal-message')
    };

    this.buildNav();
    this.bindEvents();
    this.startClock();
  }

  buildNav() {
    const fragment = document.createDocumentFragment();
    BODIES.forEach((body) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'nav-item';
      button.dataset.id = body.id;
      button.setAttribute('aria-label', `Inspect ${body.name}`);
      button.innerHTML = `
        <span class="nav-dot" style="--dot:${body.color}"></span>
        <span class="nav-name">${body.name}</span>
        <span class="nav-index">${body.order}</span>
      `;
      button.addEventListener('click', () => this.callbacks.onSelect?.(body.id));
      fragment.appendChild(button);
    });
    this.el.navTrack.appendChild(fragment);
  }

  bindEvents() {
    this.el.panelClose.addEventListener('click', () => this.callbacks.onClose?.());
    this.el.backBtn.addEventListener('click', () => this.callbacks.onClose?.());

    this.el.playBtn.addEventListener('click', () => this.callbacks.onTogglePause?.());
    this.el.resetBtn.addEventListener('click', () => this.callbacks.onReset?.());
    this.el.orbitsBtn.addEventListener('click', () => this.callbacks.onToggleOrbits?.());

    this.el.speedSlider.addEventListener('input', (event) => {
      const value = Number.parseFloat(event.target.value);
      this.setSpeedLabel(value);
      this.callbacks.onSpeedChange?.(value);
    });

    this.el.hero.addEventListener('click', () => this.hideHero());
    document.getElementById('hero-start').addEventListener('click', (event) => {
      event.stopPropagation();
      this.hideHero();
      this.callbacks.onStartExploring?.();
    });
  }

  startClock() {
    const update = () => {
      const now = new Date();
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const day = String(now.getUTCDate()).padStart(2, '0');
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      this.el.clock.textContent = `${day} ${months[now.getUTCMonth()]} ${now.getUTCFullYear()} \u00b7 ${hours}:${minutes} UTC`;
    };
    update();
    this.clockTimer = window.setInterval(update, 15000);
  }

  setLoading(ratio, status) {
    const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
    this.el.loaderBar.style.width = `${percent}%`;
    this.el.loaderPercent.textContent = `${percent}%`;
    if (status) this.el.loaderStatus.textContent = status;
  }

  hideLoader() {
    this.el.loader.classList.add('is-hidden');
    this.el.loader.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => {
      this.el.loader.style.display = 'none';
    }, 1100);
    this.showHero();
  }

  showHero() {
    this.el.hero.classList.remove('is-hidden');
    window.clearTimeout(this.heroTimer);
    this.heroTimer = window.setTimeout(() => this.hideHero(), 12000);
  }

  hideHero() {
    window.clearTimeout(this.heroTimer);
    this.el.hero.classList.add('is-hidden');
  }

  showFatal(message) {
    this.el.fatal.hidden = false;
    this.el.loader.classList.add('is-hidden');
    if (message) this.el.fatalMessage.textContent = message;
  }

  setActive(id) {
    this.activeId = id;
    this.el.navTrack.querySelectorAll('.nav-item').forEach((button) => {
      const isActive = button.dataset.id === id;
      button.classList.toggle('is-active', isActive);
      if (isActive) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  }

  openBody(body, preview) {
    const data = body.data;
    this.el.panelClass.textContent = data.classification ?? data.type.toUpperCase();
    this.el.panelOrder.textContent = data.kind === 'star' ? 'PARENT STAR / SYSTEM CORE' : `OBJECT ${data.order} / 08`;
    this.el.panelName.textContent = data.name;
    this.el.panelTagline.textContent = data.tagline;
    this.el.panelDesc.textContent = data.description;

    this.el.statGrid.innerHTML = data.stats.map((stat) => `
      <div class="stat">
        <span class="stat-label">${stat.label}</span>
        <span class="stat-value">${stat.value}</span>
        <span class="stat-note">${stat.note}</span>
      </div>
    `).join('');

    this.el.panelFacts.innerHTML = data.facts.map((fact, index) => `
      <li class="fact">
        <span class="fact-index">${String(index + 1).padStart(2, '0')}</span>
        <p>${fact}</p>
      </li>
    `).join('');

    this.el.panel.classList.add('is-open');
    this.el.panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-inspecting');
    this.panelOpen = true;
    this.setActive(data.id);
    preview.show(body);

    this.el.panelScroll.scrollTop = 0;
    this.el.focusTagName.textContent = data.name.toUpperCase();
    this.el.focusTagClass.textContent = data.classification ?? 'STELLAR OBJECT';
    this.el.focusTag.classList.add('is-visible');
  }

  closePanel() {
    this.el.panel.classList.remove('is-open');
    this.el.panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-inspecting');
    this.panelOpen = false;
    this.setActive(null);
    this.el.focusTag.classList.remove('is-visible');
  }

  showTooltip(body, x, y) {
    const tooltip = this.el.tooltip;
    tooltip.innerHTML = `
      <span class="tooltip-dot" style="--dot:${body.color}"></span>
      <span class="tooltip-text">
        <strong>${body.name}</strong>
        <em>${body.classification ?? body.type}</em>
      </span>
      <span class="tooltip-action">INSPECT</span>
    `;
    tooltip.classList.add('is-visible');
    this.tooltipVisible = true;
    this.moveTooltip(x, y);
  }

  moveTooltip(x, y) {
    if (!this.tooltipVisible) return;
    const tooltip = this.el.tooltip;
    const width = tooltip.offsetWidth || 220;
    const height = tooltip.offsetHeight || 58;
    const padding = 18;
    const left = Math.min(window.innerWidth - width - padding, Math.max(padding, x + 18));
    const top = Math.min(window.innerHeight - height - padding, Math.max(padding, y + 18));
    tooltip.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  }

  hideTooltip() {
    if (!this.tooltipVisible) return;
    this.el.tooltip.classList.remove('is-visible');
    this.tooltipVisible = false;
  }

  setPaused(paused) {
    this.paused = paused;
    this.el.playBtn.classList.toggle('is-paused', paused);
    this.el.playBtn.setAttribute('aria-label', paused ? 'Resume planetary motion' : 'Pause planetary motion');
    this.el.playIcon.innerHTML = paused
      ? '<path d="M8 5v14l11-7z"/>'
      : '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>';
    document.body.classList.toggle('is-paused', paused);
  }

  setSpeedLabel(value) {
    this.el.speedValue.textContent = `${value.toFixed(1)}\u00d7`;
    const min = Number.parseFloat(this.el.speedSlider.min);
    const max = Number.parseFloat(this.el.speedSlider.max);
    const fill = ((value - min) / (max - min)) * 100;
    this.el.speedSlider.style.setProperty('--fill', `${fill}%`);
  }

  setOrbitsVisible(visible) {
    this.el.orbitsBtn.setAttribute('aria-pressed', String(visible));
    this.el.orbitsBtn.classList.toggle('is-off', !visible);
  }

  updateFocusTag(worldPosition, radius, camera, visible) {
    const tag = this.el.focusTag;
    if (!visible || !this.panelOpen) {
      tag.classList.remove('is-visible');
      return;
    }
    const projected = worldPosition.clone().project(camera);
    const inFront = projected.z > -1 && projected.z < 1;
    if (!inFront) {
      tag.classList.remove('is-visible');
      return;
    }
    tag.classList.add('is-visible');
    const width = window.innerWidth;
    const height = window.innerHeight;
    const x = (projected.x * 0.5 + 0.5) * width;
    const y = (-projected.y * 0.5 + 0.5) * height;
    const distance = camera.position.distanceTo(worldPosition);
    const tan = Math.tan((camera.fov * Math.PI) / 360);
    const projectedRadius = (radius / (distance * tan)) * (height / 2);
    const tagY = Math.min(height - 96, y + Math.min(projectedRadius * 1.05, height * 0.36) + 26);
    tag.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(tagY)}px, 0) translate(-50%, -50%)`;
  }

  setActiveSpeed(value) {
    this.el.speedSlider.value = String(value);
    this.setSpeedLabel(value);
  }
}
