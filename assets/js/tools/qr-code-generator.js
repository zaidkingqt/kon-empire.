/* Kitbox — QR Code Generator (qrcode-generator 1.4.4). 100% client-side. */
(function () {
  "use strict";
  var K = window.Kitbox, I = window.KitboxI18n;
  var t = K.t;

  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('[role="tabpanel"]'));
  var status = document.getElementById("tool-status");
  var previewBox = document.getElementById("qr-preview");
  var fg = document.getElementById("fg-color");
  var bg = document.getElementById("bg-color");
  var sizeIn = document.getElementById("qr-size");
  var sizeOut = document.getElementById("qr-size-out");
  var ecLevel = document.getElementById("ec-level");
  var marginIn = document.getElementById("qr-margin");
  var marginOut = document.getElementById("qr-margin-out");
  var pngBtn = document.getElementById("download-png");
  var svgBtn = document.getElementById("download-svg");
  var copyBtn = document.getElementById("copy-text");
  var resetBtn = document.getElementById("reset");

  var lastSVG = "";
  var lastCanvas = null;
  var lastPayload = "";

  function esc(s) { return String(s).replace(/([\\;,:"])/g, "\\$1"); }

  function payload() {
    var active = tabs.filter(function (x) { return x.getAttribute("aria-selected") === "true"; })[0];
    var kind = active ? active.getAttribute("data-tab") : "text";
    if (kind === "text") {
      return { value: document.getElementById("qr-text").value.trim(), error: null };
    }
    if (kind === "wifi") {
      var ssid = document.getElementById("wifi-ssid").value.trim();
      if (!ssid) return { value: "", error: t("ssidRequired") };
      var enc = document.getElementById("wifi-enc").value;
      var pass = document.getElementById("wifi-pass").value;
      var hidden = document.getElementById("wifi-hidden").checked;
      return { value: "WIFI:T:" + enc + ";S:" + esc(ssid) + ";" + (enc === "nopass" ? "" : "P:" + esc(pass) + ";") + (hidden ? "H:true;" : "") + ";", error: null };
    }
    if (kind === "vcard") {
      var first = document.getElementById("vc-first").value.trim();
      var last = document.getElementById("vc-last").value.trim();
      var org = document.getElementById("vc-org").value.trim();
      var title = document.getElementById("vc-title").value.trim();
      var phone = document.getElementById("vc-phone").value.trim();
      var mail = document.getElementById("vc-email").value.trim();
      var url = document.getElementById("vc-url").value.trim();
      if (!first && !last && !org && !phone && !mail) return { value: "", error: null };
      var lines = ["BEGIN:VCARD", "VERSION:3.0", "N:" + last + ";" + first + ";;;", "FN:" + (first + " " + last).trim()];
      if (org) lines.push("ORG:" + org);
      if (title) lines.push("TITLE:" + title);
      if (phone) lines.push("TEL;TYPE=CELL:" + phone);
      if (mail) lines.push("EMAIL:" + mail);
      if (url) lines.push("URL:" + url);
      lines.push("END:VCARD");
      return { value: lines.join("\n"), error: null };
    }
    var to = document.getElementById("em-to").value.trim();
    var subj = document.getElementById("em-subject").value.trim();
    var body = document.getElementById("em-body").value.trim();
    if (!to) return { value: "", error: null };
    var q = [];
    if (subj) q.push("subject=" + encodeURIComponent(subj));
    if (body) q.push("body=" + encodeURIComponent(body));
    return { value: "mailto:" + to + (q.length ? "?" + q.join("&") : ""), error: null };
  }

  function buildMatrix(text, level) {
    var qr = window.qrcode(0, level);
    qr.addData(text);
    qr.make();
    return qr;
  }

  function draw() {
    var p = payload();
    if (p.error) { K.setStatus(status, p.error, "error"); return; }
    if (!p.value) {
      previewBox.innerHTML = "";
      previewBox.appendChild(K.el("p", { class: "muted", text: t("qrEmpty") }));
      pngBtn.disabled = svgBtn.disabled = copyBtn.disabled = true;
      lastSVG = ""; lastCanvas = null; lastPayload = "";
      return;
    }
    K.needLib("qrcode").then(function () {
      var qr;
      try { qr = buildMatrix(p.value, ecLevel.value); }
      catch (e) { K.setStatus(status, t("qrTooLong"), "error"); return; }

      var count = qr.getModuleCount();
      var quiet = parseInt(marginIn.value, 10);
      var px = parseInt(sizeIn.value, 10);
      var total = count + quiet * 2;
      var cell = Math.max(1, Math.floor(px / total));
      var dim = cell * total;

      var canvas = document.createElement("canvas");
      canvas.width = dim; canvas.height = dim;
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", I.lang() === "ar" ? "معاينة رمز QR" : "QR code preview");
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = bg.value;
      ctx.fillRect(0, 0, dim, dim);
      ctx.fillStyle = fg.value;
      var rects = [];
      for (var r = 0; r < count; r++) {
        for (var c = 0; c < count; c++) {
          if (qr.isDark(r, c)) {
            var x = (c + quiet) * cell, y = (r + quiet) * cell;
            ctx.fillRect(x, y, cell, cell);
            rects.push('<rect x="' + x + '" y="' + y + '" width="' + cell + '" height="' + cell + '"/>');
          }
        }
      }
      lastCanvas = canvas;
      lastSVG = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="' + dim + '" height="' + dim + '" viewBox="0 0 ' + dim + ' ' + dim + '" shape-rendering="crispEdges">' +
        '<rect width="' + dim + '" height="' + dim + '" fill="' + bg.value + '"/>' +
        '<g fill="' + fg.value + '">' + rects.join("") + "</g></svg>";
      lastPayload = p.value;

      previewBox.innerHTML = "";
      previewBox.appendChild(canvas);
      pngBtn.disabled = svgBtn.disabled = copyBtn.disabled = false;
      K.setStatus(status, t("qrReady"), "success");
    }).catch(function () {
      K.setStatus(status, t("libraryFailed"), "error");
    });
  }

  function selectTab(tab) {
    tabs.forEach(function (x) {
      var on = x === tab;
      x.setAttribute("aria-selected", on ? "true" : "false");
      x.setAttribute("tabindex", on ? "0" : "-1");
    });
    panels.forEach(function (p) {
      p.hidden = p.getAttribute("aria-labelledby") !== tab.id;
    });
    draw();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === "Home") next = tabs[0];
      else if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); next.focus(); selectTab(next); }
    });
  });

  document.querySelectorAll('[role="tabpanel"] input, [role="tabpanel"] select, [role="tabpanel"] textarea').forEach(function (f) {
    f.addEventListener("input", draw);
    f.addEventListener("change", draw);
  });

  [fg, bg, ecLevel].forEach(function (f) { f.addEventListener("input", draw); f.addEventListener("change", draw); });
  sizeIn.addEventListener("input", function () { sizeOut.textContent = I.num(sizeIn.value) + " px"; draw(); });
  marginIn.addEventListener("input", function () { marginOut.textContent = I.num(marginIn.value); draw(); });
  sizeOut.textContent = I.num(sizeIn.value) + " px";
  marginOut.textContent = I.num(marginIn.value);

  pngBtn.addEventListener("click", function () {
    if (!lastCanvas) return;
    lastCanvas.toBlob(function (b) { if (b) K.downloadBlob(b, "kitbox-qr-code.png"); }, "image/png");
  });
  svgBtn.addEventListener("click", function () {
    if (!lastSVG) return;
    K.downloadBlob(new Blob([lastSVG], { type: "image/svg+xml" }), "kitbox-qr-code.svg");
  });
  copyBtn.addEventListener("click", function () { if (lastPayload) K.copyText(lastPayload); });
  resetBtn.addEventListener("click", function () {
    document.querySelectorAll('[role="tabpanel"] input[type="text"], [role="tabpanel"] input[type="url"], [role="tabpanel"] input[type="email"], [role="tabpanel"] input[type="password"], [role="tabpanel"] textarea').forEach(function (f) { f.value = ""; });
    document.getElementById("wifi-hidden").checked = false;
    draw();
    K.setStatus(status, t("cleared"));
  });

  pngBtn.disabled = svgBtn.disabled = copyBtn.disabled = true;
  draw();
})();
