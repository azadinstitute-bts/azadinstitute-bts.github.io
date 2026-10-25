/* BTS pamphlet attribution: optional telemetry; never gates navigation or payment. */
(function () {
  'use strict';
  var endpoint = 'https://mqorslvouzmrvciubpoq.supabase.co/rest/v1/pamphlet_events';
  var apiKey = 'sb_publishable_MGQBYhh5NdPfAq4REmawqw_60sJGYQp';
  var storageKey = 'bts_pamphlet_v1';
  var ttl = 30 * 24 * 60 * 60 * 1000;
  var placements = ['general', 'library', 'college', 'coaching'];
  var campaign = 'pamphlet_2026_10';
  var uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  var context = null;
  function newId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    if (!window.crypto || !window.crypto.getRandomValues) return null;
    var bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    var hex = Array.from(bytes, function (n) { return n.toString(16).padStart(2, '0'); }).join('');
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
  }
  function valid(value) {
    return value && value.campaign === campaign && placements.indexOf(value.placement) >= 0 &&
      uuidPattern.test(value.visit_id) && Number.isFinite(value.expires_at) &&
      value.expires_at > Date.now() && value.expires_at <= Date.now() + ttl + 60000;
  }
  function clear() {
    context = null;
    try { window.localStorage.removeItem(storageKey); } catch (_) {}
  }
  try {
    var params = new URL(window.location.href).searchParams;
    var source = params.get('utm_source');
    if (source && source !== 'pamphlet') {
      clear();
    } else if (source === 'pamphlet') {
      var placement = params.get('utm_content') || 'general';
      if (params.get('utm_medium') !== 'qr' || params.get('utm_campaign') !== campaign || placements.indexOf(placement) < 0) {
        clear();
      } else {
        var saved = null;
        try { saved = JSON.parse(window.localStorage.getItem(storageKey)); } catch (_) {}
        var suppliedId = params.get('bts_visit');
        var suppliedUntil = Number(params.get('bts_until'));
        var carried = uuidPattern.test(suppliedId || '') && suppliedUntil > Date.now() && suppliedUntil <= Date.now() + ttl;
        context = {
          campaign: campaign, placement: placement,
          visit_id: carried ? suppliedId : valid(saved) ? saved.visit_id : newId(),
          expires_at: carried ? suppliedUntil : Date.now() + ttl,
          is_test: params.get('bts_test') === '1' || Boolean(valid(saved) && saved.is_test)
        };
        if (!valid(context)) context = null;
      }
    } else {
      try {
        var stored = JSON.parse(window.localStorage.getItem(storageKey));
        if (valid(stored)) context = stored; else clear();
      } catch (_) {}
    }
    if (context) {
      try { window.localStorage.setItem(storageKey, JSON.stringify(context)); } catch (_) {}
    }
  } catch (_) { context = null; }
  if (!context) return;

  function track(name, admissionId) {
    try {
      if (!valid(context)) { clear(); return; }
      var id = newId();
      if (!id) return;
      var row = {
        event_id: id, visit_id: context.visit_id, campaign: context.campaign,
        placement: context.placement, event_name: name, is_test: context.is_test,
        page_path: /^\/[a-z0-9_./-]*$/i.test(window.location.pathname) ? window.location.pathname.slice(0, 160) : '/',
        admission_id: admissionId || null
      };
      window.fetch(endpoint, {
        method: 'POST', headers: { apikey: apiKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(row), keepalive: true, credentials: 'omit', referrerPolicy: 'no-referrer'
      }).catch(function () {});
    } catch (_) {}
  }
  window.BTSPamphlet = {
    trackAdmission: function (id) {
      if (/^ADM_[0-9a-f]{48}$/.test(String(id || ''))) track('admission_created', id);
    }
  };
  track('page_view');
  if (window.location.pathname.indexOf('/bts-daily-tests/') === 0 &&
      new URL(window.location.href).searchParams.get('mode') === 'demo') track('demo_open');

  document.addEventListener('click', function (event) {
    try {
      if (event.defaultPrevented || !valid(context)) return;
      var anchor = event.target && event.target.closest && event.target.closest('a[href]');
      if (!anchor || anchor.hasAttribute('download')) return;
      var url = new URL(anchor.getAttribute('href'), window.location.href);
      if (url.protocol !== 'https:') return;
      if (url.hostname === 'play.google.com' && url.pathname === '/store/apps/details' &&
          url.searchParams.get('id') === 'in.azadinstitute.btsstudent') {
        track('app_click');
        var referrer = new URLSearchParams({
          utm_source: 'pamphlet', utm_medium: 'qr', utm_campaign: campaign, utm_content: context.placement
        });
        url.searchParams.set('referrer', referrer.toString());
        anchor.setAttribute('href', url.href);
        return;
      }
      if (['bilaspurtestseries.com', 'www.bilaspurtestseries.com', 'admission.bilaspurtestseries.com'].indexOf(url.hostname) < 0) return;
      var raw = anchor.getAttribute('href');
      if (raw.charAt(0) === '#') return;
      if (url.searchParams.has('utm_source') && url.searchParams.get('utm_source') !== 'pamphlet') return;
      if (url.searchParams.get('mode') === 'demo') track('demo_click');
      else if (/\/teacher\.html$/.test(url.pathname) && url.hash) track('course_click');
      url.searchParams.set('utm_source', 'pamphlet');
      url.searchParams.set('utm_medium', 'qr');
      url.searchParams.set('utm_campaign', campaign);
      url.searchParams.set('utm_content', context.placement);
      url.searchParams.set('bts_visit', context.visit_id);
      url.searchParams.set('bts_until', String(context.expires_at));
      if (context.is_test) url.searchParams.set('bts_test', '1');
      anchor.setAttribute('href', url.href);
    } catch (_) {}
  });
})();

