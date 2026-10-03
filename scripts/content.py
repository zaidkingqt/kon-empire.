# -*- coding: utf-8 -*-
"""Kitbox content source: tool metadata, workspaces, articles and FAQs.
Consumed by scripts/build.py which renders the static HTML files."""

ICONS = {
    "image-compressor": '<path d="M3 5h18v14H3z"/><path d="m7 15 3-3 2.5 2.5L16 11l4 4"/><circle cx="9" cy="9" r="1.3"/>',
    "image-resizer": '<path d="M4 4h10v10H4z"/><path d="M10 10h10v10H10z"/><path d="M17 14v3h-3"/>',
    "image-converter": '<path d="M4 5h8v8H4z"/><path d="M20 11v8h-8"/><path d="M8 17H4l3-3"/><path d="M16 7h4l-3 3"/>',
    "pdf-merge": '<path d="M4 4h8l2 2h6v12H4z"/><path d="M12 10v6"/><path d="M9 13h6"/>',
    "pdf-split": '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M4 12h16"/>',
    "images-to-pdf": '<path d="M3 5h10v10H3z"/><path d="m5 13 3-3 2 2"/><path d="M13 9h8v12h-8z"/><path d="M16 14h2"/>',
    "qr-code-generator": '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>',
    "password-generator": '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15" r="1.2"/>',
    "word-counter": '<path d="M4 6h16M4 12h12M4 18h8"/><path d="M18 15v6"/><path d="m15 18 3-3 3 3"/>',
    "case-converter": '<path d="M4 18 8 6l4 12"/><path d="M5.5 14h5"/><path d="M15 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M18 11v7"/>',
    "json-formatter": '<path d="M9 4H7a3 3 0 0 0-3 3v2a3 3 0 0 1-3 3 3 3 0 0 1 3 3v2a3 3 0 0 0 3 3h2"/><path d="M15 4h2a3 3 0 0 1 3 3v2a3 3 0 0 0 3 3 3 3 0 0 0-3 3v2a3 3 0 0 1-3 3h-2"/>',
    "lorem-ipsum-generator": '<path d="M4 5h16M4 10h16M4 15h11M4 20h7"/>',
}

CATS = {
    "image": ("Image", "الصور"),
    "pdf": ("PDF", "ملفات PDF"),
    "text": ("Text", "النصوص"),
    "dev": ("Developer", "المطوّرين"),
    "security": ("Security", "الأمان"),
}


def _ws_image_compressor(L):
    return f"""
<div class="workspace">
  <div class="dropzone" id="dropzone" role="button" tabindex="0" aria-describedby="dz-hint">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 16V4m0 0L8 8m4-4 4 4"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>
    <strong>{L('Drop images here or choose files', 'أفلت الصور هنا أو اختر ملفات')}</strong>
    <span id="dz-hint">{L('JPG, PNG or WebP. You can also paste an image with Ctrl + V.', 'JPG أو PNG أو WebP. يمكنك أيضًا لصق صورة بالضغط على Ctrl + V.')}</span>
    <input type="file" id="file-input" accept="image/jpeg,image/png,image/webp" multiple>
  </div>
  <div class="field-grid mt-3">
    <div class="field">
      <label for="quality">{L('Quality', 'الجودة')} <span id="quality-out" class="muted"></span></label>
      <input type="range" id="quality" min="30" max="95" value="75" step="1">
      <span class="hint">{L('Lower quality means smaller files. 70–80 suits most photos.', 'الجودة الأقل تعني ملفات أصغر. القيمة 70–80 مناسبة لمعظم الصور.')}</span>
    </div>
    <div class="field">
      <label for="max-width">{L('Maximum width (pixels)', 'أقصى عرض (بالبكسل)')}</label>
      <input type="number" id="max-width" min="0" step="10" placeholder="{L('Leave empty to keep size', 'اتركه فارغًا للإبقاء على المقاس')}">
      <span class="hint">{L('Useful when the original photo is far bigger than needed.', 'مفيد عندما تكون الصورة الأصلية أكبر بكثير من الحاجة.')}</span>
    </div>
  </div>
  <div class="actions">
    <button type="button" class="btn btn-primary" id="run">{L('Compress images', 'ضغط الصور')}</button>
    <button type="button" class="btn btn-secondary" id="download-zip" hidden>{L('Download all (ZIP)', 'تنزيل الكل (ZIP)')}</button>
    <button type="button" class="btn btn-ghost" id="reset">{L('Start over', 'البدء من جديد')}</button>
  </div>
  <div class="progress" id="progress" hidden><div></div></div>
  <p class="status" id="tool-status" role="status" aria-live="polite"></p>
  <ul class="file-list" id="file-list"></ul>
  <ul class="stat-grid mt-3" id="summary" hidden></ul>
  <div class="mt-3" id="compare-wrap" hidden></div>
</div>"""


