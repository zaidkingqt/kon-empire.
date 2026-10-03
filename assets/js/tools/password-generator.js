/* Kitbox — Password Generator. Uses crypto.getRandomValues() only. */
(function () {
  "use strict";
  var K = window.Kitbox, I = window.KitboxI18n;
  var t = K.t;
  var ar = I.lang() === "ar";

  var out = document.getElementById("password-out");
  var status = document.getElementById("tool-status");
  var modeRadios = document.querySelectorAll('input[name="pw-mode"]');
  var charFields = document.getElementById("char-fields");
  var phraseFields = document.getElementById("phrase-fields");
  var lenIn = document.getElementById("pw-length");
  var lenOut = document.getElementById("pw-length-out");
  var cUpper = document.getElementById("c-upper");
  var cLower = document.getElementById("c-lower");
  var cNumber = document.getElementById("c-number");
  var cSymbol = document.getElementById("c-symbol");
  var cAmbiguous = document.getElementById("c-ambiguous");
  var wordsIn = document.getElementById("pw-words");
  var wordsOut = document.getElementById("pw-words-out");
  var sepIn = document.getElementById("pw-separator");
  var capWords = document.getElementById("pw-capitalize");
  var numWord = document.getElementById("pw-number-word");
  var genBtn = document.getElementById("generate");
  var copyBtn = document.getElementById("copy");
  var meter = document.getElementById("strength-meter").firstElementChild;
  var strengthLabel = document.getElementById("strength-label");
  var entropyLabel = document.getElementById("entropy-label");

  var UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var LOWER = "abcdefghijklmnopqrstuvwxyz";
  var NUMS = "0123456789";
  var SYMS = "!@#$%^&*()-_=+[]{};:,.?/";
  var AMBIG = "O0oIl1|`'\"{}[]();:,.";

  /* Embedded word list (192 short, common, unambiguous English words). */
  var WORDS = ("able acid acre actor adapt adopt agent agree album alert alien alloy alpha amber amuse angle ankle apple april arena armor arrow asset atlas audio audit avoid awake award bacon badge baker balance balloon banana banjo barrel basil basket beach beacon beaver bench berry bishop bison blade blanket blossom board bonus border bottle boulder branch brave bread breeze bridge bright bronze brush bubble bucket buffalo builder bundle butter cabin cable cactus camera candle canvas canyon carbon cargo carpet carrot castle cedar cellar census chair chalk charm cheese cherry chess chimney cider cinema circle citrus clever cliff clock cloud clover cobalt cocoa coffee column comet compass copper coral cotton cousin coyote crane crater crayon cricket crystal cubic curtain cymbal dagger dairy dancer dapper dawn debate decade decoy delta dense desert diamond diary digital dinner dolphin domain donkey double dragon drawer dream drift drum eagle earth echo eclipse edible effort elastic elbow elder electric elegant ember emerald empire energy engine enjoy envelope equal escape estate ethics event evolve exact exhibit expand expert fabric falcon fancy fern fiber fiddle field figure filter finch fjord flame flask fleet flint floral flute focus forest forge fossil fountain fox fragile frame fresh frost fuel future gadget galaxy garden garlic gather gentle geyser ginger glacier glide globe golden granite grape gravel green grove guitar")
    .split(/\s+/).filter(Boolean);

  function mode() {
    var m = "chars";
    modeRadios.forEach(function (r) { if (r.checked) m = r.value; });
    return m;
  }

  function syncMode() {
    var m = mode();
    charFields.hidden = m !== "chars";
    phraseFields.hidden = m !== "phrase";
  }

  function pool() {
    var p = "";
    if (cUpper.checked) p += UPPER;
    if (cLower.checked) p += LOWER;
    if (cNumber.checked) p += NUMS;
    if (cSymbol.checked) p += SYMS;
    if (cAmbiguous.checked) {
      p = p.split("").filter(function (ch) { return AMBIG.indexOf(ch) === -1; }).join("");
    }
    return p;
  }

  function strengthFor(bits) {
    if (bits < 40) return ["strengthVeryWeak", 18, "var(--error)"];
    if (bits < 60) return ["strengthWeak", 38, "var(--error)"];
    if (bits < 80) return ["strengthFair", 60, "var(--warning)"];
    if (bits < 110) return ["strengthStrong", 82, "var(--success)"];
    return ["strengthVeryStrong", 100, "var(--success)"];
  }

  function show(value, bits) {
    out.textContent = value;
    out.setAttribute("data-value", value);
    copyBtn.disabled = !value;
    var s = strengthFor(bits);
    meter.style.width = s[1] + "%";
    meter.style.background = s[2];
    strengthLabel.textContent = t(s[0]);
    entropyLabel.textContent = t("entropyBits", { n: I.num(Math.round(bits)) });
  }

  function generateChars() {
    var p = pool();
    if (!p.length) { K.setStatus(status, t("noCharsets"), "error"); return; }
    var len = parseInt(lenIn.value, 10);
    if (!isFinite(len) || len < 8) len = 8;
    if (len > 64) len = 64;

    var sets = [];
    if (cUpper.checked) sets.push(UPPER);
    if (cLower.checked) sets.push(LOWER);
    if (cNumber.checked) sets.push(NUMS);
    if (cSymbol.checked) sets.push(SYMS);
    if (cAmbiguous.checked) {
      sets = sets.map(function (s) { return s.split("").filter(function (c) { return AMBIG.indexOf(c) === -1; }).join(""); })
        .filter(function (s) { return s.length; });
    }

    var chars = [];
    sets.forEach(function (s) { if (chars.length < len) chars.push(s.charAt(K.randomInt(s.length))); });
    while (chars.length < len) chars.push(p.charAt(K.randomInt(p.length)));
    /* Fisher–Yates with CSPRNG */
    for (var i = chars.length - 1; i > 0; i--) {
      var j = K.randomInt(i + 1);
      var tmp = chars[i]; chars[i] = chars[j]; chars[j] = tmp;
    }
    var value = chars.join("");
    show(value, len * (Math.log(p.length) / Math.log(2)));
    K.setStatus(status, t("passwordReady"), "success");
  }

  function generatePhrase() {
    var n = parseInt(wordsIn.value, 10);
    if (!isFinite(n) || n < 3) n = 3;
    if (n > 10) n = 10;
    var sep = sepIn.value || "-";
    var parts = [];
    for (var i = 0; i < n; i++) {
      var w = WORDS[K.randomInt(WORDS.length)];
      if (capWords.checked) w = w.charAt(0).toUpperCase() + w.slice(1);
      parts.push(w);
    }
    var bits = n * (Math.log(WORDS.length) / Math.log(2));
    if (numWord.checked) {
      parts.push(String(K.randomInt(10000)).padStart(4, "0"));
      bits += Math.log(10000) / Math.log(2);
    }
    show(parts.join(sep), bits);
    K.setStatus(status, t("passwordReady"), "success");
  }

  function generate() {
    if (mode() === "phrase") generatePhrase(); else generateChars();
  }

  modeRadios.forEach(function (r) { r.addEventListener("change", function () { syncMode(); generate(); }); });
  lenIn.addEventListener("input", function () { lenOut.textContent = I.num(lenIn.value); generate(); });
  wordsIn.addEventListener("input", function () { wordsOut.textContent = I.num(wordsIn.value); generate(); });
  [cUpper, cLower, cNumber, cSymbol, cAmbiguous, capWords, numWord].forEach(function (c) { c.addEventListener("change", generate); });
  sepIn.addEventListener("input", generate);
  genBtn.addEventListener("click", generate);
  copyBtn.addEventListener("click", function () {
    var v = out.getAttribute("data-value");
    if (v) K.copyText(v);
  });

  lenOut.textContent = I.num(lenIn.value);
  wordsOut.textContent = I.num(wordsIn.value);
  syncMode();
  generate();
  K.setStatus(status, ar ? "يتم إنشاء كلمات المرور داخل متصفحك باستخدام مولد أرقام عشوائية آمن تشفيريًا." : "Passwords are generated inside your browser with a cryptographically secure random number generator.");
})();
