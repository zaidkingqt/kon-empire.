/* Kitbox — Case Converter. 100% client-side. */
(function () {
  "use strict";
  var K = window.Kitbox, I = window.KitboxI18n;
  var t = K.t;
  var ar = I.lang() === "ar";

  var ta = document.getElementById("text-input");
  var status = document.getElementById("tool-status");
  var copyBtn = document.getElementById("copy");
  var dlBtn = document.getElementById("download-txt");
  var resetBtn = document.getElementById("reset");
  var undoBtn = document.getElementById("undo");
  var counter = document.getElementById("char-count");

  var history = [];

  var SMALL = ["a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "per", "the", "to", "via", "vs"];

  function words(s) { return s.split(/(\s+)/); }

  var MODES = {
    upper: function (s) { return s.toUpperCase(); },
    lower: function (s) { return s.toLowerCase(); },
    title: function (s) {
      return words(s).map(function (w, i) {
        if (/^\s+$/.test(w) || !w) return w;
        var low = w.toLowerCase();
        if (i !== 0 && SMALL.indexOf(low.replace(/[^a-z]/g, "")) > -1) return low;
        return low.charAt(0).toUpperCase() + low.slice(1);
      }).join("");
    },
    sentence: function (s) {
      var lower = s.toLowerCase();
      return lower.replace(/(^\s*|[.!?؟]\s+|\n\s*)([^\s])/g, function (m, pre, ch) { return pre + ch.toUpperCase(); });
    },
    camel: function (s) {
      var parts = tokens(s);
      return parts.map(function (w, i) {
        return i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      }).join("");
    },
    pascal: function (s) {
      return tokens(s).map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }).join("");
    },
    snake: function (s) { return tokens(s).map(function (w) { return w.toLowerCase(); }).join("_"); },
    kebab: function (s) { return tokens(s).map(function (w) { return w.toLowerCase(); }).join("-"); },
    alternating: function (s) {
      var i = 0;
      return Array.from(s).map(function (ch) {
        if (!/\S/.test(ch)) return ch;
        var r = i % 2 === 0 ? ch.toLowerCase() : ch.toUpperCase();
        i++;
        return r;
      }).join("");
    }
  };

  function tokens(s) {
    return s
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .split(/[^0-9A-Za-z\u0600-\u06FF]+/)
      .filter(Boolean);
  }

  function apply(mode) {
    if (!ta.value.trim()) { K.setStatus(status, t("emptyText"), "error"); return; }
    var fn = MODES[mode];
    if (!fn) return;
    history.push(ta.value);
    if (history.length > 30) history.shift();
    ta.value = fn(ta.value);
    undoBtn.disabled = false;
    update();
    K.setStatus(status, t("textConverted"), "success");
  }

  function update() {
    var len = Array.from(ta.value).length;
    counter.textContent = (ar ? "عدد الأحرف: " : "Characters: ") + I.num(len);
    copyBtn.disabled = dlBtn.disabled = !ta.value.length;
    resetBtn.disabled = !ta.value.length;
  }

  document.querySelectorAll("[data-case]").forEach(function (btn) {
    btn.addEventListener("click", function () { apply(btn.getAttribute("data-case")); });
  });

  ta.addEventListener("input", update);
  copyBtn.addEventListener("click", function () { if (ta.value) K.copyText(ta.value); });
  dlBtn.addEventListener("click", function () {
    if (!ta.value) return;
    K.downloadBlob(new Blob([ta.value], { type: "text/plain;charset=utf-8" }), "kitbox-text.txt");
  });
  undoBtn.addEventListener("click", function () {
    if (!history.length) return;
    ta.value = history.pop();
    undoBtn.disabled = !history.length;
    update();
  });
  resetBtn.addEventListener("click", function () {
    history = [];
    ta.value = "";
    undoBtn.disabled = true;
    update();
    ta.focus();
    K.setStatus(status, t("cleared"));
  });

  undoBtn.disabled = true;
  update();
})();
