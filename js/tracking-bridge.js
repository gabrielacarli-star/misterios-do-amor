(function () {
  var STORAGE_PREFIX = "tdl_";
  var TRACKING_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "fbclid",
    "gclid",
    "ttclid",
    "xcod",
    "sck",
    "click_id",
    "click_type"
  ];

  function getCookie(name) {
    var parts = document.cookie ? document.cookie.split(";") : [];
    for (var i = 0; i < parts.length; i += 1) {
      var pair = parts[i].trim().split("=");
      if (pair[0] === name) return decodeURIComponent(pair.slice(1).join("="));
    }
    return "";
  }

  function saveFromUrl() {
    var params = new URLSearchParams(window.location.search);
    TRACKING_KEYS.forEach(function (key) {
      var value = params.get(key);
      if (value) localStorage.setItem(STORAGE_PREFIX + key, value);
    });

    var fbclid = params.get("fbclid") || localStorage.getItem(STORAGE_PREFIX + "fbclid") || "";
    if (fbclid && !getCookie("_fbc")) {
      localStorage.setItem(STORAGE_PREFIX + "_fbc", "fb.1." + Date.now() + "." + fbclid);
    }
  }

  function read() {
    saveFromUrl();
    var params = new URLSearchParams(window.location.search);
    var tracking = {};

    TRACKING_KEYS.forEach(function (key) {
      var value = params.get(key) || localStorage.getItem(STORAGE_PREFIX + key) || "";
      if (value) {
        tracking[key] = value;
        localStorage.setItem(STORAGE_PREFIX + key, value);
      }
    });

    var fbp = getCookie("_fbp") || localStorage.getItem(STORAGE_PREFIX + "_fbp") || "";
    var fbc = getCookie("_fbc") || localStorage.getItem(STORAGE_PREFIX + "_fbc") || "";
    if (fbp) {
      tracking.fbp = fbp;
      tracking._fbp = fbp;
      localStorage.setItem(STORAGE_PREFIX + "_fbp", fbp);
    }
    if (fbc) {
      tracking.fbc = fbc;
      tracking._fbc = fbc;
      localStorage.setItem(STORAGE_PREFIX + "_fbc", fbc);
    }

    if (!tracking.click_id) {
      ["fbclid", "gclid", "ttclid", "xcod", "sck"].some(function (key) {
        if (!tracking[key]) return false;
        tracking.click_id = tracking[key];
        tracking.click_type = key;
        return true;
      });
    }

    return tracking;
  }

  function trackInitiateCheckout(amount, productName) {
    var value = Number(amount) || 0;
    var payload = {
      currency: "BRL",
      value: value,
      content_name: productName || "Templo da Luz Amorosa",
      content_type: "product"
    };

    try {
      window.dispatchEvent(new CustomEvent("utmify:checkout", { detail: payload }));
    } catch (error) {}

    try {
      if (window.fbq) window.fbq("track", "InitiateCheckout", payload);
    } catch (error) {}

    try {
      if (window.ttq) window.ttq.track("InitiateCheckout", payload);
    } catch (error) {}
  }

  function trackEvent(eventName, payload, isCustom) {
    payload = payload || {};
    try {
      if (window.fbq) window.fbq(isCustom ? "trackCustom" : "track", eventName, payload);
    } catch (error) {}
    try {
      if (window.ttq) window.ttq.track(eventName, payload);
    } catch (error) {}
  }

  window.TemploTracking = {
    read: read,
    trackInitiateCheckout: trackInitiateCheckout,
    trackEvent: trackEvent
  };

  saveFromUrl();
})();