def _ws_image_resizer(L):
    return f"""
<div class="workspace">
  <div class="dropzone" id="dropzone" role="button" tabindex="0" aria-describedby="dz-hint">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M14 10h6M14 10v6"/></svg>
    <strong>{L('Drop images here or choose files', 'أفلت الصور هنا أو اختر ملفات')}</strong>
    <span id="dz-hint">{L('JPG, PNG or WebP. Batch resizing is supported.', 'JPG أو PNG أو WebP. يدعم تغيير حجم عدة صور دفعة واحدة.')}</span>
    <input type="file" id="file-input" accept="image/jpeg,image/png,image/webp" multiple>
  </div>

  <fieldset class="mt-3" style="border:0;padding:0;margin:0">
    <legend class="field-label">{L('Resize method', 'طريقة تغيير الحجم')}</legend>
    <div class="check-grid">
      <label class="check"><input type="radio" name="mode" value="pixels" checked> {L('By pixels', 'بالبكسل')}</label>
      <label class="check"><input type="radio" name="mode" value="percent"> {L('By percentage', 'بالنسبة المئوية')}</label>
    </div>
  </fieldset>

  <div id="px-fields">
    <div class="field-grid">
      <div class="field">
        <label for="out-width">{L('Width (px)', 'العرض (بكسل)')}</label>
        <input type="number" id="out-width" min="1" step="1">
      </div>
      <div class="field">
        <label for="out-height">{L('Height (px)', 'الارتفاع (بكسل)')}</label>
        <input type="number" id="out-height" min="1" step="1">
      </div>
    </div>
    <label class="check"><input type="checkbox" id="lock-ratio" checked> {L('Lock aspect ratio', 'الحفاظ على نسبة الأبعاد')}</label>
  </div>

  <div id="pct-fields" hidden>
    <div class="field">
      <label for="scale-percent">{L('Scale', 'نسبة التحجيم')} <span id="scale-percent-out" class="muted"></span></label>
      <input type="range" id="scale-percent" min="5" max="200" value="50" step="5">
    </div>
  </div>

  <div class="field-grid">
    <div class="field">
      <label for="preset">{L('Preset size', 'مقاس جاهز')}</label>
      <select id="preset">
        <option value="">{L('No preset', 'بدون مقاس جاهز')}</option>
        <option value="instagram-post">{L('Instagram post — 1080 × 1080', 'منشور إنستغرام — 1080 × 1080')}</option>
        <option value="instagram-story">{L('Instagram story — 1080 × 1920', 'ستوري إنستغرام — 1080 × 1920')}</option>
        <option value="youtube-thumbnail">{L('YouTube thumbnail — 1280 × 720', 'صورة مصغّرة ليوتيوب — 1280 × 720')}</option>
        <option value="facebook-cover">{L('Facebook cover — 820 × 312', 'غلاف فيسبوك — 820 × 312')}</option>
        <option value="passport">{L('Passport photo — 413 × 531', 'صورة جواز سفر — 413 × 531')}</option>
        <option value="favicon">{L('Favicon source — 512 × 512', 'أيقونة موقع — 512 × 512')}</option>
      </select>
    </div>
    <div class="field">
      <label for="out-format">{L('Output format', 'صيغة الإخراج')}</label>
      <select id="out-format">
        <option value="image/jpeg">JPG</option>
        <option value="image/png">PNG</option>
        <option value="image/webp">WebP</option>
      </select>
    </div>
    <div class="field">
      <label for="quality">{L('Quality', 'الجودة')} <span id="quality-out" class="muted"></span></label>
      <input type="range" id="quality" min="40" max="100" value="85" step="1">
    </div>
  </div>

  <div class="actions">
    <button type="button" class="btn btn-primary" id="run">{L('Resize images', 'تغيير حجم الصور')}</button>
    <button type="button" class="btn btn-secondary" id="download-zip" hidden>{L('Download all (ZIP)', 'تنزيل الكل (ZIP)')}</button>
    <button type="button" class="btn btn-ghost" id="reset">{L('Start over', 'البدء من جديد')}</button>
  </div>
  <div class="progress" id="progress" hidden><div></div></div>
  <p class="status" id="tool-status" role="status" aria-live="polite"></p>
  <ul class="file-list" id="file-list"></ul>
</div>"""


