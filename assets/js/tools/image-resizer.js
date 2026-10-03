/* Kitbox — Image Resizer. 100% client-side. */
(function () {
  "use strict";
  var K = window.Kitbox, I = window.KitboxI18n;
  var t = K.t;
  var ar = I.lang() === "ar";

  var zone = document.getElementById("dropzone");
  var input = document.getElementById("file-input");
  var list = document.getElementById("file-list");
  var status = document.getElementById("tool-status");
  var modeRadios = document.querySelectorAll('input[name="mode"]');
  var pxFields = document.getElementById("px-fields");
  var pctFields = document.getElementById("pct-fields");
  var wIn = document.getElementById("out-width");
  var hIn = document.getElementById("out-height");
  var lock = document.getElementById("lock-ratio");
  var pct = document.getElementById("scale-percent");
  var pctOut = document.getElementById("scale-percent-out");
  var presetSel = document.getElementById("preset");
  var formatSel = document.getElementById("out-format");
  var quality = document.getElementById("quality");
  var qualityOut = document.getElementById("quality-out");
  var runBtn = document.getElementById("run");
  var zipBtn = document.getElementById("download-zip");
  var resetBtn = document.getElementById("reset");
  var progress = document.getElementById("progress");
  var bar = progress.firstElementChild;
  var ACCEPT = ["image/jpeg", "image/png", "image/webp"];

  var PRESETS = {
    "instagram-post": [1080, 1080],
    "instagram-story": [1080, 1920],
    "youtube-thumbnail": [1280, 720],
    "facebook-cover": [820, 312],
    "passport": [413, 531],
    "favicon": [512, 512]
  };

  var items = [];
  var ratio = 1;
  var busy = false;

  function mode() {
    var m = "pixels";
    modeRadios.forEach(function (r) { if (r.checked) m = r.value; });
    return m;
  }

  function syncMode() {
    var m = mode();
    pxFields.hidden = m !== "pixels";
    pctFields.hidden = m !== "percent";
  }

  function render() {
    list.innerHTML = "";
    items.forEach(function (it, idx) {
      var row = K.el("li", { class: "file-row" });
      row.appendChild(K.el("img", { src: it.thumb, alt: "", width: "52", height: "52", loading: "lazy" }));
      var meta = K.el("div", { class: "file-meta" });
      meta.appendChild(K.el("span", { class: "name", text: it.file.name }));
      var sub = it.outBlob
        ? I.num(it.w) + " × " + I.num(it.h) + " · " + I.bytes(it.outBlob.size)
        : I.num(it.srcW) + " × " + I.num(it.srcH) + " · " + I.bytes(it.file.size);
      meta.appendChild(K.el("span", { class: "sub", text: sub }));
      row.appendChild(meta);
      var actions = K.el("div", { class: "row-actions" });
      if (it.outBlob) {
        var dl = K.el("button", { type: "button", class: "icon-btn", "aria-label": t("download") + ": " + it.file.name, title: t("download") });
        dl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/></svg>';
        dl.addEventListener("click", function () { K.downloadBlob(it.outBlob, it.outName); });
        actions.appendChild(dl);
      }
      var rm = K.el("button", { type: "button", class: "icon-btn", "aria-label": t("removeFile") + ": " + it.file.name, title: t("removeFile") });
      rm.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      rm.addEventListener("click", function () { removeAt(idx); });
      actions.appendChild(rm);
      row.appendChild(actions);
      list.appendChild(row);
    });
    runBtn.disabled = !items.length || busy;
    resetBtn.disabled = !items.length || busy;
    zipBtn.hidden = items.filter(function (i) { return i.outBlob; }).length < 2;
  }

  function removeAt(i) {
    var it = items[i];
    if (it) {
      try { URL.revokeObjectURL(it.thumb); } catch (e) { /* noop */ }
      try { if (it.outURL) URL.revokeObjectURL(it.outURL); } catch (e) { /* noop */ }
    }
    items.splice(i, 1);
    render();
  }

  function addFiles(files) {
    var dupes = 0, added = 0;
    var jobs = [];
    files.forEach(function (f) {
      if (ACCEPT.indexOf(f.type) === -1) { K.toast(t("unsupported", { name: f.name }), "warning"); return; }
      if (f.size > K.CONFIG.MAX_FILE_BYTES) { K.toast(t("tooLarge", { name: f.name, limit: I.bytes(K.CONFIG.MAX_FILE_BYTES) }), "warning"); return; }
      if (items.some(function (i) { return i.file.name === f.name && i.file.size === f.size; })) { dupes++; return; }
      added++;
      var item = { file: f, thumb: URL.createObjectURL(f), srcW: 0, srcH: 0, outBlob: null, outURL: null, outName: "", w: 0, h: 0 };
      items.push(item);
      jobs.push(K.decodeImage(f).then(function (bmp) {
        item.srcW = bmp.width; item.srcH = bmp.height;
        if (bmp.close) bmp.close();
      }).catch(function () { /* dimensions stay 0 */ }));
    });
    if (dupes) K.toast(t("duplicateSkipped", { n: I.num(dupes) }), "warning");
    if (added) K.setStatus(status, t("filesAdded", { n: I.num(added) }), "success");
    render();
    Promise.all(jobs).then(function () {
      if (items.length && items[0].srcW) {
        ratio = items[0].srcW / items[0].srcH;
        if (!wIn.value && !hIn.value) { wIn.value = items[0].srcW; hIn.value = items[0].srcH; }
      }
      render();
    });
  }

  function computeSize(srcW, srcH) {
    var m = mode();
    if (m === "percent") {
      var s = parseInt(pct.value, 10) / 100;
      return [Math.max(1, Math.round(srcW * s)), Math.max(1, Math.round(srcH * s))];
    }
    var w = parseInt(wIn.value, 10);
    var h = parseInt(hIn.value, 10);
    var hasW = isFinite(w) && w > 0;
    var hasH = isFinite(h) && h > 0;
    if (!hasW && !hasH) return null;
    if (lock.checked) {
      var r = srcW / srcH;
      if (hasW && !hasH) return [w, Math.max(1, Math.round(w / r))];
      if (hasH && !hasW) return [Math.max(1, Math.round(h * r)), h];
      var byW = [w, Math.max(1, Math.round(w / r))];
      return byW[1] <= h ? byW : [Math.max(1, Math.round(h * r)), h];
    }
    return [hasW ? w : srcW, hasH ? h : srcH];
  }

  async function run() {
    if (!items.length) { K.setStatus(status, t("noFiles"), "error"); return; }
    var probe = computeSize(1000, 1000);
    if (!probe) { K.setStatus(status, t("invalidDimensions"), "error"); return; }
    busy = true; runBtn.disabled = true; progress.hidden = false;
    K.shieldState("scanning");
    var fmt = formatSel.value;
    var q = parseInt(quality.value, 10) / 100;

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      K.setStatus(status, t("processing", { i: I.num(i + 1), n: I.num(items.length) }));
      bar.style.width = Math.round((i / items.length) * 100) + "%";
      await K.nextFrame();
      try {
        var bmp = await K.decodeImage(it.file);
        it.srcW = bmp.width; it.srcH = bmp.height;
        var size = computeSize(bmp.width, bmp.height);
        var canvas = K.makeCanvas(size[0], size[1]);
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        if (fmt === "image/jpeg") { ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, size[0], size[1]); }
        ctx.drawImage(bmp, 0, 0, size[0], size[1]);
        if (bmp.close) bmp.close();
        var blob = await K.canvasToBlob(canvas, fmt, q);
        if (it.outURL) { try { URL.revokeObjectURL(it.outURL); } catch (e) { /* noop */ } }
        it.outBlob = blob;
        it.outURL = URL.createObjectURL(blob);
        it.w = size[0]; it.h = size[1];
        it.outName = K.sanitizeName(it.file.name) + "-" + size[0] + "x" + size[1] + "." + fmt.split("/")[1].replace("jpeg", "jpg");
      } catch (e) {
        K.toast(t("readError", { name: it.file.name }), "error");
      }
    }
    bar.style.width = "0%";
    progress.hidden = true;
    busy = false;
    render();
    K.setStatus(status, t("resizedCount", { n: I.num(items.filter(function (x) { return x.outBlob; }).length) }) + " " + t("processedOnDevice"), "success");
    K.shieldState("done");
  }

  modeRadios.forEach(function (r) { r.addEventListener("change", syncMode); });
  syncMode();

  wIn.addEventListener("input", function () {
    if (lock.checked && items.length && items[0].srcH) {
      var w = parseInt(wIn.value, 10);
      if (isFinite(w) && w > 0) hIn.value = Math.max(1, Math.round(w / (items[0].srcW / items[0].srcH)));
    }
    presetSel.value = "";
  });
  hIn.addEventListener("input", function () {
    if (lock.checked && items.length && items[0].srcW) {
      var h = parseInt(hIn.value, 10);
      if (isFinite(h) && h > 0) wIn.value = Math.max(1, Math.round(h * (items[0].srcW / items[0].srcH)));
    }
    presetSel.value = "";
  });

  presetSel.addEventListener("change", function () {
    var p = PRESETS[presetSel.value];
    if (!p) return;
    modeRadios.forEach(function (r) { r.checked = r.value === "pixels"; });
    syncMode();
    lock.checked = false;
    wIn.value = p[0]; hIn.value = p[1];
    K.setStatus(status, (ar ? "تم تطبيق المقاس: " : "Preset applied: ") + I.num(p[0]) + " × " + I.num(p[1]));
  });

  pct.addEventListener("input", function () { pctOut.textContent = I.num(pct.value) + "%"; });
  pctOut.textContent = I.num(pct.value) + "%";
  quality.addEventListener("input", function () { qualityOut.textContent = I.num(quality.value) + "%"; });
  qualityOut.textContent = I.num(quality.value) + "%";

  runBtn.addEventListener("click", run);
  resetBtn.addEventListener("click", function () {
    items.forEach(function (it) {
      try { URL.revokeObjectURL(it.thumb); } catch (e) { /* noop */ }
      try { if (it.outURL) URL.revokeObjectURL(it.outURL); } catch (e) { /* noop */ }
    });
    items = [];
    render();
    K.setStatus(status, t("cleared"));
    K.shieldState("idle");
  });
  zipBtn.addEventListener("click", function () {
    var done = items.filter(function (i) { return i.outBlob; });
    if (!done.length) return;
    zipBtn.disabled = true;
    K.needLib("jszip").then(function (JSZip) {
      var zip = new JSZip();
      done.forEach(function (it) { zip.file(it.outName, it.outBlob); });
      return zip.generateAsync({ type: "blob" });
    }).then(function (b) { K.downloadBlob(b, "kitbox-resized-images.zip"); zipBtn.disabled = false; })
      .catch(function () { K.setStatus(status, t("libraryFailed"), "error"); zipBtn.disabled = false; });
  });

  K.wireDropzone({ zone: zone, input: input, onFiles: addFiles, paste: true });
  render();
})();
