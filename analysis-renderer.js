(function initAnalysisRenderer(root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.renderAnalysisReport = api.renderAnalysisReport;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createAnalysisRenderer() {
  function escapeHTML(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeURL(value) {
    try {
      const url = new URL(String(value ?? ''));

      return url.protocol === 'http:' || url.protocol === 'https:'
        ? url.href
        : null;
    } catch {
      return null;
    }
  }

  function renderList(items) {
    const safeItems = Array.isArray(items) ? items : [];

    if (safeItems.length === 0) {
      return '<p class="report-empty">Brak dodatkowych informacji.</p>';
    }

    return `<ul class="report-list">${safeItems
      .map(item => `<li>${escapeHTML(item)}</li>`)
      .join('')}</ul>`;
  }

  function renderCard(title, command, items, modifier) {
    return `
      <section class="report-card ${modifier}">
        <div class="report-command">${escapeHTML(command)}</div>
        <h3>${escapeHTML(title)}</h3>
        ${renderList(items)}
      </section>`;
  }

  function renderSkill(skill) {
    const score = Number.isInteger(skill?.score)
      ? Math.min(5, Math.max(1, skill.score))
      : 1;
    const segments = Array.from(
      { length: 5 },
      (_, index) => `<span class="skill-segment${index < score ? ' active' : ''}"></span>`
    ).join('');

    return `
      <li class="skill-row">
        <div class="skill-meta">
          <span>${escapeHTML(skill?.label)}</span>
          <strong>${score}/5</strong>
        </div>
        <div class="skill-bar" aria-label="${escapeHTML(skill?.label)}: ${score} na 5">
          ${segments}
        </div>
      </li>`;
  }

  function renderSkillMatrix(skills) {
    if (!Array.isArray(skills) || skills.length === 0) {
      return '';
    }

    return `
      <section class="skill-matrix">
        <div class="report-command">$ competency_matrix --evidence=cv</div>
        <h3>Macierz kompetencji</h3>
        <ul class="skill-list">${skills.map(renderSkill).join('')}</ul>
      </section>`;
  }

  function renderKeywords(keywords) {
    const links = (Array.isArray(keywords) ? keywords : [])
      .map(keyword => {
        const url = safeURL(keyword?.url);

        return url
          ? `<a class="keyword-tag" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(keyword?.term)}</a>`
          : '';
      })
      .filter(Boolean)
      .join('');

    if (!links) {
      return '';
    }

    return `
      <section class="keyword-panel">
        <div class="report-command">$ sources --keywords</div>
        <h3>Słowa kluczowe</h3>
        <div class="keyword-list">${links}</div>
      </section>`;
  }

  function renderAnalysisReport(analysis) {
    const report = analysis || {};
    const percentage = Number.isFinite(report.matchPercentage)
      ? Math.min(100, Math.max(0, Math.round(report.matchPercentage)))
      : 0;

    return `
      <div class="report-shell">
        <header class="report-header">
          <div>
            <p class="report-kicker">RADZIM // CV MATCH REPORT</p>
            <h2>Analiza dopasowania</h2>
            <p class="report-subtitle">Priorytety na podstawie oferty pracy i treści CV.</p>
          </div>
          <div class="match-score" aria-label="Dopasowanie ${percentage} procent">
            <span>${percentage}%</span>
            <small>match_score</small>
          </div>
        </header>
        <div class="report-grid">
          <aside class="report-sidebar">
            ${renderSkillMatrix(report.skillRatings)}
            ${renderKeywords(report.keywords)}
          </aside>
          <div class="report-main">
            ${renderCard('Mocne strony', '$ strengths --verified', report.whatWorks, 'strength-card')}
            ${renderCard('Luki do uzupełnienia', '$ gaps --priority', report.whatsMissing, 'gap-card')}
            ${renderCard('Następne kroki', '$ actions --next', report.concreteChanges, 'action-card')}
          </div>
        </div>
      </div>`;
  }

  return {
    renderAnalysisReport
  };
}));