def _ws_image_converter(L):
    return f"""
<div class="workspace">
  <div class="dropzone" id="dropzone" role="button" tabindex="0" aria-describedby="dz-hint">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h10"/><path d="m11 4 3 3-3 3"/><path d="M20 17H10"/><path d="m13 14-3 3 3 3"/></svg>
    <strong>{L('Drop images here or choose files', 'أفلت الصور هنا أو اختر ملفات')}</strong>
    <span id="dz-hint">{L('Convert between JPG, PNG and WebP in any direction.', 'حوّل بين JPG وPNG وWebP في أي اتجاه.')}</span>
    <input type="file" id="file-input" accept="image/jpeg,image/png,image/webp" multiple>
  </div>
  <div class="field-grid mt-3">
    <div class="field">
      <label for="out-format">{L('Convert to', 'التحويل إلى')}</label>
      <select id="out-format">
        <option value="image/webp">WebP</option>
        <option value="image/jpeg">JPG</option>
        <option value="image/png">PNG</option>
      </select>
    </div>
    <div class="field" id="quality-field">
      <label for="quality">{L('Quality', 'الجودة')} <span id="quality-out" class="muted"></span></label>
      <input type="range" id="quality" min="40" max="100" value="85" step="1">
    </div>
    <div class="field" id="bg-field" hidden>
      <label for="bg-color">{L('Background for transparent areas', 'لون خلفية المناطق الشفافة')}</label>
      <input type="color" id="bg-color" value="#ffffff">
      <span class="hint">{L('JPG has no transparency, so transparent pixels get this colour.', 'صيغة JPG لا تدعم الشفافية، لذا تأخذ البكسلات الشفافة هذا اللون.')}</span>
    </div>
  </div>
  <div class="actions">
    <button type="button" class="btn btn-primary" id="run">{L('Convert images', 'تحويل الصور')}</button>
    <button type="button" class="btn btn-secondary" id="download-zip" hidden>{L('Download all (ZIP)', 'تنزيل الكل (ZIP)')}</button>
    <button type="button" class="btn btn-ghost" id="reset">{L('Start over', 'البدء من جديد')}</button>
  </div>
  <div class="progress" id="progress" hidden><div></div></div>
  <p class="status" id="tool-status" role="status" aria-live="polite"></p>
  <ul class="file-list" id="file-list"></ul>
  <div class="preview-grid" id="preview-grid" hidden></div>
</div>"""


def _ws_pdf_merge(L):
    return f"""
<div class="workspace">
  <div class="dropzone" id="dropzone" role="button" tabindex="0" aria-describedby="dz-hint">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M12 11v6M9 14h6"/></svg>
    <strong>{L('Drop PDF files here or choose files', 'أفلت ملفات PDF هنا أو اخترها')}</strong>
    <span id="dz-hint">{L('Add two or more PDFs, then drag the rows or use the arrow buttons to set the order.', 'أضف ملفين أو أكثر، ثم اسحب الصفوف أو استخدم أزرار الأسهم لترتيبها.')}</span>
    <input type="file" id="file-input" accept="application/pdf,.pdf" multiple>
  </div>
  <div class="field mt-3">
    <label for="out-name">{L('Output file name', 'اسم ملف الإخراج')}</label>
    <input type="text" id="out-name" value="kitbox-merged">
  </div>
  <div class="actions">
    <button type="button" class="btn btn-primary" id="run">{L('Merge PDFs', 'دمج ملفات PDF')}</button>
    <button type="button" class="btn btn-ghost" id="reset">{L('Start over', 'البدء من جديد')}</button>
  </div>
  <div class="progress" id="progress" hidden><div></div></div>
  <p class="status" id="tool-status" role="status" aria-live="polite"></p>
  <ul class="file-list" id="file-list"></ul>
</div>"""


