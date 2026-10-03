/* Kitbox — Word Counter. Live stats, Arabic-aware. 100% client-side. */
(function () {
  "use strict";
  var K = window.Kitbox, I = window.KitboxI18n;
  var t = K.t;
  var ar = I.lang() === "ar";

  var ta = document.getElementById("text-input");
  var status = document.getElementById("tool-status");
  var clearBtn = document.getElementById("reset");
  var copyBtn = document.getElementById("copy");
  var densityBody = document.getElementById("density-body");
  var densityNote = document.getElementById("density-note");

  var fields = {
    words: document.getElementById("s-words"),
    chars: document.getElementById("s-chars"),
    charsNoSpaces: document.getElementById("s-chars-nospace"),
    sentences: document.getElementById("s-sentences"),
    paragraphs: document.getElementById("s-paragraphs"),
    reading: document.getElementById("s-reading"),
    speaking: document.getElementById("s-speaking")
  };

  /* Letters: Latin + Arabic ranges, digits, apostrophes and Arabic tatweel. */
  var WORD_RE = /[0-9A-Za-z\u00C0-\u024F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF'’_-]+/g;
  var STOP_EN = " the a an and or of to in for on with is are was were be been it its this that as at by from not but if then than so we you they he she i ".split(" ");
  var STOP_AR = " في من على عن إلى أن إن هذا هذه ذلك التي الذي ما لا و أو ثم كما قد كان كانت مع هو هي هم كل بعد قبل عند حتى لكن بين ".split(" ");

  function minutesLabel(mins) {
    if (mins < 1) {
      var secs = Math.max(1, Math.round(mins * 60));
      return I.num(secs) + " " + t("secondsShort");
    }
    return I.num(Math.round(mins)) + " " + t("minutesShort");
  }

  function compute() {
    var text = ta.value;
    var trimmed = text.trim();
    var words = trimmed ? (trimmed.match(WORD_RE) || []) : [];
    var chars = Array.from(text).length;
    var charsNoSpaces = Array.from(text.replace(/\s/g, "")).length;
    var sentences = trimmed ? (trimmed.split(/[.!?؟…]+[\s\u00A0]*|\n+/).filter(function (s) { return s.trim().length; }).length) : 0;
    var paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter(function (p) { return p.trim().length; }).length : 0;

    fields.words.textContent = I.num(words.length);
    fields.chars.textContent = I.num(chars);
    fields.charsNoSpaces.textContent = I.num(charsNoSpaces);
    fields.sentences.textContent = I.num(sentences);
    fields.paragraphs.textContent = I.num(paragraphs);
    fields.reading.textContent = minutesLabel(words.length / 225);
    fields.speaking.textContent = minutesLabel(words.length / 140);

    renderDensity(words);
    copyBtn.disabled = !trimmed;
    clearBtn.disabled = !text.length;
  }

  function renderDensity(words) {
    densityBody.innerHTML = "";
    if (words.length < 10) {
      densityNote.hidden = false;
      return;
    }
    densityNote.hidden = true;
    var counts = Object.create(null);
    words.forEach(function (w) {
      var k = w.toLowerCase();
      if (k.length < 3) return;
      if (STOP_EN.indexOf(k) > -1 || STOP_AR.indexOf(k) > -1) return;
      counts[k] = (counts[k] || 0) + 1;
    });
    var rows = Object.keys(counts).map(function (k) { return [k, counts[k]]; })
      .sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); })
      .slice(0, 10);
    if (!rows.length) { densityNote.hidden = false; return; }
    rows.forEach(function (r) {
      var tr = document.createElement("tr");
      var td1 = document.createElement("td"); td1.textContent = r[0];
      var td2 = document.createElement("td"); td2.textContent = I.num(r[1]);
      var td3 = document.createElement("td"); td3.textContent = I.percent((r[1] / words.length) * 100) + "%";
      tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
      densityBody.appendChild(tr);
    });
  }

  ta.addEventListener("input", compute);
  clearBtn.addEventListener("click", function () {
    ta.value = "";
    compute();
    ta.focus();
    K.setStatus(status, t("cleared"));
  });
  copyBtn.addEventListener("click", function () {
    if (!ta.value.trim()) { K.setStatus(status, t("emptyText"), "error"); return; }
    K.copyText(ta.value);
  });

  compute();
  K.setStatus(status, ar ? "يتم تحليل النص داخل متصفحك فقط." : "Your text is analysed inside your browser only.");
})();
