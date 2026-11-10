/* @ds-bundle: {"format":4,"namespace":"Marlin","components":[{"name":"ReportHeader"},{"name":"SectionTitle"},{"name":"KpiCard"},{"name":"Pill"},{"name":"CompareBars"},{"name":"DataTable"},{"name":"Callout"},{"name":"BrandFrame"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }

  function ReportHeader(p) {
    return h('header', { className: cx('mh-report-header', p.className) },
      h('div', { className: 'mh-report-header__text' },
        h('h1', { className: 'mh-report-header__title' }, p.title),
        p.subtitle ? h('p', { className: 'mh-report-header__subtitle' }, p.subtitle) : null),
      p.logoSrc ? h('img', { className: 'mh-report-header__logo', src: p.logoSrc, alt: p.logoAlt || 'Marlin Hospitality' }) : null);
  }

  function SectionTitle(p) {
    return h('div', { className: cx('mh-section', p.className) },
      h('div', { className: 'mh-section__row' },
        p.number ? h('span', { className: 'mh-section__num' }, p.number) : null,
        h('h2', { className: 'mh-section__title' }, p.title)),
      p.lead ? h('p', { className: 'mh-section__lead' }, p.lead) : null);
  }

  function Pill(p) {
    var tone = p.tone || 'neutral';
    return h('span', { className: cx('mh-pill', 'mh-pill--' + tone, p.className) }, p.children);
  }

  function CompareBars(p) {
    var rows = p.rows || [];
    var max = p.max || Math.max.apply(null, rows.map(function (r) { return Math.abs(r.value) || 0; }).concat([1]));
    return h('div', { className: cx('mh-bars', p.className) }, rows.map(function (r, i) {
      var pct = Math.max(2, Math.round((Math.abs(r.value) / max) * 100));
      return h('div', { className: 'mh-bars__row', key: i },
        h('span', { className: 'mh-bars__label' }, r.label),
        h('span', { className: 'mh-bars__track' },
          h('span', { className: 'mh-bars__bar mh-bars__bar--' + (r.series || (i === 0 ? 'ty' : 'ly')), style: { width: pct + '%' } })),
        h('span', { className: 'mh-bars__value' }, r.display != null ? r.display : String(r.value)));
    }));
  }

  function KpiCard(p) {
    var tone = p.tone || 'neutral';
    return h('div', { className: cx('mh-kpi', 'mh-kpi--' + tone, p.className) },
      h('div', { className: 'mh-kpi__label' }, p.label),
      h('div', { className: 'mh-kpi__row' },
        h('span', { className: 'mh-kpi__value' }, p.value),
        p.delta ? h(Pill, { tone: tone === 'neutral' ? 'neutral' : tone }, p.delta) : null),
      p.note ? h('div', { className: 'mh-kpi__note' }, p.note) : null,
      p.compare ? h(CompareBars, { rows: p.compare }) : null);
  }

  function DataTable(p) {
    var cols = p.columns || [];
    return h('table', { className: cx('mh-table', p.className) },
      h('thead', null, h('tr', null, cols.map(function (c) {
        return h('th', { key: c.key, className: c.align === 'right' ? 'is-num' : null }, c.label);
      }))),
      h('tbody', null, (p.rows || []).map(function (r, i) {
        return h('tr', { key: i, className: r.total ? 'is-total' : null }, cols.map(function (c) {
          return h('td', { key: c.key, className: c.align === 'right' ? 'is-num' : null }, r[c.key]);
        }));
      })));
  }

  function Callout(p) {
    var tone = p.tone || 'positive';
    return h('section', { className: cx('mh-callout', 'mh-callout--' + tone, p.className) },
      h('h3', { className: 'mh-callout__title' }, p.title),
      p.items ? h('ul', { className: 'mh-callout__list' }, p.items.map(function (it, i) { return h('li', { key: i }, it); })) : p.children);
  }

  function BrandFrame(p) {
    return h('div', { className: cx('mh-frame', p.className) },
      h('div', { className: 'mh-frame__box' },
        p.label ? h('span', { className: 'mh-frame__tab mh-frame__tab--top' }, p.label) : null,
        h('div', { className: 'mh-frame__body' }, p.children),
        p.footer ? h('span', { className: 'mh-frame__tab mh-frame__tab--bottom' }, p.footer) : null));
  }

  window.Marlin = Object.assign(window.Marlin || {}, {
    ReportHeader: ReportHeader, SectionTitle: SectionTitle, KpiCard: KpiCard, Pill: Pill,
    CompareBars: CompareBars, DataTable: DataTable, Callout: Callout, BrandFrame: BrandFrame
  });
})();