def _ws_pdf_split(L):
    return f"""
<div class="workspace">
  <div class="dropzone" id="dropzone" role="button" tabindex="0" aria-describedby="dz-hint">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M4 12h16"/></svg>
    <strong>{L('Drop a PDF here or choose a file', 'أفلت ملف PDF هنا أو اختر ملفًا')}</strong>
    <span id="dz-hint">{L('One PDF at a time. The page count appears once the file is read.', 'ملف واحد في كل مرة. يظهر عدد الصفحات بعد قراءة الملف.')}</span>
    <input type="file" id="file-input" accept="application/pdf,.pdf">
  </div>
  <ul class="file-list" id="file-info"></ul>

  <div id="split-options" hidden>
    <fieldset class="mt-3" style="border:0;padding:0;margin:0">
      <legend class="field-label">{L('Split mode', 'طريقة التقسيم')}</legend>
      <div class="check-grid">
        <label class="check"><input type="radio" name="split-mode" value="ranges" checked> {L('Page ranges', 'نطاقات صفحات')}</label>
        <label class="check"><input type="radio" name="split-mode" value="every"> {L('Every N pages', 'كل N صفحة')}</label>
        <label class="check"><input type="radio" name="split-mode" value="single"> {L('Every page separately', 'كل صفحة على حدة')}</label>
      </div>
    </fieldset>
    <div class="field" id="range-field">
      <label for="ranges">{L('Page ranges', 'نطاقات الصفحات')}</label>
      <input type="text" id="ranges" inputmode="numeric">
      <span class="hint">{L('Separate ranges with commas. Each range becomes one PDF.', 'افصل بين النطاقات بفواصل. كل نطاق يصبح ملف PDF مستقلًا.')}</span>
    </div>
    <div class="field" id="every-field" hidden>
      <label for="every-n">{L('Pages per file', 'عدد الصفحات في كل ملف')}</label>
      <input type="number" id="every-n" min="1" value="1">
    </div>
    <div class="actions">
      <button type="button" class="btn btn-primary" id="run">{L('Split PDF', 'تقسيم ملف PDF')}</button>
      <button type="button" class="btn btn-ghost" id="reset">{L('Start over', 'البدء من جديد')}</button>
    </div>
  </div>
  <div class="progress" id="progress" hidden><div></div></div>
  <p class="status" id="tool-status" role="status" aria-live="polite"></p>
</div>"""


def _ws_images_to_pdf(L):
    return f"""
<div class="workspace">
  <div class="dropzone" id="dropzone" role="button" tabindex="0" aria-describedby="dz-hint">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 5h10v10H3z"/><path d="m5 13 3-3 2 2"/><path d="M13 9h8v12h-8z"/></svg>
    <strong>{L('Drop images here or choose files', 'أفلت الصور هنا أو اختر ملفات')}</strong>
    <span id="dz-hint">{L('JPG and PNG images. Each image becomes one PDF page.', 'صور JPG وPNG. تتحول كل صورة إلى صفحة في ملف PDF.')}</span>
    <input type="file" id="file-input" accept="image/jpeg,image/png" multiple>
  </div>
  <div class="field-grid mt-3">
    <div class="field">
      <label for="page-size">{L('Page size', 'حجم الصفحة')}</label>
      <select id="page-size">
        <option value="a4">A4</option>
        <option value="letter">Letter</option>
        <option value="fit">{L('Fit to image', 'حسب مقاس الصورة')}</option>
      </select>
    </div>
    <div class="field" id="orientation-field">
      <label for="orientation">{L('Orientation', 'الاتجاه')}</label>
      <select id="orientation">
        <option value="portrait">{L('Portrait', 'طولي')}</option>
        <option value="landscape">{L('Landscape', 'عرضي')}</option>
      </select>
    </div>
    <div class="field">
      <label for="margin">{L('Margin', 'الهامش')} <span id="margin-out" class="muted"></span></label>
      <input type="range" id="margin" min="0" max="72" value="24" step="4">
    </div>
    <div class="field">
      <label for="out-name">{L('Output file name', 'اسم ملف الإخراج')}</label>
      <input type="text" id="out-name" value="kitbox-images">
    </div>
  </div>
  <div class="actions">
    <button type="button" class="btn btn-primary" id="run">{L('Create PDF', 'إنشاء ملف PDF')}</button>
    <button type="button" class="btn btn-ghost" id="reset">{L('Start over', 'البدء من جديد')}</button>
  </div>
  <div class="progress" id="progress" hidden><div></div></div>
  <p class="status" id="tool-status" role="status" aria-live="polite"></p>
  <ul class="file-list" id="file-list"></ul>
  <div class="preview-grid" id="preview-grid" hidden></div>
</div>"""


