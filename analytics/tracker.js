(function () {
  var script = document.currentScript;
  var endpoint = script ? new URL('api.php', script.src).href : '/analytics/api.php';
  var storageKey = 'tdl_analytics_session';
  var utmStorageKey = 'tdl_analytics_utm';
  var sessionId = '';

  try {
    sessionId = localStorage.getItem(storageKey) || '';
    if (!sessionId) {
      sessionId = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(storageKey, sessionId);
    }
  } catch (error) {
    sessionId = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }

  function utmParams() {
    var params = new URLSearchParams(window.location.search);
    var current = {
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_content: params.get('utm_content') || '',
      utm_term: params.get('utm_term') || '',
      fbclid: params.get('fbclid') || '',
      gclid: params.get('gclid') || '',
      ttclid: params.get('ttclid') || '',
    };

    try {
      var saved = JSON.parse(localStorage.getItem(utmStorageKey) || '{}');
      Object.keys(current).forEach(function (key) {
        if (current[key]) saved[key] = current[key];
      });
      localStorage.setItem(utmStorageKey, JSON.stringify(saved));
      Object.keys(current).forEach(function (key) {
        if (!current[key] && saved[key]) current[key] = saved[key];
      });
    } catch (error) {}

    return current;
  }

  function currentStep() {
    try {
      return new URLSearchParams(window.location.search).get('step') || '';
    } catch (error) {
      return '';
    }
  }

  function buildPayload(eventType, extra) {
    var data = Object.assign({
      eventType: eventType,
      sessionId: sessionId,
      page: window.location.href,
      path: window.location.pathname || '/',
      step: currentStep(),
      title: document.title,
      referrer: document.referrer || '',
    }, utmParams(), extra || {});

    return JSON.stringify(data);
  }

  function post(body) {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
      cache: 'no-store',
      keepalive: true,
    }).catch(function () {});
  }

  function beacon(eventType, extra) {
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([buildPayload(eventType, extra)], { type: 'application/json' }));
      }
    } catch (error) {}
  }

  function send(eventType, extra) {
    post(buildPayload(eventType, extra));
  }

  function readableLabel(element) {
    if (!element) return '';
    return (element.getAttribute('aria-label') || element.innerText || element.textContent || element.href || '').trim().replace(/\s+/g, ' ').slice(0, 160);
  }

  send('pageview');
  setInterval(function () {
    send('heartbeat');
  }, 10000);

  document.addEventListener('click', function (event) {
    var target = event.target.closest('a, button, [role="button"], input[type="submit"]');
    if (!target) return;
    send('click', {
      label: readableLabel(target),
      value: target.href || target.getAttribute('data-analytics') || '',
    });
  }, true);

  window.addEventListener('pagehide', function () {
    beacon('pagehide');
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      beacon('visibility_hidden');
    }
  });
})();