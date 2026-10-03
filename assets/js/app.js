/* ==========================================================================
   Kitbox — shared application script
   Theme, navigation, privacy shield, consent, toasts, storage, tool helpers.
   No user data ever leaves the browser.
   ========================================================================== */
(function (global) {
  "use strict";

  /* ----------------------------------------------------------------------
     CONFIGURATION — replace these values before going live.
     ---------------------------------------------------------------------- */
  var CONFIG = {
    SITE_NAME: "Kitbox",
    /* Production domain. Replace in this one place, then regenerate sitemap. */
    SITE_ORIGIN: "https://www.example.com",
    /* Contact address used by the contact page mailto fallback. */
    CONTACT_EMAIL: "hello@example.com",
    /* Google AdSense. Replace both values with your real IDs. */
    ADSENSE_PUBLISHER_ID: "ca-pub-XXXXXXXXXXXXXXXX",
    ADSENSE_DEFAULT_SLOT: "XXXXXXXXXX",
    /* CDN bases — cdnjs only. */
    CDN: {
      pdfLib: "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
      jszip: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
      qrcode: "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"
    },
    MAX_FILE_BYTES: 100 * 1024 * 1024
  };

  var AD_PUBLISHER_CONFIGURED = CONFIG.ADSENSE_PUBLISHER_ID.indexOf("X") === -1;

  /* ---------------------------- safe storage ---------------------------- */
  var store = {
    get: function (k) { try { return global.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { global.localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    remove: function (k) { try { global.localStorage.removeItem(k); return true; } catch (e) { return false; } }
  };

  var i18n = global.KitboxI18n || { t: function (k) { return k; }, lang: function () { return "en"; }, bytes: String, num: String, percent: String };
  var t = function (k, v) { return i18n.t(k, v); };
  var isRTL = function () { return document.documentElement.getAttribute("dir") === "rtl"; };

  /* ------------------------------- theme -------------------------------- */
  var THEME_KEY = "kitbox:theme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0C1222" : "#F7F9FF");
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      var label = btn.getAttribute("data-label-" + (theme === "dark" ? "light" : "dark"));
      if (label) { btn.setAttribute("aria-label", label); btn.setAttribute("title", label); }
    });
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function initTheme() {
    applyTheme(currentTheme());
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        applyTheme(next);
        store.set(THEME_KEY, next);
      });
    });
  }

  /* ---------------------------- mobile menu ----------------------------- */
  function initMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var menu = document.getElementById("mobile-menu");
    if (!toggle || !menu) return;
    var lastFocus = null;

    function focusables() {
      return Array.prototype.filter.call(
        menu.querySelectorAll('a[href], button:not([disabled])'),
        function (el) { return el.offsetParent !== null; }
      );
    }

    function open() {
      lastFocus = document.activeElement;
      menu.setAttribute("data-open", "true");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      var f = focusables();
      if (f.length) f[0].focus();
    }

    function close() {
      menu.setAttribute("data-open", "false");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    toggle.addEventListener("click", function () {
      menu.getAttribute("data-open") === "true" ? close() : open();
    });

    menu.addEventListener("click", function (e) {
      if (e.target === menu) close();
      var link = e.target.closest ? e.target.closest("a") : null;
      if (link) close();
      if (e.target.closest && e.target.closest("[data-menu-close]")) close();
    });

    document.addEventListener("keydown", function (e) {
      if (menu.getAttribute("data-open") !== "true") return;
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key === "Tab") {
        var f = focusables();
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* --------------------------- privacy shield --------------------------- */
  var shieldTimer = null;

  function initShield() {
    document.querySelectorAll(".shield").forEach(function (shield) {
      var btn = shield.querySelector(".shield-btn");
      var pop = shield.querySelector(".shield-popover");
      if (!btn || !pop) return;

      function closePop() {
        pop.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      }
      function openPop() {
        pop.hidden = false;
        btn.setAttribute("aria-expanded", "true");
      }

      btn.addEventListener("click", function () {
        pop.hidden ? openPop() : closePop();
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !pop.hidden) { closePop(); btn.focus(); }
      });

      document.addEventListener("click", function (e) {
        if (!pop.hidden && !shield.contains(e.target)) closePop();
      });

      pop.addEventListener("focusout", function () {
        global.setTimeout(function () {
          if (!pop.hidden && !shield.contains(document.activeElement)) closePop();
        }, 0);
      });
    });
  }

  function shieldState(state) {
    if (shieldTimer) { global.clearTimeout(shieldTimer); shieldTimer = null; }
    document.querySelectorAll(".shield").forEach(function (shield) {
      var label = shield.querySelector("[data-shield-label]");
      shield.setAttribute("data-state", state);
      if (!label) return;
      if (state === "scanning") label.textContent = t("shieldScanning");
      else if (state === "done") label.textContent = t("shieldDone");
      else label.textContent = t("shieldIdle");
    });
    if (state === "done") {
      shieldTimer = global.setTimeout(function () { shieldState("idle"); }, 6000);
    }
  }

  /* ------------------------------- toasts ------------------------------- */
  function toastStack() {
    var el = document.querySelector(".toast-stack");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast-stack";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    return el;
  }

  function toast(message, kind) {
    var el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("data-kind", kind || "info");
    el.textContent = message;
    toastStack().appendChild(el);
    global.setTimeout(function () {
      el.style.opacity = "0";
      global.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
    }, 4200);
  }

  /* ------------------------------ consent ------------------------------- */
  var CONSENT_KEY = "kitbox:consent";

  function gtag() { (global.dataLayer = global.dataLayer || []).push(arguments); }
  global.gtag = global.gtag || gtag;

  function defaultConsent() {
    gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      functionality_storage: "granted",
      security_storage: "granted",
      wait_for_update: 500
    });
  }

  function readConsent() {
    var raw = store.get(CONSENT_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function updateConsent(state) {
    gtag("consent", "update", {
      ad_storage: state.ads ? "granted" : "denied",
      ad_user_data: state.ads ? "granted" : "denied",
      ad_personalization: state.ads ? "granted" : "denied",
      analytics_storage: state.analytics ? "granted" : "denied"
    });
  }

  var adsLoaded = false;
  function loadAdSense() {
    if (adsLoaded) return;
    if (!AD_PUBLISHER_CONFIGURED) return; /* stays a reserved placeholder until configured */
    if (!document.querySelector(".ad-slot ins")) return;
    adsLoaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(CONFIG.ADSENSE_PUBLISHER_ID);
    s.onload = function () {
      document.querySelectorAll(".ad-slot ins.adsbygoogle").forEach(function () {
        try { (global.adsbygoogle = global.adsbygoogle || []).push({}); } catch (e) { /* ad blocked */ }
      });
    };
    s.onerror = function () { adsLoaded = false; };
    document.head.appendChild(s);
  }

  function initConsent() {
    defaultConsent();
    var banner = document.getElementById("consent-banner");
    var saved = readConsent();

    if (saved) {
      updateConsent(saved);
      if (saved.ads) loadAdSense();
    }

    if (!banner) return;

    var prefs = banner.querySelector("[data-consent-prefs]");
    var adsBox = banner.querySelector("#consent-ads");
    var anBox = banner.querySelector("#consent-analytics");

    function show() {
      banner.hidden = false;
      var b = banner.querySelector("button");
      if (b) b.focus();
    }
    function hide() { banner.hidden = true; }

    function save(state) {
      store.set(CONSENT_KEY, JSON.stringify(state));
      updateConsent(state);
      if (state.ads) loadAdSense();
      hide();
    }

    banner.addEventListener("click", function (e) {
      var el = e.target.closest ? e.target.closest("[data-consent]") : null;
      if (!el) return;
      var action = el.getAttribute("data-consent");
      if (action === "accept") save({ ads: true, analytics: true, ts: Date.now() });
      else if (action === "reject") save({ ads: false, analytics: false, ts: Date.now() });
      else if (action === "manage") {
        if (prefs) {
          prefs.hidden = !prefs.hidden;
          el.setAttribute("aria-expanded", prefs.hidden ? "false" : "true");
        }
      } else if (action === "save") {
        save({ ads: !!(adsBox && adsBox.checked), analytics: !!(anBox && anBox.checked), ts: Date.now() });
      }
    });

    banner.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { save({ ads: false, analytics: false, ts: Date.now() }); }
    });

    document.querySelectorAll("[data-cookie-settings]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        var s = readConsent() || { ads: false, analytics: false };
        if (adsBox) adsBox.checked = !!s.ads;
        if (anBox) anBox.checked = !!s.analytics;
        if (prefs) prefs.hidden = false;
        show();
      });
    });

    if (!saved) show();
  }

  /* ------------------------ language suggestion ------------------------- */
  var LANG_SUGGEST_KEY = "kitbox:lang-suggest-dismissed";

  function initLangSuggest() {
    var bar = document.getElementById("lang-suggest");
    if (!bar) return;
    if (store.get(LANG_SUGGEST_KEY) === "1") return;
    var pageLang = i18n.lang();
    var nav = (global.navigator.language || "en").toLowerCase();
    var prefersAr = nav.indexOf("ar") === 0;
    if ((prefersAr && pageLang === "ar") || (!prefersAr && pageLang === "en")) return;
    bar.hidden = false;
    bar.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("[data-dismiss-lang]")) {
        bar.hidden = true;
        store.set(LANG_SUGGEST_KEY, "1");
      }
    });
  }

  /* --------------------------- recent tools ----------------------------- */
  var RECENT_KEY = "kitbox:recent-tools";

  function recordToolVisit(slug) {
    if (!slug) return;
    var list = [];
    try { list = JSON.parse(store.get(RECENT_KEY) || "[]"); } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];
    list = list.filter(function (s) { return s !== slug; });
    list.unshift(slug);
    store.set(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
  }

  function renderRecentTools() {
    var host = document.getElementById("most-used");
    if (!host) return;
    var list = [];
    try { list = JSON.parse(store.get(RECENT_KEY) || "[]"); } catch (e) { list = []; }
    if (!Array.isArray(list) || !list.length) return; /* keep server-rendered defaults */
    var all = Array.prototype.slice.call(document.querySelectorAll("#all-tools .tool-grid > li"));
    if (!all.length) return;
    var picked = [];
    list.forEach(function (slug) {
      all.forEach(function (li) {
        if (li.getAttribute("data-slug") === slug && picked.indexOf(li) === -1) picked.push(li);
      });
    });
    if (picked.length < 3) return;
    var grid = host.querySelector(".tool-grid");
    if (!grid) return;
    grid.innerHTML = "";
    picked.slice(0, 4).forEach(function (li) { grid.appendChild(li.cloneNode(true)); });
  }

  /* ---------------------------- tool search ----------------------------- */
  function initToolSearch() {
    document.querySelectorAll("[data-tool-search]").forEach(function (input) {
      var targetSel = input.getAttribute("data-tool-search");
      var status = document.getElementById(input.getAttribute("aria-describedby") || "");
      function run() {
        var q = input.value.trim().toLowerCase();
        var shown = 0;
        document.querySelectorAll(targetSel).forEach(function (group) {
          var visibleInGroup = 0;
          group.querySelectorAll("li[data-keywords]").forEach(function (li) {
            var hit = !q || li.getAttribute("data-keywords").toLowerCase().indexOf(q) !== -1;
            li.hidden = !hit;
            if (hit) { shown++; visibleInGroup++; }
          });
          var section = group.closest("[data-search-group]");
          if (section) section.hidden = visibleInGroup === 0;
        });
        if (status) {
          status.textContent = i18n.lang() === "ar"
            ? (shown ? shown + " أداة مطابقة" : "لا توجد أدوات مطابقة")
            : (shown ? shown + " matching tool" + (shown === 1 ? "" : "s") : "No matching tools");
        }
      }
      input.addEventListener("input", run);
      run();
    });
  }

  /* --------------------------- script loader ---------------------------- */
  var loaded = {};
  function loadScript(url) {
    if (loaded[url]) return loaded[url];
    loaded[url] = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = url;
      s.defer = true;
      s.crossOrigin = "anonymous";
      s.onload = function () { resolve(); };
      s.onerror = function () { loaded[url] = null; reject(new Error("load-failed")); };
      document.head.appendChild(s);
    });
    return loaded[url];
  }

  function needLib(name) {
    var map = {
      "pdf-lib": { url: CONFIG.CDN.pdfLib, check: function () { return global.PDFLib; } },
      "jszip": { url: CONFIG.CDN.jszip, check: function () { return global.JSZip; } },
      "qrcode": { url: CONFIG.CDN.qrcode, check: function () { return global.qrcode; } }
    };
    var spec = map[name];
    if (!spec) return Promise.reject(new Error("unknown-lib"));
    if (spec.check()) return Promise.resolve(spec.check());
    return loadScript(spec.url).then(function () {
      if (!spec.check()) throw new Error("load-failed");
      return spec.check();
    });
  }

  /* ----------------------------- utilities ------------------------------ */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") node.className = attrs[k];
      else if (k === "text") node.textContent = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  var urls = [];
  function objectURL(blob) {
    var u = URL.createObjectURL(blob);
    urls.push(u);
    return u;
  }
  function revokeAll() {
    urls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) { /* already gone */ } });
    urls = [];
  }
  global.addEventListener("pagehide", revokeAll);

  function downloadBlob(blob, filename) {
    var u = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = u;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    global.setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }

  function copyText(text) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "readonly");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
    if (global.navigator.clipboard && global.isSecureContext) {
      return global.navigator.clipboard.writeText(text).then(function () {
        toast(t("copied"), "success"); return true;
      }).catch(function () {
        if (fallback()) { toast(t("copied"), "success"); return true; }
        toast(t("copyFailed"), "error"); return false;
      });
    }
    if (fallback()) { toast(t("copied"), "success"); return Promise.resolve(true); }
    toast(t("copyFailed"), "error");
    return Promise.resolve(false);
  }

  function setStatus(node, message, kind) {
    if (!node) return;
    node.textContent = message || "";
    if (kind) node.setAttribute("data-kind", kind);
    else node.removeAttribute("data-kind");
  }

  function sanitizeName(name, ext) {
    var base = String(name || "file").replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]+/g, "-").slice(0, 80) || "file";
    return ext ? base + "." + ext : base;
  }

  /* Drag/drop + click + paste wiring for a dropzone. */
  function wireDropzone(opts) {
    var zone = opts.zone, input = opts.input, onFiles = opts.onFiles;
    if (!zone || !input) return;

    input.addEventListener("change", function () {
      if (input.files && input.files.length) onFiles(Array.prototype.slice.call(input.files));
      input.value = "";
    });

    zone.addEventListener("click", function (e) {
      if (e.target !== input) input.click();
    });
    zone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); }
    });

    ["dragenter", "dragover"].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault();
        zone.setAttribute("data-drag", "true");
      });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault();
        if (ev === "dragleave" && zone.contains(e.relatedTarget)) return;
        zone.removeAttribute("data-drag");
      });
    });
    zone.addEventListener("drop", function (e) {
      e.preventDefault();
      var files = e.dataTransfer && e.dataTransfer.files ? Array.prototype.slice.call(e.dataTransfer.files) : [];
      if (files.length) onFiles(files);
    });

    if (opts.paste) {
      document.addEventListener("paste", function (e) {
        if (!e.clipboardData) return;
        var items = Array.prototype.slice.call(e.clipboardData.files || []);
        if (items.length) { onFiles(items); toast(t("pastedImage"), "success"); }
      });
    }
  }

  /* Decode an image file honouring EXIF orientation (createImageBitmap does
     this natively with imageOrientation: "from-image"). */
  function decodeImage(file) {
    if (global.createImageBitmap) {
      try {
        return global.createImageBitmap(file, { imageOrientation: "from-image" })
          .catch(function () { return decodeViaElement(file); });
      } catch (e) { /* older signature */ }
      return global.createImageBitmap(file).catch(function () { return decodeViaElement(file); });
    }
    return decodeViaElement(file);
  }

  function decodeViaElement(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("decode-failed")); };
      img.src = url;
    });
  }

  function makeCanvas(w, h) {
    if (global.OffscreenCanvas) {
      try { return new OffscreenCanvas(w, h); } catch (e) { /* fall through */ }
    }
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    return c;
  }

  function canvasToBlob(canvas, type, quality) {
    if (canvas.convertToBlob) return canvas.convertToBlob({ type: type, quality: quality });
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error("encode-failed")); }, type, quality);
    });
  }

  function nextFrame() {
    return new Promise(function (r) {
      if (global.requestAnimationFrame) global.requestAnimationFrame(function () { r(); });
      else global.setTimeout(r, 0);
    });
  }

  function randomInt(maxExclusive) {
    if (maxExclusive <= 0) return 0;
    var limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
    var buf = new Uint32Array(1);
    var v;
    do { global.crypto.getRandomValues(buf); v = buf[0]; } while (v >= limit);
    return v % maxExclusive;
  }

  /* ------------------------------ ad slots ------------------------------ */
  function initAdSlots() {
    if (AD_PUBLISHER_CONFIGURED) return;
    document.querySelectorAll(".ad-slot").forEach(function (slot) {
      slot.setAttribute("data-unconfigured", "true");
    });
  }

  /* -------------------------------- boot -------------------------------- */
  function boot() {
    initTheme();
    initMenu();
    initShield();
    initConsent();
    initLangSuggest();
    initToolSearch();
    initAdSlots();
    renderRecentTools();

    var slug = document.body.getAttribute("data-tool");
    if (slug) recordToolVisit(slug);

    var year = new Date().getFullYear();
    document.querySelectorAll("[data-year]").forEach(function (n) { n.textContent = i18n.num(year, { useGrouping: false }); });

    document.querySelectorAll("[data-contact-email]").forEach(function (n) {
      if (n.tagName === "A") n.setAttribute("href", "mailto:" + CONFIG.CONTACT_EMAIL);
      n.textContent = CONFIG.CONTACT_EMAIL;
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  /* ------------------------------- export ------------------------------- */
  global.Kitbox = {
    CONFIG: CONFIG,
    store: store,
    t: t,
    i18n: i18n,
    isRTL: isRTL,
    toast: toast,
    shieldState: shieldState,
    needLib: needLib,
    el: el,
    objectURL: objectURL,
    revokeAll: revokeAll,
    downloadBlob: downloadBlob,
    copyText: copyText,
    setStatus: setStatus,
    sanitizeName: sanitizeName,
    wireDropzone: wireDropzone,
    decodeImage: decodeImage,
    makeCanvas: makeCanvas,
    canvasToBlob: canvasToBlob,
    nextFrame: nextFrame,
    randomInt: randomInt
  };
})(window);