def _ws_qr(L):
    return f"""
<div class="workspace">
  <div class="tabs" role="tablist" aria-label="{L('QR code content type', 'نوع محتوى رمز QR')}">
    <button type="button" role="tab" id="tab-text" data-tab="text" aria-selected="true" aria-controls="panel-text" tabindex="0">{L('URL / Text', 'رابط / نص')}</button>
    <button type="button" role="tab" id="tab-wifi" data-tab="wifi" aria-selected="false" aria-controls="panel-wifi" tabindex="-1">{L('Wi-Fi', 'واي فاي')}</button>
    <button type="button" role="tab" id="tab-vcard" data-tab="vcard" aria-selected="false" aria-controls="panel-vcard" tabindex="-1">{L('vCard', 'بطاقة اتصال')}</button>
    <button type="button" role="tab" id="tab-email" data-tab="email" aria-selected="false" aria-controls="panel-email" tabindex="-1">{L('Email', 'بريد إلكتروني')}</button>
  </div>

  <div role="tabpanel" id="panel-text" aria-labelledby="tab-text">
    <div class="field">
      <label for="qr-text">{L('Link or text', 'الرابط أو النص')}</label>
      <textarea id="qr-text" rows="3" style="min-height:96px">https://www.example.com</textarea>
    </div>
  </div>

  <div role="tabpanel" id="panel-wifi" aria-labelledby="tab-wifi" hidden>
    <div class="field-grid">
      <div class="field"><label for="wifi-ssid">{L('Network name (SSID)', 'اسم الشبكة (SSID)')}</label><input type="text" id="wifi-ssid"></div>
      <div class="field"><label for="wifi-enc">{L('Security', 'نوع الحماية')}</label>
        <select id="wifi-enc"><option value="WPA">WPA / WPA2</option><option value="WEP">WEP</option><option value="nopass">{L('Open network', 'شبكة مفتوحة')}</option></select>
      </div>
      <div class="field"><label for="wifi-pass">{L('Password', 'كلمة المرور')}</label><input type="password" id="wifi-pass" autocomplete="off"></div>
    </div>
    <label class="check"><input type="checkbox" id="wifi-hidden"> {L('Hidden network', 'شبكة مخفية')}</label>
  </div>

  <div role="tabpanel" id="panel-vcard" aria-labelledby="tab-vcard" hidden>
    <div class="field-grid">
      <div class="field"><label for="vc-first">{L('First name', 'الاسم الأول')}</label><input type="text" id="vc-first"></div>
      <div class="field"><label for="vc-last">{L('Last name', 'اسم العائلة')}</label><input type="text" id="vc-last"></div>
      <div class="field"><label for="vc-org">{L('Organisation', 'جهة العمل')}</label><input type="text" id="vc-org"></div>
      <div class="field"><label for="vc-title">{L('Job title', 'المسمى الوظيفي')}</label><input type="text" id="vc-title"></div>
      <div class="field"><label for="vc-phone">{L('Phone', 'الهاتف')}</label><input type="text" id="vc-phone" inputmode="tel"></div>
      <div class="field"><label for="vc-email">{L('Email', 'البريد الإلكتروني')}</label><input type="email" id="vc-email"></div>
      <div class="field"><label for="vc-url">{L('Website', 'الموقع الإلكتروني')}</label><input type="url" id="vc-url"></div>
    </div>
  </div>

  <div role="tabpanel" id="panel-email" aria-labelledby="tab-email" hidden>
    <div class="field-grid">
      <div class="field"><label for="em-to">{L('To', 'إلى')}</label><input type="email" id="em-to"></div>
      <div class="field"><label for="em-subject">{L('Subject', 'الموضوع')}</label><input type="text" id="em-subject"></div>
    </div>
    <div class="field"><label for="em-body">{L('Message', 'نص الرسالة')}</label><textarea id="em-body" rows="3" style="min-height:96px"></textarea></div>
  </div>

  <div class="field-grid mt-3">
    <div class="field"><label for="fg-color">{L('Foreground colour', 'لون الرمز')}</label><input type="color" id="fg-color" value="#0c1222"></div>
    <div class="field"><label for="bg-color">{L('Background colour', 'لون الخلفية')}</label><input type="color" id="bg-color" value="#ffffff"></div>
    <div class="field"><label for="ec-level">{L('Error correction', 'تصحيح الأخطاء')}</label>
      <select id="ec-level"><option value="L">L — 7%</option><option value="M" selected>M — 15%</option><option value="Q">Q — 25%</option><option value="H">H — 30%</option></select>
    </div>
    <div class="field"><label for="qr-size">{L('Size', 'الحجم')} <span id="qr-size-out" class="muted"></span></label><input type="range" id="qr-size" min="128" max="1024" value="512" step="32"></div>
    <div class="field"><label for="qr-margin">{L('Quiet zone (modules)', 'الهامش (وحدات)')} <span id="qr-margin-out" class="muted"></span></label><input type="range" id="qr-margin" min="0" max="8" value="4" step="1"></div>
  </div>

  <div class="qr-preview mt-3" id="qr-preview"></div>

  <div class="actions">
    <button type="button" class="btn btn-primary" id="download-png">{L('Download PNG', 'تنزيل PNG')}</button>
    <button type="button" class="btn btn-secondary" id="download-svg">{L('Download SVG', 'تنزيل SVG')}</button>
    <button type="button" class="btn btn-secondary" id="copy-text">{L('Copy encoded text', 'نسخ النص المشفّر')}</button>
    <button type="button" class="btn btn-ghost" id="reset">{L('Start over', 'البدء من جديد')}</button>
  </div>
  <p class="status" id="tool-status" role="status" aria-live="polite"></p>
</div>"""


def _ws_password(L):
    return f"""
<div class="workspace">
  <h2 class="sr-only">{L('Generated password', 'كلمة المرور الناتجة')}</h2>
  <output class="output-box" id="password-out" data-value="" aria-live="polite"></output>
  <div class="field mt-3">
    <div class="meter" id="strength-meter"><div></div></div>
    <p class="hint"><span id="strength-label"></span> · <span id="entropy-label"></span></p>
  </div>

  <fieldset style="border:0;padding:0;margin:0">
    <legend class="field-label">{L('Password type', 'نوع كلمة المرور')}</legend>
    <div class="check-grid">
      <label class="check"><input type="radio" name="pw-mode" value="chars" checked> {L('Random characters', 'أحرف عشوائية')}</label>
      <label class="check"><input type="radio" name="pw-mode" value="phrase"> {L('Passphrase (words)', 'عبارة مرور (كلمات)')}</label>
    </div>
  </fieldset>

  <div id="char-fields">
    <div class="field">
      <label for="pw-length">{L('Length', 'الطول')} <span id="pw-length-out" class="muted"></span></label>
      <input type="range" id="pw-length" min="8" max="64" value="20" step="1">
    </div>
    <div class="check-grid">
      <label class="check"><input type="checkbox" id="c-upper" checked> {L('Uppercase A–Z', 'أحرف كبيرة A–Z')}</label>
      <label class="check"><input type="checkbox" id="c-lower" checked> {L('Lowercase a–z', 'أحرف صغيرة a–z')}</label>
      <label class="check"><input type="checkbox" id="c-number" checked> {L('Numbers 0–9', 'أرقام 0–9')}</label>
      <label class="check"><input type="checkbox" id="c-symbol" checked> {L('Symbols !@#$', 'رموز !@#$')}</label>
      <label class="check"><input type="checkbox" id="c-ambiguous"> {L('Exclude ambiguous characters', 'استبعاد الأحرف المتشابهة')}</label>
    </div>
  </div>

  <div id="phrase-fields" hidden>
    <div class="field">
      <label for="pw-words">{L('Number of words', 'عدد الكلمات')} <span id="pw-words-out" class="muted"></span></label>
      <input type="range" id="pw-words" min="3" max="10" value="5" step="1">
    </div>
    <div class="field">
      <label for="pw-separator">{L('Separator', 'الفاصل')}</label>
      <input type="text" id="pw-separator" value="-" maxlength="3">
    </div>
    <div class="check-grid">
      <label class="check"><input type="checkbox" id="pw-capitalize" checked> {L('Capitalise each word', 'بدء كل كلمة بحرف كبير')}</label>
      <label class="check"><input type="checkbox" id="pw-number-word" checked> {L('Append a 4-digit number', 'إضافة رقم من 4 خانات')}</label>
    </div>
  </div>

  <div class="actions">
    <button type="button" class="btn btn-primary" id="generate">{L('Generate password', 'إنشاء كلمة مرور')}</button>
    <button type="button" class="btn btn-secondary" id="copy">{L('Copy', 'نسخ')}</button>
  </div>
  <p class="status" id="tool-status" role="status" aria-live="polite"></p>
</div>"""


def _ws_word_counter(L):
    return f"""
<div class="workspace">
  <div class="field">
    <label for="text-input">{L('Your text', 'النص الخاص بك')}</label>
    <textarea id="text-input" rows="12" spellcheck="true" placeholder="{L('Type or paste your text here…', 'اكتب أو الصق نصك هنا…')}"></textarea>
  </div>
  <div class="actions">
    <button type="button" class="btn btn-secondary" id="copy">{L('Copy text', 'نسخ النص')}</button>
    <button type="button" class="btn btn-ghost" id="reset">{L('Clear', 'مسح')}</button>
  </div>
  <p class="status" id="tool-status" role="status" aria-live="polite"></p>

  <h2 class="mt-3">{L('Statistics', 'الإحصائيات')}</h2>
  <ul class="stat-grid">
    <li class="stat"><span class="v" id="s-words">0</span><span class="k">{L('Words', 'الكلمات')}</span></li>
    <li class="stat"><span class="v" id="s-chars">0</span><span class="k">{L('Characters', 'الأحرف')}</span></li>
    <li class="stat"><span class="v" id="s-chars-nospace">0</span><span class="k">{L('Characters without spaces', 'الأحرف بدون مسافات')}</span></li>
    <li class="stat"><span class="v" id="s-sentences">0</span><span class="k">{L('Sentences', 'الجمل')}</span></li>
    <li class="stat"><span class="v" id="s-paragraphs">0</span><span class="k">{L('Paragraphs', 'الفقرات')}</span></li>
    <li class="stat"><span class="v" id="s-reading">0</span><span class="k">{L('Reading time', 'زمن القراءة')}</span></li>
    <li class="stat"><span class="v" id="s-speaking">0</span><span class="k">{L('Speaking time', 'زمن الإلقاء')}</span></li>
  </ul>

  <h2 class="mt-3">{L('Keyword density', 'كثافة الكلمات المفتاحية')}</h2>
  <p class="hint" id="density-note">{L('Add at least 10 words to see the most frequent terms.', 'أضف 10 كلمات على الأقل لعرض أكثر المصطلحات تكرارًا.')}</p>
  <table class="data">
    <thead><tr><th scope="col">{L('Term', 'المصطلح')}</th><th scope="col">{L('Count', 'التكرار')}</th><th scope="col">{L('Density', 'الكثافة')}</th></tr></thead>
    <tbody id="density-body"></tbody>
  </table>
</div>"""


def _ws_case(L):
    return f"""
<div class="workspace">
  <div class="field">
    <label for="text-input">{L('Your text', 'النص الخاص بك')}</label>
    <textarea id="text-input" rows="10" placeholder="{L('Type or paste your text here…', 'اكتب أو الصق نصك هنا…')}"></textarea>
    <span class="hint" id="char-count"></span>
  </div>
  <h2 class="field-label">{L('Choose a case', 'اختر نمط الحالة')}</h2>
  <div class="actions">
    <button type="button" class="btn btn-secondary btn-sm" data-case="upper">UPPERCASE</button>
    <button type="button" class="btn btn-secondary btn-sm" data-case="lower">lowercase</button>
    <button type="button" class="btn btn-secondary btn-sm" data-case="title">Title Case</button>
    <button type="button" class="btn btn-secondary btn-sm" data-case="sentence">Sentence case</button>
    <button type="button" class="btn btn-secondary btn-sm" data-case="camel">camelCase</button>
    <button type="button" class="btn btn-secondary btn-sm" data-case="pascal">PascalCase</button>
    <button type="button" class="btn btn-secondary btn-sm" data-case="snake">snake_case</button>
    <button type="button" class="btn btn-secondary btn-sm" data-case="kebab">kebab-case</button>
    <button type="button" class="btn btn-secondary btn-sm" data-case="alternating">aLtErNaTiNg</button>
  </div>
  <div class="actions">
    <button type="button" class="btn btn-primary" id="copy">{L('Copy', 'نسخ')}</button>
    <button type="button" class="btn btn-secondary" id="download-txt">{L('Download .txt', 'تنزيل ملف .txt')}</button>
    <button type="button" class="btn btn-secondary" id="undo">{L('Undo', 'تراجع')}</button>
    <button type="button" class="btn btn-ghost" id="reset">{L('Clear', 'مسح')}</button>
  </div>
  <p class="status" id="tool-status" role="status" aria-live="polite"></p>
</div>"""


def _ws_json(L):
    return f"""
<div class="workspace">
  <div class="field">
    <label for="json-input">{L('JSON input', 'مدخلات JSON')}</label>
    <textarea id="json-input" rows="14" spellcheck="false" placeholder='{{"name": "Kitbox", "private": true}}'></textarea>
    <span class="hint" id="size-note"></span>
  </div>
  <div class="field" style="max-width:260px">
    <label for="indent">{L('Indentation', 'المسافة البادئة')}</label>
    <select id="indent">
      <option value="2" selected>{L('2 spaces', 'مسافتان')}</option>
      <option value="4">{L('4 spaces', '4 مسافات')}</option>
      <option value="tab">{L('Tab', 'علامة جدولة')}</option>
    </select>
  </div>
  <div class="actions">
    <button type="button" class="btn btn-primary" id="format">{L('Format', 'تنسيق')}</button>
    <button type="button" class="btn btn-secondary" id="minify">{L('Minify', 'تصغير')}</button>
    <button type="button" class="btn btn-secondary" id="validate">{L('Validate', 'تحقق')}</button>
    <button type="button" class="btn btn-secondary" id="copy">{L('Copy', 'نسخ')}</button>
    <button type="button" class="btn btn-secondary" id="download">{L('Download', 'تنزيل')}</button>
    <button type="button" class="btn btn-ghost" id="reset">{L('Clear', 'مسح')}</button>
  </div>
  <p class="status" id="tool-status" role="status" aria-live="polite"></p>
  <div class="mt-3" id="tree-wrap" hidden>
    <h2>{L('Collapsible tree', 'عرض شجري قابل للطي')}</h2>
    <div class="json-tree" id="json-tree"></div>
  </div>
</div>"""


def _ws_lorem(L):
    return f"""
<div class="workspace">
  <div class="field-grid">
    <div class="field">
      <label for="unit">{L('Generate', 'إنشاء')}</label>
      <select id="unit">
        <option value="paragraphs" selected>{L('Paragraphs', 'فقرات')}</option>
        <option value="sentences">{L('Sentences', 'جمل')}</option>
        <option value="words">{L('Words', 'كلمات')}</option>
      </select>
    </div>
    <div class="field">
      <label for="count">{L('How many', 'العدد')}</label>
      <input type="number" id="count" min="1" max="200" value="3">
    </div>
    <div class="field" id="script-field" hidden>
      <label for="script">{L('Script', 'لغة النص')}</label>
      <select id="script">
        <option value="ar" selected>{L('Arabic placeholder', 'نص بديل بالعربية')}</option>
        <option value="la">{L('Classic Latin', 'لاتيني كلاسيكي')}</option>
      </select>
    </div>
  </div>
  <div class="check-grid">
    <label class="check"><input type="checkbox" id="start-lorem" checked> {L('Start with “Lorem ipsum”', 'ابدأ بعبارة افتتاحية ثابتة')}</label>
    <label class="check"><input type="checkbox" id="wrap-p"> {L('Wrap in &lt;p&gt; tags', 'تغليف الفقرات بوسم &lt;p&gt;')}</label>
  </div>
  <div class="actions">
    <button type="button" class="btn btn-primary" id="generate">{L('Generate text', 'إنشاء النص')}</button>
    <button type="button" class="btn btn-secondary" id="copy">{L('Copy', 'نسخ')}</button>
    <button type="button" class="btn btn-secondary" id="download">{L('Download .txt', 'تنزيل ملف .txt')}</button>
    <button type="button" class="btn btn-ghost" id="reset">{L('Clear', 'مسح')}</button>
  </div>
  <div class="field mt-3">
    <label for="lorem-out">{L('Result', 'النتيجة')}</label>
    <textarea id="lorem-out" rows="12" readonly></textarea>
  </div>
  <p class="status" id="tool-status" role="status" aria-live="polite"></p>
</div>"""


WORKSPACES = {
    "image-compressor": _ws_image_compressor,
    "image-resizer": _ws_image_resizer,
    "image-converter": _ws_image_converter,
    "pdf-merge": _ws_pdf_merge,
    "pdf-split": _ws_pdf_split,
    "images-to-pdf": _ws_images_to_pdf,
    "qr-code-generator": _ws_qr,
    "password-generator": _ws_password,
    "word-counter": _ws_word_counter,
    "case-converter": _ws_case,
    "json-formatter": _ws_json,
    "lorem-ipsum-generator": _ws_lorem,
}

LIBS = {
    "pdf-merge": ["pdf-lib"],
    "pdf-split": ["pdf-lib"],
    "images-to-pdf": ["pdf-lib"],
    "qr-code-generator": ["qrcode"],
}
