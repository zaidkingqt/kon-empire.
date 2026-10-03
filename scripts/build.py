#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kitbox static site generator.

Renders every English and Arabic HTML page, the sitemap and the OG SVG
sources from the content modules in this folder. Run with:

    python3 scripts/build.py

The generated output is plain static HTML with no runtime dependency on
this script; it exists only so the 40+ pages stay consistent.
"""

import os
import re
import sys
import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

from content import ICONS, CATS, WORKSPACES, LIBS           # noqa: E402
from articles_en import EN                                   # noqa: E402
from articles_ar import AR                                   # noqa: E402

# ---------------------------------------------------------------------------
# Single source of truth for the production domain. Replace this one value.
ORIGIN = "https://www.example.com"
CONTACT_EMAIL = "hello@example.com"
ADSENSE_PUBLISHER_ID = "ca-pub-XXXXXXXXXXXXXXXX"
ADSENSE_SLOT = "XXXXXXXXXX"
LASTMOD = datetime.date.today().isoformat()
# ---------------------------------------------------------------------------

TOOL_ORDER = [
    ("image-compressor", "image"),
    ("image-resizer", "image"),
    ("image-converter", "image"),
    ("pdf-merge", "pdf"),
    ("pdf-split", "pdf"),
    ("images-to-pdf", "pdf"),
    ("word-counter", "text"),
    ("case-converter", "text"),
    ("lorem-ipsum-generator", "text"),
    ("json-formatter", "dev"),
    ("qr-code-generator", "dev"),
    ("password-generator", "security"),
]
CAT_OF = dict(TOOL_ORDER)
SLUGS = [s for s, _ in TOOL_ORDER]

RELATED = {
    "image-compressor": ["image-resizer", "image-converter", "images-to-pdf"],
    "image-resizer": ["image-compressor", "image-converter", "images-to-pdf"],
    "image-converter": ["image-compressor", "image-resizer", "images-to-pdf"],
    "pdf-merge": ["pdf-split", "images-to-pdf", "image-compressor"],
    "pdf-split": ["pdf-merge", "images-to-pdf", "image-compressor"],
    "images-to-pdf": ["pdf-merge", "pdf-split", "image-compressor"],
    "word-counter": ["case-converter", "lorem-ipsum-generator", "json-formatter"],
    "case-converter": ["word-counter", "lorem-ipsum-generator", "json-formatter"],
    "lorem-ipsum-generator": ["word-counter", "case-converter", "json-formatter"],
    "json-formatter": ["word-counter", "case-converter", "qr-code-generator"],
    "qr-code-generator": ["password-generator", "json-formatter", "image-converter"],
    "password-generator": ["qr-code-generator", "json-formatter", "word-counter"],
}

STATIC_PAGES = ["tools", "about", "contact", "privacy", "terms", "cookies"]

def logo(sfx="h"):
    return LOGO_SVG.replace("kbg", "kbg-" + sfx)


LOGO_SVG = (
    '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">'
    '<defs><linearGradient id="kbg" x1="0" y1="0" x2="1" y2="1">'
    '<stop offset="0" stop-color="#3D7BFF"/><stop offset="1" stop-color="#22D3EE"/>'
    '</linearGradient></defs>'
    '<rect x="5" y="20" width="38" height="22" rx="5" fill="url(#kbg)"/>'
    '<path d="M24 4 37 9v6c0 3.6-2.3 6.4-5.2 8.1L24 27l-7.8-3.9C13.3 21.4 11 18.6 11 15V9z" '
    'fill="#131B33" stroke="url(#kbg)" stroke-width="2.4" stroke-linejoin="round"/>'
    '<path d="m19.5 15.5 3.2 3.2 6-6.2" stroke="#2EE6A6" stroke-width="2.6" '
    'stroke-linecap="round" stroke-linejoin="round"/>'
    '<rect x="19" y="27" width="10" height="5" rx="2.5" fill="#0C1222" opacity=".35"/>'
    "</svg>"
)

SHIELD_ICON = (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    '<path d="M12 3 20 6v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6z"/>'
    '<path d="m9 12 2 2 4-4"/></svg>'
)

HERO_ART = (
    '<svg viewBox="0 0 320 300" role="img" aria-labelledby="hero-art-title" width="320" height="300">'
    '<title id="hero-art-title">%s</title>'
    '<defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">'
    '<stop offset="0" stop-color="#3D7BFF"/><stop offset="1" stop-color="#22D3EE"/></linearGradient></defs>'
    '<circle cx="160" cy="150" r="120" fill="url(#hg)" opacity=".08"/>'
    '<circle cx="160" cy="150" r="88" fill="url(#hg)" opacity=".10"/>'
    '<path d="M160 56 240 86v50c0 44-32 76-80 90-48-14-80-46-80-90V86z" fill="none" '
    'stroke="url(#hg)" stroke-width="4" stroke-linejoin="round"/>'
    '<path d="m130 152 22 22 42-46" fill="none" stroke="#2EE6A6" stroke-width="9" '
    'stroke-linecap="round" stroke-linejoin="round"/>'
    '<rect x="108" y="206" width="104" height="30" rx="15" fill="url(#hg)" opacity=".18"/>'
    "</svg>"
)


def L(lang, en, ar):
    return ar if lang == "ar" else en


def tool(lang, slug):
    return (AR if lang == "ar" else EN)[slug]


def url(lang, slug=""):
    base = "/ar/" if lang == "ar" else "/"
    return base + (slug + "/" if slug else "")


def alt_url(lang, slug=""):
    return url("en" if lang == "ar" else "ar", slug)


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))


# ---------------------------------------------------------------------------
# Shared chrome
# ---------------------------------------------------------------------------

def nav_items(lang):
    return [
        (url(lang, "tools"), L(lang, "All tools", "كل الأدوات")),
        (url(lang, "image-compressor"), L(lang, "Compress images", "ضغط الصور")),
        (url(lang, "pdf-merge"), L(lang, "Merge PDF", "دمج PDF")),
        (url(lang, "about"), L(lang, "About", "من نحن")),
        (url(lang, "contact"), L(lang, "Contact", "اتصل بنا")),
    ]


def header_html(lang, current):
    items = "".join(
        '<li><a href="%s"%s>%s</a></li>' % (href, ' aria-current="page"' if href == current else "", label)
        for href, label in nav_items(lang)
    )
    mobile_items = "".join(
        '<li><a href="%s"%s>%s</a></li>' % (href, ' aria-current="page"' if href == current else "", label)
        for href, label in nav_items(lang)
    )
    shield_title = L(lang, "Privacy Shield", "درع الخصوصية")
    shield_idle = L(lang, "0 bytes uploaded", "0 بايت تم رفعه")
    shield_body1 = L(lang,
                     "Your files never leave your device. Kitbox processes everything in your browser.",
                     "ملفاتك لا تغادر جهازك أبدًا. يعالج Kitbox كل شيء داخل متصفحك.")
    shield_body2 = L(lang,
                     "The page itself and a small number of pinned open-source libraries load from the network. Your documents, images and text do not.",
                     "تُحمَّل الصفحة نفسها وعدد صغير من المكتبات مفتوحة المصدر من الشبكة، أما مستنداتك وصورك ونصوصك فلا.")
    theme_dark = L(lang, "Switch to dark theme", "التبديل إلى المظهر الداكن")
    theme_light = L(lang, "Switch to light theme", "التبديل إلى المظهر الفاتح")

    suggest = ""
    if lang == "en":
        suggest = (
            '<div class="lang-suggest" id="lang-suggest" hidden><div class="wrap">'
            '<p lang="ar" dir="rtl">هذه الصفحة متاحة بالعربية.</p>'
            '<a class="btn btn-secondary btn-sm" href="%s" lang="ar" dir="rtl">عرض بالعربية</a>'
            '<button type="button" class="btn btn-ghost btn-sm" data-dismiss-lang>Dismiss</button>'
            "</div></div>" % alt_url(lang, current_slug_of(current, lang))
        )
    else:
        suggest = (
            '<div class="lang-suggest" id="lang-suggest" hidden><div class="wrap">'
            '<p lang="en" dir="ltr">This page is available in English.</p>'
            '<a class="btn btn-secondary btn-sm" href="%s" lang="en" dir="ltr">View in English</a>'
            '<button type="button" class="btn btn-ghost btn-sm" data-dismiss-lang>إخفاء</button>'
            "</div></div>" % alt_url(lang, current_slug_of(current, lang))
        )

    return """<header class="site-header">
{suggest}
<div class="wrap header-inner">
  <a class="brand" href="{home}">{logo}<span class="brand-name">Kitbox</span></a>
  <nav class="primary-nav" aria-label="{navlabel}"><ul>{items}</ul></nav>
  <div class="header-actions">
    <div class="shield" data-state="idle">
      <button type="button" class="shield-btn" aria-expanded="false" aria-controls="shield-popover">
        <span class="shield-dot" aria-hidden="true"></span>{shieldicon}
        <span class="shield-label" data-shield-label>{shieldidle}</span>
        <span class="sr-only">{shieldtitle}</span>
      </button>
      <div class="shield-popover" id="shield-popover" role="dialog" aria-label="{shieldtitle}" hidden>
        <h2>{shieldtitle}</h2>
        <p>{b1}</p>
        <p>{b2}</p>
      </div>
    </div>
    <a class="icon-btn lang-switch" href="{alt}" hreflang="{altlang}" lang="{altlang}" dir="{altdir}">{altlabel}</a>
    <button type="button" class="icon-btn" data-theme-toggle aria-pressed="false"
      data-label-dark="{tdark}" data-label-light="{tlight}" aria-label="{tdark}" title="{tdark}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>
      </svg>
    </button>
    <button type="button" class="icon-btn nav-toggle" data-menu-toggle aria-expanded="false"
      aria-controls="mobile-menu" aria-label="{menulabel}" title="{menulabel}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>
</div>
<div class="mobile-menu" id="mobile-menu" data-open="false">
  <div class="mobile-menu-panel" role="dialog" aria-modal="true" aria-label="{menulabel}">
    <div class="mobile-menu-head">
      <span class="brand"><span class="brand-name">Kitbox</span></span>
      <button type="button" class="icon-btn" data-menu-close aria-label="{closelabel}" title="{closelabel}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
    </div>
    <nav aria-label="{navlabel}"><ul>{mobileitems}</ul></nav>
  </div>
</div>
</header>""".format(
        suggest=suggest,
        home=url(lang),
        logo=logo("h"),
        navlabel=L(lang, "Main navigation", "التنقل الرئيسي"),
        items=items,
        mobileitems=mobile_items,
        shieldicon=SHIELD_ICON,
        shieldidle=shield_idle,
        shieldtitle=shield_title,
        b1=shield_body1,
        b2=shield_body2,
        alt=alt_url(lang, current_slug_of(current, lang)),
        altlang="ar" if lang == "en" else "en",
        altdir="rtl" if lang == "en" else "ltr",
        altlabel="العربية" if lang == "en" else "English",
        tdark=theme_dark,
        tlight=theme_light,
        menulabel=L(lang, "Menu", "القائمة"),
        closelabel=L(lang, "Close menu", "إغلاق القائمة"),
    )


def current_slug_of(current_url, lang):
    """Derive the slug from a rendered URL so the language switch stays paired."""
    s = current_url
    if lang == "ar":
        s = s[len("/ar/"):] if s.startswith("/ar/") else s.lstrip("/")
    else:
        s = s.lstrip("/")
    return s.strip("/")


def footer_html(lang):
    def links(slugs):
        return "".join('<li><a href="%s">%s</a></li>' % (url(lang, s), tool(lang, s)["name"]) for s in slugs)

    legal = [
        ("tools", L(lang, "All tools", "كل الأدوات")),
        ("about", L(lang, "About Kitbox", "عن Kitbox")),
        ("contact", L(lang, "Contact", "اتصل بنا")),
        ("privacy", L(lang, "Privacy Policy", "سياسة الخصوصية")),
        ("terms", L(lang, "Terms of Use", "شروط الاستخدام")),
        ("cookies", L(lang, "Cookie Policy", "سياسة ملفات تعريف الارتباط")),
    ]
    legal_html = "".join('<li><a href="%s">%s</a></li>' % (url(lang, s), t) for s, t in legal)

    return """<footer class="site-footer">
<div class="wrap">
  <div class="footer-grid">
    <div class="footer-brand">
      <a class="brand" href="{home}">{logo}<span class="brand-name">Kitbox</span></a>
      <p>{tag}</p>
    </div>
    <nav aria-labelledby="f-image"><h2 id="f-image">{cimage}</h2><ul>{limage}</ul></nav>
    <nav aria-labelledby="f-pdf"><h2 id="f-pdf">{cpdf}</h2><ul>{lpdf}</ul></nav>
    <nav aria-labelledby="f-text"><h2 id="f-text">{ctext}</h2><ul>{ltext}</ul></nav>
    <nav aria-labelledby="f-legal"><h2 id="f-legal">{clegal}</h2><ul>{llegal}</ul></nav>
  </div>
  <div class="footer-bottom">
    <p class="mb-0">© <span data-year>2026</span> Kitbox. {rights}</p>
    <div class="controls">
      <a class="btn btn-ghost btn-sm" href="{alt}" hreflang="{altlang}" lang="{altlang}" dir="{altdir}">{altlabel}</a>
      <button type="button" class="btn btn-ghost btn-sm" data-theme-toggle aria-pressed="false"
        data-label-dark="{tdark}" data-label-light="{tlight}">{themelabel}</button>
      <button type="button" class="btn btn-ghost btn-sm" data-cookie-settings>{cookies}</button>
    </div>
  </div>
</div>
</footer>""".format(
        home=url(lang),
        logo=logo("f"),
        tag=L(lang,
              "Free browser-based tools for images, PDFs, text and code. Your files are processed on your device and never uploaded.",
              "أدوات مجانية تعمل داخل المتصفح للصور وملفات PDF والنصوص والبرمجة. تُعالَج ملفاتك على جهازك ولا تُرفع أبدًا."),
        cimage=CATS["image"][0 if lang == "en" else 1],
        limage=links(["image-compressor", "image-resizer", "image-converter"]),
        cpdf=CATS["pdf"][0 if lang == "en" else 1],
        lpdf=links(["pdf-merge", "pdf-split", "images-to-pdf"]),
        ctext=L(lang, "Text & developer", "النصوص والمطوّرون"),
        ltext=links(["word-counter", "case-converter", "json-formatter", "lorem-ipsum-generator", "qr-code-generator", "password-generator"]),
        clegal=L(lang, "Kitbox", "Kitbox"),
        llegal=legal_html,
        rights=L(lang, "All rights reserved.", "جميع الحقوق محفوظة."),
        alt=alt_url(lang),
        altlang="ar" if lang == "en" else "en",
        altdir="rtl" if lang == "en" else "ltr",
        altlabel="العربية" if lang == "en" else "English",
        tdark=L(lang, "Switch to dark theme", "التبديل إلى المظهر الداكن"),
        tlight=L(lang, "Switch to light theme", "التبديل إلى المظهر الفاتح"),
        themelabel=L(lang, "Theme", "المظهر"),
        cookies=L(lang, "Cookie settings", "إعدادات ملفات تعريف الارتباط"),
    )


def consent_html(lang):
    return """<div class="consent" id="consent-banner" role="dialog" aria-modal="false" aria-labelledby="consent-title" hidden>
  <div class="consent-card">
    <h2 id="consent-title">{title}</h2>
    <p>{body}</p>
    <div class="consent-actions">
      <button type="button" class="btn btn-primary" data-consent="accept">{accept}</button>
      <button type="button" class="btn btn-secondary" data-consent="reject">{reject}</button>
      <button type="button" class="btn btn-ghost" data-consent="manage" aria-expanded="false">{manage}</button>
    </div>
    <div class="consent-prefs" data-consent-prefs hidden>
      <label class="check"><input type="checkbox" checked disabled> {nec}</label>
      <label class="check"><input type="checkbox" id="consent-analytics"> {ana}</label>
      <label class="check"><input type="checkbox" id="consent-ads"> {ads}</label>
      <div class="consent-actions">
        <button type="button" class="btn btn-primary btn-sm" data-consent="save">{save}</button>
      </div>
      <p class="hint">{note}</p>
    </div>
  </div>
</div>""".format(
        title=L(lang, "Your privacy choices", "خياراتك في الخصوصية"),
        body=L(lang,
               "Kitbox never uploads your files. We do use local storage for your theme and language preferences, and we would like to show advertising that keeps the tools free. Advertising and analytics storage stay switched off until you choose.",
               "لا يرفع Kitbox ملفاتك أبدًا. نستخدم التخزين المحلي لحفظ تفضيلات المظهر واللغة، ونودّ عرض إعلانات تبقي الأدوات مجانية. يظل تخزين الإعلانات والتحليلات معطّلًا حتى تختار."),
        accept=L(lang, "Accept all", "قبول الكل"),
        reject=L(lang, "Reject non-essential", "رفض غير الضروري"),
        manage=L(lang, "Manage preferences", "إدارة التفضيلات"),
        nec=L(lang, "Strictly necessary storage (always on)", "التخزين الضروري (مفعّل دائمًا)"),
        ana=L(lang, "Analytics storage", "تخزين التحليلات"),
        ads=L(lang, "Advertising storage", "تخزين الإعلانات"),
        save=L(lang, "Save preferences", "حفظ التفضيلات"),
        note=L(lang,
               "You can change this at any time from the Cookie settings link in the footer.",
               "يمكنك تغيير ذلك في أي وقت من رابط إعدادات ملفات تعريف الارتباط في التذييل."),
    )


def ad_slot(lang, label_id):
    return """<aside class="ad-slot" aria-label="{label}">
  <span class="ad-label">{label}</span>
  <ins class="adsbygoogle" style="display:block" data-ad-client="{pub}" data-ad-slot="{slot}"
    data-ad-format="auto" data-full-width-responsive="true" data-ad-region="{rid}"></ins>
</aside>""".format(label=L(lang, "Advertisement", "إعلان"), pub=ADSENSE_PUBLISHER_ID, slot=ADSENSE_SLOT, rid=label_id)


def head_html(lang, slug, title, desc, extra_json="", libs=(), tool_js=None, og_slug=None):
    canonical = ORIGIN + url(lang, slug)
    en_url = ORIGIN + url("en", slug)
    ar_url = ORIGIN + url("ar", slug)
    og = og_slug or (slug or "home")
    fonts_head = "Plus+Jakarta+Sans:wght@600;700;800" if lang == "en" else "Cairo:wght@600;700;800"
    fonts_body = "Inter:wght@400;500;600" if lang == "en" else "IBM+Plex+Sans+Arabic:wght@400;500;600"
    lib_tags = ""
    for lib in libs:
        src = {
            "pdf-lib": "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
            "jszip": "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
            "qrcode": "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js",
        }[lib]
        lib_tags += '<script defer crossorigin="anonymous" src="%s"></script>\n  ' % src
    tool_tag = ('<script defer src="/assets/js/tools/%s.js"></script>' % tool_js) if tool_js else ""

    return """<!DOCTYPE html>
<html lang="{lang}" dir="{dir}" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="{canonical}">
  <link rel="alternate" hreflang="en" href="{en_url}">
  <link rel="alternate" hreflang="ar" href="{ar_url}">
  <link rel="alternate" hreflang="x-default" href="{en_url}">
  <meta name="theme-color" content="#0C1222">
  <meta name="color-scheme" content="dark light">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Kitbox">
  <meta property="og:locale" content="{oglocale}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{origin}/assets/img/og/{og}.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{desc}">
  <meta name="twitter:image" content="{origin}/assets/img/og/{og}.png">
  <link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/assets/img/icons/icon-192.svg">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={fh}&amp;family={fb}&amp;display=swap" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={fh}&amp;family={fb}&amp;display=swap"></noscript>
  <link rel="stylesheet" href="/assets/css/style.css">
  <script>
    (function(){{try{{var t=localStorage.getItem("kitbox:theme");
    if(!t){{t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}}
    document.documentElement.setAttribute("data-theme",t);}}catch(e){{}}}})();
  </script>
  {extra_json}
  <script defer src="/assets/js/i18n.js"></script>
  <script defer src="/assets/js/app.js"></script>
  {lib_tags}{tool_tag}
</head>""".format(
        lang=lang, dir="rtl" if lang == "ar" else "ltr",
        title=esc(title), desc=esc(desc), canonical=canonical,
        en_url=en_url, ar_url=ar_url, origin=ORIGIN, og=og,
        oglocale="ar_AR" if lang == "ar" else "en_US",
        fh=fonts_head, fb=fonts_body,
        extra_json=extra_json, lib_tags=lib_tags, tool_tag=tool_tag,
    )


def jsonld(obj_text):
    return '<script type="application/ld+json">%s</script>' % obj_text


def json_str(s):
    import json
    return json.dumps(s, ensure_ascii=False)


def faq_jsonld(faq, lang):
    items = ",".join(
        '{"@type":"Question","name":%s,"acceptedAnswer":{"@type":"Answer","text":%s}}'
        % (json_str(q), json_str(a)) for q, a in faq
    )
    return ('{"@context":"https://schema.org","@type":"FAQPage","inLanguage":"%s","mainEntity":[%s]}'
            % (lang, items))


def breadcrumb_jsonld(lang, trail):
    items = ",".join(
        '{"@type":"ListItem","position":%d,"name":%s,"item":%s}'
        % (i + 1, json_str(name), json_str(ORIGIN + href))
        for i, (href, name) in enumerate(trail)
    )
    return '{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[%s]}' % items


def breadcrumbs_html(lang, trail):
    last = len(trail) - 1
    lis = ""
    for i, (href, name) in enumerate(trail):
        if i == last:
            lis += '<li><span aria-current="page">%s</span></li>' % name
        else:
            lis += '<li><a href="%s">%s</a></li>' % (href, name)
    return ('<nav class="breadcrumbs wrap" aria-label="%s"><ol>%s</ol></nav>'
            % (L(lang, "Breadcrumb", "مسار التنقل"), lis))


def faq_html(lang, faq, heading=None):
    h = heading or L(lang, "Frequently asked questions", "الأسئلة الشائعة")
    items = "".join(
        "<details><summary>%s</summary><p>%s</p></details>" % (esc(q), esc(a))
        for q, a in faq
    )
    return ('<section aria-labelledby="faq-h"><h2 id="faq-h">%s</h2><div class="faq">%s</div></section>'
            % (h, items))


def tool_card(lang, slug, as_li=True):
    d = tool(lang, slug)
    cat = CATS[CAT_OF[slug]][0 if lang == "en" else 1]
    keywords = " ".join([d["name"], d["card"], cat, slug.replace("-", " ")])
    inner = """<a class="tool-card" href="{href}">
  <span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{icon}</svg></span>
  <h3>{name}</h3>
  <p>{card}</p>
  <span class="cat">{cat}</span>
</a>""".format(href=url(lang, slug), icon=ICONS[slug], name=d["name"], card=d["card"], cat=cat)
    if not as_li:
        return inner
    return '<li data-slug="%s" data-keywords="%s">%s</li>' % (slug, esc(keywords), inner)


def noscript(lang):
    return ('<noscript><p class="noscript-note">%s</p></noscript>'
            % L(lang,
                "This tool runs entirely in your browser and needs JavaScript. Please enable JavaScript to use it — nothing is sent to a server either way.",
                "تعمل هذه الأداة داخل متصفحك بالكامل وتحتاج إلى جافاسكريبت. فعّل جافاسكريبت لاستخدامها، ولن يُرسل أي شيء إلى خادم في الحالتين."))


def page_shell(lang, slug, title, desc, body, extra_json="", libs=(), tool_js=None,
               tool_attr=None, og_slug=None, filename=None):
    head = head_html(lang, slug, title, desc, extra_json, libs, tool_js, og_slug)
    body_attr = ' data-tool="%s"' % tool_attr if tool_attr else ""
    html = """{head}
<body{battr}>
<a class="skip-link" href="#main">{skip}</a>
{header}
<main id="main">
{body}
</main>
{footer}
{consent}
</body>
</html>""".format(head=head, battr=body_attr,
                  skip=L(lang, "Skip to content", "تخطّي إلى المحتوى"),
                  header=header_html(lang, url(lang, slug)),
                  body=body, footer=footer_html(lang), consent=consent_html(lang))
    path = filename or (os.path.join(*( (["ar"] if lang == "ar" else []) + ([slug] if slug else []) + ["index.html"] )))
    write(path, html)
    return path


def write(relpath, text):
    full = os.path.join(ROOT, relpath)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(text)


# ---------------------------------------------------------------------------
# Home
# ---------------------------------------------------------------------------

HOME_FAQ_EN = [
    ("Are my files uploaded when I use Kitbox?",
     "No. Every tool processes your files inside your browser using standard web APIs such as canvas, FileReader and Web Crypto. There is no backend that receives files, which is why the Privacy Shield in the header can report zero bytes uploaded."),
    ("Is Kitbox really free?",
     "Yes. All twelve tools are free with no account, no trial and no watermark. The site is funded by advertising, which is clearly labelled and kept away from the tools themselves."),
    ("Do I need to create an account?",
     "No. There is nothing to sign up for. Your preferences — theme, language and recently used tools — are stored locally in your own browser and never sent anywhere."),
    ("Which browsers does Kitbox support?",
     "Any current version of Chrome, Edge, Firefox or Safari on desktop, Android or iOS. The tools rely on standard APIs that have been widely supported for several years."),
    ("Is there a file size limit?",
     "There is no server-imposed limit because there is no server. In practice your device's memory is the ceiling; files over 100 MB are skipped so the browser tab stays stable."),
    ("How does Kitbox make money if the tools are free?",
     "Through advertising. Ads are placed below or inside the written content, never over a tool, and advertising storage stays disabled until you consent."),
]

HOME_FAQ_AR = [
    ("هل تُرفع ملفاتي عند استخدام Kitbox؟",
     "لا. تعالج كل أداة ملفاتك داخل متصفحك عبر واجهات الويب القياسية مثل canvas وFileReader وWeb Crypto. لا يوجد خادم يستقبل الملفات، ولهذا يستطيع درع الخصوصية في الأعلى أن يعلن أن عدد البايتات المرفوعة صفر."),
    ("هل Kitbox مجاني فعلًا؟",
     "نعم. الأدوات الاثنتا عشرة مجانية بلا حساب ولا فترة تجريبية ولا علامة مائية. يُموَّل الموقع بالإعلانات الموسومة بوضوح والموضوعة بعيدًا عن الأدوات نفسها."),
    ("هل أحتاج إلى إنشاء حساب؟",
     "لا. لا يوجد تسجيل من الأساس. تُحفظ تفضيلاتك من مظهر ولغة وأدوات مستخدمة حديثًا داخل متصفحك فقط ولا تُرسل إلى أي مكان."),
    ("ما المتصفحات المدعومة؟",
     "أي إصدار حديث من Chrome أو Edge أو Firefox أو Safari على الحاسوب أو أندرويد أو iOS. تعتمد الأدوات على واجهات قياسية مدعومة منذ سنوات."),
    ("هل هناك حد لحجم الملف؟",
     "لا يوجد حد مفروض من خادم لأنه لا يوجد خادم. الحد العملي هو ذاكرة جهازك، وتُستبعد الملفات الأكبر من 100 ميجابايت للحفاظ على استقرار المتصفح."),
    ("كيف يحقق Kitbox دخلًا إذا كانت الأدوات مجانية؟",
     "عبر الإعلانات. تُوضع الإعلانات أسفل المحتوى المكتوب أو داخله ولا توضع فوق أي أداة، ويبقى تخزين الإعلانات معطّلًا حتى توافق."),
]


def build_home(lang):
    faq = HOME_FAQ_AR if lang == "ar" else HOME_FAQ_EN
    title = L(lang, "Kitbox — Free Online Tools That Never See Your Files",
              "Kitbox — أدوات مجانية أونلاين لا ترى ملفاتك")
    desc = L(lang,
             "Twelve free browser tools for images, PDF, text and developers. Compress, resize, convert, merge, split and generate — all processed on your device, never uploaded.",
             "اثنتا عشرة أداة مجانية داخل المتصفح للصور وملفات PDF والنصوص والمطوّرين: ضغط وتغيير حجم وتحويل ودمج وتقسيم وتوليد، وكلها تُعالَج على جهازك دون رفع.")

    website = ('{"@context":"https://schema.org","@type":"WebSite","name":"Kitbox",'
               '"url":%s,"inLanguage":"%s","description":%s,'
               '"potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint",'
               '"urlTemplate":%s},"query-input":"required name=q"}}'
               % (json_str(ORIGIN + url(lang)), lang, json_str(desc),
                  json_str(ORIGIN + url(lang, "tools") + "?q={q}")))
    org = ('{"@context":"https://schema.org","@type":"Organization","name":"Kitbox","url":%s,'
           '"logo":%s,"description":%s,"contactPoint":{"@type":"ContactPoint",'
           '"contactType":"customer support","email":%s,"availableLanguage":["en","ar"]}}'
           % (json_str(ORIGIN + "/"), json_str(ORIGIN + "/assets/img/logo.svg"),
              json_str(L(lang, "Privacy-first browser tools for images, PDF, text and developers.",
                         "أدوات متصفح تحترم الخصوصية للصور وملفات PDF والنصوص والمطوّرين.")),
              json_str(CONTACT_EMAIL)))
    extra = jsonld(website) + "\n  " + jsonld(org) + "\n  " + jsonld(faq_jsonld(faq, lang))

    cards_by_cat = {}
    for slug, cat in TOOL_ORDER:
        cards_by_cat.setdefault(cat, []).append(slug)

    groups = ""
    for cat in ["image", "pdf", "text", "dev", "security"]:
        slugs = cards_by_cat.get(cat, [])
        if not slugs:
            continue
        groups += ('<div data-search-group><h3>%s</h3><ul class="tool-grid">%s</ul></div>'
                   % (CATS[cat][0 if lang == "en" else 1],
                      "".join(tool_card(lang, s) for s in slugs)))

    defaults = ["image-compressor", "pdf-merge", "qr-code-generator", "password-generator"]
    most_used = "".join(tool_card(lang, s) for s in defaults)

    why = [
        (L(lang, "Private by design", "خصوصية بالتصميم"),
         L(lang, "Files are read, processed and saved on your device. Kitbox has no upload endpoint at all.",
           "تُقرأ الملفات وتُعالَج وتُحفظ على جهازك. لا يملك Kitbox أي نقطة رفع من الأساس.")),
        (L(lang, "100% free", "مجاني 100%"),
         L(lang, "Every tool, every feature, no watermark and no paid tier hiding the useful options.",
           "كل أداة وكل ميزة بلا علامة مائية وبلا باقة مدفوعة تخفي الخيارات المفيدة.")),
        (L(lang, "No sign-up", "بدون تسجيل"),
         L(lang, "No account, no email address, no verification step. Open a tool and use it.",
           "لا حساب ولا بريد إلكتروني ولا خطوة تحقق. افتح الأداة واستخدمها.")),
        (L(lang, "Lightweight and fast", "خفيف وسريع"),
         L(lang, "Static pages, deferred scripts and libraries that load only on the page that needs them.",
           "صفحات ثابتة ونصوص برمجية مؤجّلة ومكتبات تُحمَّل فقط في الصفحة التي تحتاجها.")),
        (L(lang, "Accessible", "متاح للجميع"),
         L(lang, "Full keyboard support, visible focus, live status messages and tested right-to-left layouts.",
           "دعم كامل للوحة المفاتيح وتركيز مرئي ورسائل حالة حية وتخطيطات مختبرة من اليمين إلى اليسار.")),
    ]
    why_html = "".join('<li class="card"><h3>%s</h3><p>%s</p></li>' % (t, d) for t, d in why)

    steps = [
        (L(lang, "Choose a tool", "اختر أداة"),
         L(lang, "Pick one of the twelve tools from the grid, the search box or the footer.",
           "اختر واحدة من الأدوات الاثنتي عشرة من الشبكة أو مربع البحث أو التذييل.")),
        (L(lang, "Add your file or text", "أضف ملفك أو نصك"),
         L(lang, "Drag and drop, browse, or paste. The file is opened directly from your disk into the page.",
           "اسحب وأفلت أو اختر من جهازك أو الصق. يُفتح الملف من قرصك مباشرة داخل الصفحة.")),
        (L(lang, "Download the result", "نزّل النتيجة"),
         L(lang, "Processing happens on your device and the result is saved straight back to it.",
           "تجري المعالجة على جهازك وتُحفظ النتيجة مباشرة عليه.")),
    ]
    steps_html = "".join("<li><h3>%s</h3><p>%s</p></li>" % (t, d) for t, d in steps)

    body = """<section class="hero">
  <div class="wrap hero-inner">
    <div>
      <ul class="chips">
        <li class="chip">{sh}{c1}</li>
        <li class="chip">{sh}{c2}</li>
        <li class="chip">{sh}{c3}</li>
      </ul>
      <h1>{h1}</h1>
      <p class="lead">{lead}</p>
      <div class="search-field">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <label class="sr-only" for="tool-search">{searchlabel}</label>
        <input type="search" id="tool-search" data-tool-search="#all-tools .tool-grid" aria-describedby="search-count" placeholder="{searchph}" autocomplete="off">
      </div>
      <p class="hint" id="search-count" role="status" aria-live="polite"></p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#all-tools">{cta1}</a>
        <a class="btn btn-secondary" href="{toolsurl}">{cta2}</a>
      </div>
    </div>
    <div class="hero-art">{art}</div>
  </div>
</section>

{ad1}

<section class="wrap" id="most-used" aria-labelledby="mu-h">
  <div class="section-head"><h2 id="mu-h">{muh}</h2><p>{mup}</p></div>
  <ul class="tool-grid">{mostused}</ul>
</section>

<section class="wrap" id="all-tools" aria-labelledby="at-h">
  <div class="section-head"><h2 id="at-h">{ath}</h2><p>{atp}</p></div>
  {groups}
</section>

{ad2}

<section class="wrap" aria-labelledby="why-h">
  <div class="section-head"><h2 id="why-h">{whyh}</h2></div>
  <ul class="feature-grid">{why}</ul>
</section>

<section class="wrap" aria-labelledby="how-h">
  <div class="section-head"><h2 id="how-h">{howh}</h2></div>
  <ol class="steps">{steps}</ol>
</section>

<section class="wrap">
  {faq}
</section>
""".format(
        sh=SHIELD_ICON,
        c1=L(lang, "No upload", "بدون رفع"),
        c2=L(lang, "Free", "مجاني"),
        c3=L(lang, "No sign-up", "بدون تسجيل"),
        h1=L(lang, "Free online tools that never see your files",
             "أدوات مجانية أونلاين لا ترى ملفاتك أبدًا"),
        lead=L(lang,
               "Compress, resize and convert images, merge and split PDFs, generate QR codes and strong passwords, count words and format JSON — every one of them runs inside your browser, so nothing is ever uploaded.",
               "اضغط الصور وغيّر أحجامها وحوّل صيغها، وادمج ملفات PDF وقسّمها، وأنشئ رموز QR وكلمات مرور قوية، وعُدّ الكلمات ونسّق JSON — كل ذلك داخل متصفحك دون رفع أي ملف."),
        searchlabel=L(lang, "Search tools", "البحث في الأدوات"),
        searchph=L(lang, "Search tools, e.g. compress, PDF, QR…", "ابحث عن أداة، مثل ضغط أو PDF أو QR…"),
        cta1=L(lang, "Explore all tools", "استعرض كل الأدوات"),
        cta2=L(lang, "Open the tools directory", "افتح دليل الأدوات"),
        toolsurl=url(lang, "tools"),
        art=HERO_ART % L(lang, "A shield with a checkmark representing local, private file processing",
                         "درع يحمل علامة صح يرمز إلى معالجة الملفات محليًا وبخصوصية"),
        ad1=ad_slot(lang, "home-top"),
        ad2=ad_slot(lang, "home-mid"),
        muh=L(lang, "Most used tools", "الأدوات الأكثر استخدامًا"),
        mup=L(lang, "This list adapts to the tools you open, using preferences stored only in your browser.",
              "تتكيّف هذه القائمة مع الأدوات التي تفتحها اعتمادًا على تفضيلات محفوظة في متصفحك فقط."),
        mostused=most_used,
        ath=L(lang, "All Kitbox tools", "جميع أدوات Kitbox"),
        atp=L(lang, "Twelve tools across five categories. Use the search box above to filter them instantly.",
              "اثنتا عشرة أداة ضمن خمس فئات. استخدم مربع البحث في الأعلى لتصفيتها فورًا."),
        groups=groups,
        whyh=L(lang, "Why people choose Kitbox", "لماذا يختار الناس Kitbox"),
        why=why_html,
        howh=L(lang, "How it works", "كيف يعمل"),
        steps=steps_html,
        faq=faq_html(lang, faq),
    )
    page_shell(lang, "", title, desc, body, extra_json=extra)


# ---------------------------------------------------------------------------
# Tool pages
# ---------------------------------------------------------------------------

def build_tool(lang, slug):
    d = tool(lang, slug)
    home_name = L(lang, "Home", "الرئيسية")
    tools_name = L(lang, "All tools", "كل الأدوات")
    trail = [(url(lang), home_name), (url(lang, "tools"), tools_name), (url(lang, slug), d["name"])]

    app = ('{"@context":"https://schema.org","@type":"SoftwareApplication","name":%s,'
           '"description":%s,"applicationCategory":"UtilitiesApplication",'
           '"operatingSystem":"Any (web browser)","url":%s,"inLanguage":"%s","isAccessibleForFree":true,'
           '"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},'
           '"publisher":{"@type":"Organization","name":"Kitbox","url":%s}}'
           % (json_str(d["name"]), json_str(d["desc"]), json_str(ORIGIN + url(lang, slug)),
              lang, json_str(ORIGIN + "/")))
    extra = (jsonld(app) + "\n  " + jsonld(breadcrumb_jsonld(lang, trail))
             + "\n  " + jsonld(faq_jsonld(d["faq"], lang)))

    howto = "".join("<li>%s</li>" % s for s in d["howto"])
    related = "".join('<li><a href="%s">%s</a></li>' % (url(lang, r), tool(lang, r)["name"])
                      for r in RELATED[slug])

    article = d["article"].strip()
    # Split the article so an ad can sit inside it, after the second H2 block.
    parts = re.split(r"(?=<h2>)", article)
    cut = min(3, max(1, len(parts) - 1))
    article_a = "".join(parts[:cut])
    article_b = "".join(parts[cut:])

    body = """{crumbs}
<div class="wrap-tool tool-main">
  <h1>{h1}</h1>
  <p class="lead muted">{benefit}</p>
  <ul class="chips">
    <li class="chip">{sh}{c1}</li>
    <li class="chip">{sh}{c2}</li>
    <li class="chip">{sh}{c3}</li>
  </ul>
  {noscript}
  {workspace}

  {ad1}

  <section aria-labelledby="how-h">
    <h2 id="how-h">{howh}</h2>
    <ol>{howto}</ol>
  </section>

  <article class="article">
    {article_a}
    {ad2}
    {article_b}
  </article>

  {faq}

  <section class="related mt-3" aria-labelledby="rel-h">
    <h2 id="rel-h">{relh}</h2>
    <ul>{related}</ul>
  </section>

  {ad3}
</div>""".format(
        crumbs=breadcrumbs_html(lang, trail),
        h1=d["h1"], benefit=d["benefit"],
        sh=SHIELD_ICON,
        c1=L(lang, "No upload", "بدون رفع"),
        c2=L(lang, "Free", "مجاني"),
        c3=L(lang, "No sign-up", "بدون تسجيل"),
        noscript=noscript(lang),
        workspace=WORKSPACES[slug](lambda en, ar: L(lang, en, ar)),
        ad1=ad_slot(lang, slug + "-below"),
        howh=L(lang, "How to use this tool", "كيفية استخدام هذه الأداة"),
        howto=howto,
        article_a=article_a,
        ad2=ad_slot(lang, slug + "-inline"),
        article_b=article_b,
        faq=faq_html(lang, d["faq"]),
        relh=L(lang, "Related tools", "أدوات ذات صلة"),
        related=related,
        ad3=ad_slot(lang, slug + "-end"),
    )

    page_shell(lang, slug, d["title"], d["desc"], body, extra_json=extra,
               libs=LIBS.get(slug, ()), tool_js=slug, tool_attr=slug)


# ---------------------------------------------------------------------------
# Tools directory
# ---------------------------------------------------------------------------

def build_tools_dir(lang):
    title = L(lang, "All Tools — 12 Free Browser Utilities | Kitbox",
              "كل الأدوات — 12 أداة مجانية داخل المتصفح | Kitbox")
    desc = L(lang,
             "Browse all twelve Kitbox tools for images, PDF, text, developers and security. Every tool is free, needs no account, and processes your files locally.",
             "تصفّح أدوات Kitbox الاثنتي عشرة للصور وملفات PDF والنصوص والمطوّرين والأمان. كل أداة مجانية ولا تحتاج حسابًا وتعالج ملفاتك محليًا.")
    trail = [(url(lang), L(lang, "Home", "الرئيسية")), (url(lang, "tools"), L(lang, "All tools", "كل الأدوات"))]

    by_cat = {}
    for slug, cat in TOOL_ORDER:
        by_cat.setdefault(cat, []).append(slug)

    sections = ""
    for cat in ["image", "pdf", "text", "dev", "security"]:
        slugs = by_cat.get(cat, [])
        if not slugs:
            continue
        sections += ('<section data-search-group aria-labelledby="c-%s"><h2 id="c-%s">%s</h2>'
                     '<ul class="tool-grid">%s</ul></section>'
                     % (cat, cat, CATS[cat][0 if lang == "en" else 1],
                        "".join(tool_card(lang, s) for s in slugs)))

    extra = jsonld(breadcrumb_jsonld(lang, trail))
    body = """{crumbs}
<div class="wrap">
  <div class="page-head">
    <h1>{h1}</h1>
    <p>{lead}</p>
    <div class="search-field">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <label class="sr-only" for="dir-search">{slabel}</label>
      <input type="search" id="dir-search" data-tool-search="#tool-directory .tool-grid" aria-describedby="dir-count" placeholder="{sph}" autocomplete="off">
    </div>
    <p class="hint" id="dir-count" role="status" aria-live="polite"></p>
  </div>
  <div id="tool-directory">{sections}</div>
  {ad}
</div>""".format(
        crumbs=breadcrumbs_html(lang, trail),
        h1=L(lang, "All Kitbox tools", "جميع أدوات Kitbox"),
        lead=L(lang, "Twelve browser-based utilities, grouped by what they do. Nothing you open here uploads your files.",
               "اثنتا عشرة أداة تعمل داخل المتصفح، مرتبة حسب وظيفتها. لا ترفع أي أداة منها ملفاتك."),
        slabel=L(lang, "Search tools", "البحث في الأدوات"),
        sph=L(lang, "Filter tools…", "تصفية الأدوات…"),
        sections=sections,
        ad=ad_slot(lang, "tools-dir"),
    )
    page_shell(lang, "tools", title, desc, body, extra_json=extra)


# ---------------------------------------------------------------------------
# Static pages
# ---------------------------------------------------------------------------

def simple_page(lang, slug, title, desc, h1, lead, sections, extra_body=""):
    trail = [(url(lang), L(lang, "Home", "الرئيسية")), (url(lang, slug), h1)]
    extra = jsonld(breadcrumb_jsonld(lang, trail))
    sec_html = ""
    for head, html in sections:
        sec_html += "<h2>%s</h2>\n%s\n" % (head, html)
    body = """{crumbs}
<div class="wrap">
  <div class="page-head prose-narrow">
    <h1>{h1}</h1>
    <p>{lead}</p>
  </div>
  <article class="article prose-narrow">
  {sections}
  </article>
  {extra}
</div>""".format(crumbs=breadcrumbs_html(lang, trail), h1=h1, lead=lead, sections=sec_html, extra=extra_body)
    page_shell(lang, slug, title, desc, body, extra_json=extra)


def build_about(lang):
    if lang == "en":
        sections = [
            ("What Kitbox is", """
<p>Kitbox is a collection of twelve everyday utilities for images, PDF documents, text and code. Each one is a normal web page that does its work using the capabilities already built into your browser: the canvas image encoder, the File API, the Web Crypto random generator, and two small open-source libraries loaded from a public CDN.</p>
<p>The project exists because the obvious alternative — uploading a file to a stranger's server so it can be compressed or merged — asks for a level of trust that most tasks do not justify. Compressing a holiday photo should not involve a data processing agreement.</p>"""),
            ("The privacy promise, precisely stated", """
<p>Your files are not uploaded. There is no upload endpoint, no queue, no temporary storage and no retention window, because Kitbox is a static site with no backend that could receive a file.</p>
<p>To be exact about what does travel over the network: the HTML, CSS and JavaScript of the page itself; web fonts from Google Fonts; three pinned open-source libraries (pdf-lib 1.17.1, JSZip 3.10.1 and qrcode-generator 1.4.4) from cdnjs, each loaded only on the pages that need it; and, if you consent, Google AdSense. None of those receive your documents, images or text.</p>"""),
            ("How Kitbox is funded", """
<p>Advertising, and nothing else. There is no paid tier, no data sale and no affiliate tracking embedded in the tools. Ads appear below the tool and inside the written content, never on top of a workspace, never as a pop-up and never as a sticky overlay. Advertising storage stays disabled until you choose to allow it.</p>"""),
            ("Design principles", """
<ul>
  <li><strong>Local first.</strong> If a feature cannot be built without a server, it is not built.</li>
  <li><strong>Honest claims.</strong> Nothing on this site claims a capability the code does not deliver.</li>
  <li><strong>Accessible by default.</strong> Keyboard support, visible focus, live status messages and tested right-to-left layouts are requirements, not extras.</li>
  <li><strong>Fast.</strong> Static HTML, deferred scripts, no framework, and libraries loaded only where they are used.</li>
  <li><strong>Bilingual.</strong> Every page exists in English and Arabic, written separately rather than machine translated.</li>
</ul>"""),
            ("What Kitbox deliberately does not do", """
<p>There is no optical character recognition, no AI image editing and no cloud storage. Each of those would require either a very large download or a server, and the second option would break the promise the whole project is built on.</p>"""),
            ("Get in touch", """
<p>Questions, bug reports and tool suggestions are welcome through the <a href="/contact/">contact page</a>.</p>"""),
        ]
        return simple_page(lang, "about",
                           "About Kitbox — Privacy-First Browser Tools",
                           "Kitbox is a free, bilingual collection of browser-based tools for images, PDF, text and code. Learn how the local-processing privacy model works and how the site is funded.",
                           "About Kitbox",
                           "A small, deliberately simple set of tools built around one rule: your files stay on your device.",
                           sections)
    sections = [
        ("ما هو Kitbox", """
<p>Kitbox مجموعة من اثنتي عشرة أداة يومية للصور ومستندات PDF والنصوص والبرمجة. كل أداة صفحة ويب عادية تؤدي عملها بالاعتماد على الإمكانات المدمجة أصلًا في متصفحك: مرمّز الصور في لوحة الرسم، وواجهة الملفات، ومولّد العشوائية التشفيري، ومكتبتين صغيرتين مفتوحتي المصدر تُحمَّلان من شبكة توزيع عامة.</p>
<p>وُجد المشروع لأن البديل المعتاد — رفع ملف إلى خادم مجهول ليُضغط أو يُدمج — يطلب قدرًا من الثقة لا تبرره معظم المهام. ضغط صورة من رحلة لا ينبغي أن يستلزم اتفاقية لمعالجة البيانات.</p>"""),
        ("وعد الخصوصية بدقة", """
<p>ملفاتك لا تُرفع. لا توجد نقطة رفع ولا طابور ولا تخزين مؤقت ولا مدة احتفاظ، لأن Kitbox موقع ثابت بلا خادم خلفي يمكنه استقبال ملف.</p>
<p>وللدقة في ما ينتقل فعلًا عبر الشبكة: ملفات HTML وCSS وجافاسكريبت الخاصة بالصفحة، وخطوط الويب من Google Fonts، وثلاث مكتبات مفتوحة المصدر بإصدارات مثبّتة (pdf-lib 1.17.1 وJSZip 3.10.1 وqrcode-generator 1.4.4) من cdnjs تُحمَّل كل منها في صفحتها فقط، ثم Google AdSense إذا وافقت. ولا يستقبل أي من هؤلاء مستنداتك أو صورك أو نصوصك.</p>"""),
        ("كيف يُموَّل Kitbox", """
<p>بالإعلانات فقط. لا توجد باقة مدفوعة ولا بيع بيانات ولا تتبع تسويقي مضمّن في الأدوات. تظهر الإعلانات أسفل الأداة وداخل المحتوى المكتوب، ولا تظهر فوق مساحة العمل ولا كنوافذ منبثقة ولا كطبقات لاصقة. ويبقى تخزين الإعلانات معطّلًا حتى تسمح به.</p>"""),
        ("مبادئ التصميم", """
<ul>
  <li><strong>المحلي أولًا.</strong> إذا تعذّر بناء ميزة دون خادم فلن تُبنى.</li>
  <li><strong>ادعاءات صادقة.</strong> لا يدّعي أي شيء في هذا الموقع قدرة لا يحققها الكود.</li>
  <li><strong>إتاحة افتراضية.</strong> دعم لوحة المفاتيح والتركيز المرئي ورسائل الحالة الحية والتخطيطات من اليمين إلى اليسار متطلبات لا إضافات.</li>
  <li><strong>سرعة.</strong> HTML ثابت ونصوص مؤجّلة وبلا إطار عمل ومكتبات تُحمَّل حيث تُستخدم فقط.</li>
  <li><strong>ثنائية اللغة.</strong> كل صفحة موجودة بالإنجليزية والعربية، مكتوبة بشكل مستقل لا مترجمة آليًا.</li>
</ul>"""),
        ("ما لا يفعله Kitbox عمدًا", """
<p>لا يوجد تعرف ضوئي على الحروف ولا تحرير صور بالذكاء الاصطناعي ولا تخزين سحابي. كل واحدة من هذه الميزات تتطلب إما تنزيلًا ضخمًا أو خادمًا، والخيار الثاني يخالف الوعد الذي بُني عليه المشروع كله.</p>"""),
        ("تواصل معنا", """
<p>نرحّب بالأسئلة وبلاغات الأخطاء واقتراحات الأدوات عبر <a href="/ar/contact/">صفحة الاتصال</a>.</p>"""),
    ]
    return simple_page(lang, "about",
                       "عن Kitbox — أدوات متصفح تحترم الخصوصية",
                       "Kitbox مجموعة مجانية ثنائية اللغة من الأدوات التي تعمل داخل المتصفح للصور وملفات PDF والنصوص والبرمجة. تعرّف على نموذج المعالجة المحلية وكيفية تمويل الموقع.",
                       "عن Kitbox",
                       "مجموعة صغيرة ومبسّطة عمدًا من الأدوات مبنية على قاعدة واحدة: ملفاتك تبقى على جهازك.",
                       sections)


def build_contact(lang):
    form = """
<form class="workspace" id="contact-form" action="mailto:{email}" method="post" enctype="text/plain">
  <div class="field">
    <label for="cf-name">{name}</label>
    <input type="text" id="cf-name" name="name" autocomplete="name" required>
  </div>
  <div class="field">
    <label for="cf-email">{mail}</label>
    <input type="email" id="cf-email" name="email" autocomplete="email" required>
  </div>
  <div class="field">
    <label for="cf-subject">{subj}</label>
    <select id="cf-subject" name="subject">
      <option>{s1}</option><option>{s2}</option><option>{s3}</option><option>{s4}</option>
    </select>
  </div>
  <div class="field">
    <label for="cf-message">{msg}</label>
    <textarea id="cf-message" name="message" rows="7" required></textarea>
  </div>
  <p class="hint">{note}</p>
  <div class="actions">
    <button type="submit" class="btn btn-primary">{send}</button>
    <a class="btn btn-secondary" href="mailto:{email}" data-contact-email>{email}</a>
  </div>
</form>""".format(
        email=CONTACT_EMAIL,
        name=L(lang, "Your name", "اسمك"),
        mail=L(lang, "Your email address", "بريدك الإلكتروني"),
        subj=L(lang, "Subject", "الموضوع"),
        s1=L(lang, "General question", "سؤال عام"),
        s2=L(lang, "Bug report", "بلاغ عن خطأ"),
        s3=L(lang, "Tool suggestion", "اقتراح أداة"),
        s4=L(lang, "Privacy question", "سؤال عن الخصوصية"),
        msg=L(lang, "Message", "الرسالة"),
        note=L(lang,
               "Kitbox is a static site with no backend, so this form opens your own email application with the message prefilled. Nothing is submitted to a Kitbox server.",
               "Kitbox موقع ثابت بلا خادم خلفي، لذا يفتح هذا النموذج تطبيق البريد لديك مع رسالة جاهزة. ولا يُرسل أي شيء إلى خادم تابع لـ Kitbox."),
        send=L(lang, "Open in my email app", "فتح في تطبيق البريد"),
    )

    if lang == "en":
        sections = [
            ("How to reach us", """
<p>Email is the only channel, and it goes to a person rather than a ticket queue. Write in English or Arabic; both are read.</p>
<p>Direct address: <a href="mailto:%s" data-contact-email>%s</a></p>""" % (CONTACT_EMAIL, CONTACT_EMAIL)),
            ("What to include in a bug report", """
<ul>
  <li>The exact tool page you were using.</li>
  <li>Your browser and version, and whether you are on desktop or mobile.</li>
  <li>What you did, what you expected, and what happened instead.</li>
  <li>The file type and approximate size — please do not attach the file itself unless we ask.</li>
</ul>
<p>Because nothing is uploaded, there are no server logs to inspect on our side, so a clear description genuinely matters.</p>"""),
            ("Response time", """
<p>Kitbox is run by a small team. Most messages are answered within a few working days. Security reports are prioritised.</p>"""),
            ("Privacy and advertising questions", """
<p>Questions about data handling, consent or advertising are welcome. The <a href="/privacy/">Privacy Policy</a> and <a href="/cookies/">Cookie Policy</a> cover most of them, and you can change your consent choices at any time with the Cookie settings link in the footer.</p>"""),
        ]
        return simple_page(lang, "contact",
                           "Contact Kitbox — Questions, Bugs & Suggestions",
                           "Get in touch with the Kitbox team about a bug, a tool suggestion or a privacy question. Email is read in both English and Arabic.",
                           "Contact Kitbox",
                           "Found a bug, want a new tool, or have a question about how your data is handled? Write to us.",
                           sections, extra_body='<div class="wrap-tool">%s</div>' % form)

    sections = [
        ("كيف تتواصل معنا", """
<p>البريد الإلكتروني هو القناة الوحيدة، ويصل إلى شخص حقيقي لا إلى طابور تذاكر. اكتب بالعربية أو الإنجليزية، فكلاهما يُقرأ.</p>
<p>العنوان المباشر: <a href="mailto:%s" data-contact-email>%s</a></p>""" % (CONTACT_EMAIL, CONTACT_EMAIL)),
        ("ما الذي تضمّنه في بلاغ الخطأ", """
<ul>
  <li>صفحة الأداة التي كنت تستخدمها بالتحديد.</li>
  <li>اسم المتصفح وإصداره، وهل كنت على حاسوب أم هاتف.</li>
  <li>ما الذي فعلته، وما الذي توقعته، وما الذي حدث فعلًا.</li>
  <li>نوع الملف وحجمه التقريبي — ويُرجى عدم إرفاق الملف نفسه ما لم نطلب ذلك.</li>
</ul>
<p>ولأن لا شيء يُرفع، لا توجد سجلات خادم لدينا لفحصها، لذا فإن الوصف الواضح مهم فعلًا.</p>"""),
        ("زمن الرد", """
<p>يدير Kitbox فريق صغير. تُجاب معظم الرسائل خلال أيام عمل قليلة، وتُعطى بلاغات الأمان أولوية.</p>"""),
        ("أسئلة الخصوصية والإعلانات", """
<p>نرحّب بالأسئلة حول التعامل مع البيانات أو الموافقة أو الإعلانات. وتغطي <a href="/ar/privacy/">سياسة الخصوصية</a> و<a href="/ar/cookies/">سياسة ملفات تعريف الارتباط</a> معظمها، ويمكنك تغيير خياراتك في أي وقت من رابط إعدادات ملفات تعريف الارتباط في التذييل.</p>"""),
    ]
    return simple_page(lang, "contact",
                       "اتصل بـ Kitbox — أسئلة وبلاغات واقتراحات",
                       "تواصل مع فريق Kitbox بخصوص خطأ برمجي أو اقتراح أداة جديدة أو سؤال عن الخصوصية والإعلانات. تُقرأ الرسائل بالعربية والإنجليزية ويُرد عليها خلال أيام قليلة.",
                       "اتصل بنا",
                       "وجدت خطأً أو تريد أداة جديدة أو لديك سؤال عن طريقة التعامل مع بياناتك؟ راسلنا.",
                       sections, extra_body='<div class="wrap-tool">%s</div>' % form)


def build_privacy(lang):
    if lang == "en":
        sections = [
            ("Summary", """
<p>Kitbox does not upload, store or process your files on a server. All file and text processing happens inside your browser. The data that is involved in running this website is limited to what your browser stores locally for your preferences and, if you consent, what Google AdSense and its partners collect to serve advertising.</p>"""),
            ("Local processing", """
<p>Every tool on this site reads your file directly from your device using standard browser APIs, processes it in memory, and writes the result back to your device. There is no upload endpoint in this project. Kitbox is deployed as a static site, which means there is no application server, no database and no file storage that could receive your content.</p>
<p>Three third-party libraries are used, each pinned to a specific version and loaded from the cdnjs content delivery network: pdf-lib 1.17.1 for PDF operations, JSZip 3.10.1 for creating ZIP archives, and qrcode-generator 1.4.4 for QR patterns. They execute as ordinary JavaScript inside your browser and do not transmit your data. Loading them does reveal your IP address and browser user agent to the CDN operator, as any web request does.</p>"""),
            ("Information stored on your device", """
<p>Kitbox uses your browser's local storage for a small number of preferences. Every access is wrapped in error handling, so blocking storage does not break the site.</p>
<ul>
  <li><strong>Theme</strong> — whether you chose light or dark.</li>
  <li><strong>Consent choice</strong> — your advertising and analytics decision, with a timestamp.</li>
  <li><strong>Recently used tools</strong> — used to personalise the Most used tools section on the home page.</li>
  <li><strong>Language suggestion dismissal</strong> — so the bilingual banner does not reappear.</li>
</ul>
<p>None of this is transmitted to Kitbox. You can clear it at any time through your browser's site-data controls.</p>"""),
            ("Advertising and Google AdSense", """
<p>This site is funded by Google AdSense. When you consent to advertising storage, the AdSense script is loaded and Google — and its advertising partners — may set cookies or similar identifiers on your device and process data such as your IP address, approximate location, device and browser information, and your interaction with ads. This may be used for ad selection, measurement and, where permitted, personalisation.</p>
<p>Google's handling of this data is described in <a href="https://policies.google.com/technologies/partner-sites" rel="noopener nofollow" target="_blank">How Google uses information from sites that use our services</a>. You can review and adjust Google's own advertising settings at <a href="https://adssettings.google.com" rel="noopener nofollow" target="_blank">adssettings.google.com</a>.</p>
<p>Until you make a choice, Google Consent Mode v2 is set to deny ad storage, ad user data, ad personalisation and analytics storage, and the AdSense script is not loaded.</p>"""),
            ("Analytics", """
<p>No analytics product is currently active on Kitbox. The consent interface includes an analytics category so that, if one is ever added, your existing preference is respected from the first page view rather than applied retroactively.</p>"""),
            ("Consent management", """
<p>On your first visit a consent banner offers three options: accept all, reject non-essential, or manage preferences individually. Your choice is stored locally and applied through Google Consent Mode v2. You can reopen the banner and change your decision at any time using the Cookie settings link in the footer of every page.</p>"""),
            ("Your rights under the GDPR", """
<p>If you are in the European Economic Area, the United Kingdom or Switzerland, you have the right to access, rectify, erase, restrict and port your personal data, and to object to processing. Because Kitbox holds no personal data on any server, requests about data collected through advertising are best directed to Google, which acts as a controller for that processing. For anything stored on your own device, clearing your browser's site data for this domain removes it completely and immediately.</p>
<p>You also have the right to lodge a complaint with your national supervisory authority.</p>"""),
            ("Your rights under the CCPA and CPRA", """
<p>If you are a California resident, you have the right to know what personal information is collected, to request deletion, to correct inaccurate information, and to opt out of the sale or sharing of personal information. Kitbox does not sell personal information. Advertising partners may process identifiers in ways that California law treats as sharing for cross-context behavioural advertising; choosing <em>Reject non-essential</em> prevents the advertising script from loading and is the opt-out mechanism on this site.</p>"""),
            ("Children", """
<p>Kitbox is not directed at children under 13 and does not knowingly collect information from them.</p>"""),
            ("Security", """
<p>The site is served over HTTPS with security headers including X-Content-Type-Options, Referrer-Policy, X-Frame-Options and Permissions-Policy. Because your files never reach a server, the most significant category of risk in a file-processing service does not apply here.</p>"""),
            ("Changes and contact", """
<p>Material changes to this policy will be reflected on this page with an updated date. For any privacy question, write to <a href="mailto:%s" data-contact-email>%s</a> or use the <a href="/contact/">contact page</a>.</p>
<p>This document explains what the implementation actually does. It is not legal advice, and it does not claim that using this site alone makes any operator compliant in every jurisdiction.</p>""" % (CONTACT_EMAIL, CONTACT_EMAIL)),
        ]
        return simple_page(lang, "privacy",
                           "Privacy Policy — How Kitbox Handles Data",
                           "How Kitbox handles your data: files are processed locally and never uploaded. Details on local storage, Google AdSense, consent, GDPR and CCPA rights.",
                           "Privacy Policy",
                           "Last updated: " + LASTMOD + ". This policy explains exactly what Kitbox does and does not do with data.",
                           sections)

    sections = [
        ("ملخص", """
<p>لا يرفع Kitbox ملفاتك ولا يخزّنها ولا يعالجها على خادم. تجري كل معالجة للملفات والنصوص داخل متصفحك. والبيانات المرتبطة بتشغيل هذا الموقع تقتصر على ما يخزّنه متصفحك محليًا لحفظ تفضيلاتك، وعلى ما تجمعه Google AdSense وشركاؤها لعرض الإعلانات في حال وافقت.</p>"""),
        ("المعالجة المحلية", """
<p>تقرأ كل أداة في هذا الموقع ملفك من جهازك مباشرة عبر واجهات المتصفح القياسية، وتعالجه في الذاكرة، ثم تكتب النتيجة على جهازك. لا توجد نقطة رفع في هذا المشروع. ويُنشر Kitbox كموقع ثابت، أي لا يوجد خادم تطبيقات ولا قاعدة بيانات ولا تخزين ملفات يمكنه استقبال محتواك.</p>
<p>تُستخدم ثلاث مكتبات خارجية، كل منها بإصدار مثبّت ومحمّلة من شبكة cdnjs: مكتبة pdf-lib 1.17.1 لعمليات PDF، وJSZip 3.10.1 لإنشاء أرشيفات ZIP، وqrcode-generator 1.4.4 لأنماط QR. وتُنفَّذ كجافاسكريبت عادية داخل متصفحك ولا ترسل بياناتك. غير أن تحميلها يكشف عنوان IP ومعرّف المتصفح لمشغّل الشبكة، كما في أي طلب ويب.</p>"""),
        ("المعلومات المخزّنة على جهازك", """
<p>يستخدم Kitbox التخزين المحلي في متصفحك لعدد صغير من التفضيلات، ويُحاط كل وصول بمعالجة للأخطاء بحيث لا يؤدي حجب التخزين إلى تعطّل الموقع.</p>
<ul>
  <li><strong>المظهر</strong> — سواء اخترت الفاتح أو الداكن.</li>
  <li><strong>خيار الموافقة</strong> — قرارك بشأن الإعلانات والتحليلات مع ختم زمني.</li>
  <li><strong>الأدوات المستخدمة حديثًا</strong> — لتخصيص قسم الأدوات الأكثر استخدامًا في الصفحة الرئيسية.</li>
  <li><strong>إخفاء اقتراح اللغة</strong> — حتى لا يظهر الشريط ثنائي اللغة مجددًا.</li>
</ul>
<p>لا يُرسل أي من ذلك إلى Kitbox، ويمكنك مسحه في أي وقت من إعدادات بيانات المواقع في متصفحك.</p>"""),
        ("الإعلانات وGoogle AdSense", """
<p>يُموَّل هذا الموقع عبر Google AdSense. وعند موافقتك على تخزين الإعلانات يُحمَّل سكربت AdSense، وقد تضع جوجل وشركاؤها الإعلانيون ملفات تعريف ارتباط أو معرّفات مشابهة على جهازك وتعالج بيانات مثل عنوان IP والموقع التقريبي ومعلومات الجهاز والمتصفح وتفاعلك مع الإعلانات، وقد تُستخدم لاختيار الإعلانات وقياسها وتخصيصها حيثما يُسمح بذلك.</p>
<p>تشرح جوجل تعاملها مع هذه البيانات في صفحة <a href="https://policies.google.com/technologies/partner-sites" rel="noopener nofollow" target="_blank">كيفية استخدام جوجل للمعلومات من المواقع التي تستخدم خدماتها</a>، ويمكنك مراجعة إعداداتك الإعلانية على <a href="https://adssettings.google.com" rel="noopener nofollow" target="_blank">adssettings.google.com</a>.</p>
<p>وإلى أن تختار، يكون وضع الموافقة Google Consent Mode v2 مضبوطًا على رفض تخزين الإعلانات وبيانات المستخدم الإعلانية والتخصيص وتخزين التحليلات، ولا يُحمَّل سكربت AdSense.</p>"""),
        ("التحليلات", """
<p>لا توجد حاليًا أداة تحليلات مفعّلة في Kitbox. وتتضمن واجهة الموافقة فئة للتحليلات حتى يُحترَم تفضيلك من أول مشاهدة في حال أُضيفت أداة مستقبلًا، بدل تطبيقه بأثر رجعي.</p>"""),
        ("إدارة الموافقة", """
<p>في زيارتك الأولى يعرض شريط الموافقة ثلاثة خيارات: قبول الكل، أو رفض غير الضروري، أو إدارة التفضيلات تفصيليًا. ويُخزَّن اختيارك محليًا ويُطبَّق عبر Google Consent Mode v2. ويمكنك إعادة فتح الشريط وتغيير قرارك في أي وقت من رابط إعدادات ملفات تعريف الارتباط في تذييل كل صفحة.</p>"""),
        ("حقوقك بموجب اللائحة الأوروبية GDPR", """
<p>إذا كنت في المنطقة الاقتصادية الأوروبية أو المملكة المتحدة أو سويسرا، فلك الحق في الوصول إلى بياناتك الشخصية وتصحيحها ومحوها وتقييد معالجتها ونقلها والاعتراض على المعالجة. ولأن Kitbox لا يحتفظ بأي بيانات شخصية على خادم، فإن الطلبات المتعلقة بالبيانات المجمّعة عبر الإعلانات تُوجَّه إلى جوجل باعتبارها المتحكم في تلك المعالجة. أما ما يُخزَّن على جهازك فمسح بيانات الموقع من متصفحك يزيله فورًا وبالكامل.</p>
<p>ولك أيضًا الحق في تقديم شكوى إلى الجهة الرقابية في بلدك.</p>"""),
        ("حقوقك بموجب CCPA وCPRA", """
<p>إذا كنت من سكان كاليفورنيا فلك الحق في معرفة المعلومات الشخصية التي تُجمع، وطلب حذفها، وتصحيح غير الدقيق منها، ورفض بيعها أو مشاركتها. لا يبيع Kitbox أي معلومات شخصية. وقد يعالج الشركاء الإعلانيون معرّفات بطريقة يعدّها قانون كاليفورنيا مشاركة لأغراض الإعلان السلوكي عبر السياقات، واختيار <em>رفض غير الضروري</em> يمنع تحميل سكربت الإعلانات وهو آلية الرفض في هذا الموقع.</p>"""),
        ("الأطفال", """
<p>Kitbox غير موجّه للأطفال دون سن الثالثة عشرة ولا يجمع معلومات منهم عن علم.</p>"""),
        ("الأمان", """
<p>يُقدَّم الموقع عبر HTTPS مع ترويسات أمان تشمل X-Content-Type-Options وReferrer-Policy وX-Frame-Options وPermissions-Policy. ولأن ملفاتك لا تصل إلى أي خادم، فإن أخطر فئة من المخاطر في خدمات معالجة الملفات لا تنطبق هنا.</p>"""),
        ("التغييرات والتواصل", """
<p>ستظهر التغييرات الجوهرية على هذه السياسة في هذه الصفحة مع تحديث التاريخ. ولأي سؤال عن الخصوصية راسلنا على <a href="mailto:%s" data-contact-email>%s</a> أو عبر <a href="/ar/contact/">صفحة الاتصال</a>.</p>
<p>تشرح هذه الوثيقة ما تفعله التطبيقة فعليًا، وهي ليست استشارة قانونية ولا تدّعي أن استخدام هذا الموقع وحده يحقق الامتثال في كل الولايات القضائية.</p>""" % (CONTACT_EMAIL, CONTACT_EMAIL)),
    ]
    return simple_page(lang, "privacy",
                       "سياسة الخصوصية — كيف يتعامل Kitbox مع البيانات",
                       "كيف يتعامل Kitbox مع بياناتك: تُعالَج الملفات محليًا ولا تُرفع أبدًا. تفاصيل عن التخزين المحلي وGoogle AdSense والموافقة وحقوق GDPR وCCPA.",
                       "سياسة الخصوصية",
                       "آخر تحديث: " + LASTMOD + ". توضح هذه السياسة بالضبط ما يفعله Kitbox وما لا يفعله بالبيانات.",
                       sections)


def build_terms(lang):
    if lang == "en":
        sections = [
            ("Acceptance", """
<p>By using Kitbox you agree to these terms. If you do not agree, please do not use the site. These terms apply to every page and every tool on this domain.</p>"""),
            ("Licence to use the service", """
<p>Kitbox grants you a personal, non-exclusive, revocable licence to use the tools for lawful purposes, whether personal or commercial. No account is required and no fee is charged.</p>"""),
            ("Acceptable use", """
<p>You agree not to use Kitbox to process material you have no right to process, to infringe intellectual property or privacy rights, to create or distribute unlawful content, or to attempt to disrupt the site or the devices of other users. You are solely responsible for the files and text you choose to process and for complying with the laws that apply to you.</p>"""),
            ("Intellectual property", """
<p>The Kitbox name, design, written content, icons and source code are protected by copyright and remain the property of their authors. The third-party libraries used by the tools remain under their own open-source licences. You keep every right in the files you process; because they never reach a server, Kitbox acquires no licence, no copy and no claim over them.</p>"""),
            ("Service availability", """
<p>Kitbox is provided on a best-effort basis. There is no uptime guarantee. Pages, tools and features may change or be withdrawn without notice. Tools depend on libraries delivered from a third-party content delivery network, which may be unavailable or blocked in some networks; where that happens the affected tool displays a clear error message instead of failing silently.</p>"""),
            ("Local processing limitations", """
<p>Because processing happens on your device, results depend on your browser, your operating system and your available memory. Very large files may fail or be slow on constrained devices. Browser image encoders differ slightly between platforms, so output size and appearance may not be byte-identical across devices. Kitbox cannot recover a file you have closed, and nothing you process is retained anywhere.</p>"""),
            ("Disclaimer of warranties", """
<p>Kitbox is provided "as is" and "as available", without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, accuracy and non-infringement. No warranty is given that the tools will be error-free, uninterrupted, or that output will meet any particular requirement or regulatory specification.</p>"""),
            ("Limitation of liability", """
<p>To the maximum extent permitted by law, Kitbox and its operators are not liable for any indirect, incidental, special, consequential or exemplary damages, nor for loss of data, loss of profits, or corruption of files arising from use of the site. Always keep original copies of important files before processing them. Some jurisdictions do not allow certain limitations, in which case the narrowest permitted limitation applies.</p>"""),
            ("Advertising", """
<p>The site displays third-party advertising. Kitbox does not endorse advertised products or services and is not responsible for the content of advertisements or the practices of advertisers.</p>"""),
            ("Changes and governing terms", """
<p>These terms may be updated; the current version is always the one published on this page. Continued use after a change constitutes acceptance. If any provision is found unenforceable, the remaining provisions continue in effect.</p>
<p>Questions about these terms can be sent to <a href="mailto:%s" data-contact-email>%s</a>.</p>""" % (CONTACT_EMAIL, CONTACT_EMAIL)),
        ]
        return simple_page(lang, "terms",
                           "Terms of Use — Kitbox Online Tools",
                           "The terms that govern use of Kitbox: acceptable use, intellectual property, availability, local-processing limitations, warranties and liability.",
                           "Terms of Use",
                           "Last updated: " + LASTMOD + ". Plain terms for a free, static, no-account website.",
                           sections)

    sections = [
        ("القبول", """
<p>باستخدامك Kitbox فإنك توافق على هذه الشروط. وإذا لم توافق عليها فيُرجى عدم استخدام الموقع. وتسري هذه الشروط على كل صفحة وكل أداة ضمن هذا النطاق.</p>"""),
        ("ترخيص الاستخدام", """
<p>يمنحك Kitbox ترخيصًا شخصيًا غير حصري وقابلًا للإلغاء لاستخدام الأدوات لأغراض مشروعة سواء شخصية أو تجارية، دون حاجة إلى حساب ودون أي رسوم.</p>"""),
        ("الاستخدام المقبول", """
<p>توافق على عدم استخدام Kitbox لمعالجة مواد لا تملك حق معالجتها، أو انتهاك حقوق الملكية الفكرية أو الخصوصية، أو إنشاء محتوى غير قانوني أو توزيعه، أو محاولة تعطيل الموقع أو أجهزة المستخدمين الآخرين. وأنت وحدك مسؤول عن الملفات والنصوص التي تختار معالجتها وعن الامتثال للقوانين التي تنطبق عليك.</p>"""),
        ("الملكية الفكرية", """
<p>اسم Kitbox وتصميمه ومحتواه المكتوب وأيقوناته وشيفرته محمية بحقوق النشر وتبقى ملكًا لمؤلفيها. وتبقى المكتبات الخارجية المستخدمة خاضعة لتراخيصها مفتوحة المصدر. وتحتفظ أنت بكامل حقوقك في الملفات التي تعالجها؛ ولأنها لا تصل إلى أي خادم فإن Kitbox لا يكتسب أي ترخيص أو نسخة أو ادعاء عليها.</p>"""),
        ("توفر الخدمة", """
<p>يُقدَّم Kitbox على أساس بذل أفضل جهد دون ضمان لاستمرارية التشغيل. وقد تتغير الصفحات والأدوات والميزات أو تُسحب دون إشعار. وتعتمد الأدوات على مكتبات تُسلَّم من شبكة توزيع خارجية قد تكون غير متاحة أو محجوبة في بعض الشبكات، وعندها تعرض الأداة المتأثرة رسالة خطأ واضحة بدل الفشل الصامت.</p>"""),
        ("قيود المعالجة المحلية", """
<p>لأن المعالجة تجري على جهازك فإن النتائج تعتمد على متصفحك ونظام تشغيلك والذاكرة المتاحة لديك. وقد تفشل الملفات الضخمة أو تبطؤ على الأجهزة المحدودة. كما تختلف مرمّزات الصور في المتصفحات اختلافًا طفيفًا بين المنصات، فقد لا يكون الحجم والمظهر متطابقين بايتًا ببايت بين الأجهزة. ولا يستطيع Kitbox استعادة ملف أغلقته، ولا يُحتفظ بأي شيء تعالجه في أي مكان.</p>"""),
        ("إخلاء الضمانات", """
<p>يُقدَّم Kitbox "كما هو" و"حسب توفره" دون أي ضمانات صريحة أو ضمنية، بما في ذلك القابلية للتسويق والملاءمة لغرض معين والدقة وعدم الانتهاك. ولا يوجد ضمان بخلو الأدوات من الأخطاء أو باستمرار عملها أو بمطابقة المخرجات لأي متطلب أو مواصفة تنظيمية بعينها.</p>"""),
        ("تحديد المسؤولية", """
<p>إلى أقصى حد يسمح به القانون، لا يتحمل Kitbox ولا مشغّلوه أي مسؤولية عن الأضرار غير المباشرة أو العرضية أو الخاصة أو التبعية أو التأديبية، ولا عن فقدان البيانات أو الأرباح أو تلف الملفات الناتج عن استخدام الموقع. احتفظ دائمًا بنسخ أصلية من ملفاتك المهمة قبل معالجتها. وبعض الولايات القضائية لا تسمح ببعض القيود، وعندها يُطبَّق أضيق قيد مسموح به.</p>"""),
        ("الإعلانات", """
<p>يعرض الموقع إعلانات من أطراف خارجية. ولا يعتمد Kitbox المنتجات أو الخدمات المعلن عنها ولا يتحمل مسؤولية محتوى الإعلانات أو ممارسات المعلنين.</p>"""),
        ("التغييرات والأحكام العامة", """
<p>قد تُحدَّث هذه الشروط، والنسخة السارية دائمًا هي المنشورة في هذه الصفحة، ويُعد الاستمرار في الاستخدام بعد التغيير قبولًا بها. وإذا تبيّن أن أي بند غير قابل للتنفيذ تبقى بقية البنود سارية.</p>
<p>تُرسل الأسئلة حول هذه الشروط إلى <a href="mailto:%s" data-contact-email>%s</a>.</p>""" % (CONTACT_EMAIL, CONTACT_EMAIL)),
    ]
    return simple_page(lang, "terms",
                       "شروط الاستخدام — أدوات Kitbox",
                       "الشروط التي تحكم استخدام Kitbox: الاستخدام المقبول والملكية الفكرية وتوفر الخدمة وقيود المعالجة المحلية والضمانات والمسؤولية.",
                       "شروط الاستخدام",
                       "آخر تحديث: " + LASTMOD + ". شروط واضحة لموقع ثابت مجاني بلا حسابات.",
                       sections)


def build_cookies(lang):
    if lang == "en":
        sections = [
            ("What this policy covers", """
<p>This policy describes the cookies and similar storage technologies used on Kitbox, what each category does, and how you control them. It complements the <a href="/privacy/">Privacy Policy</a>.</p>"""),
            ("Strictly necessary storage", """
<p>Kitbox sets no cookies of its own. It does use your browser's local storage for four small preference values, which are necessary for the site to behave as you asked it to:</p>
<table class="data">
  <thead><tr><th scope="col">Key</th><th scope="col">Purpose</th><th scope="col">Lifetime</th></tr></thead>
  <tbody>
    <tr><td>kitbox:theme</td><td>Remembers your light or dark choice</td><td>Until cleared</td></tr>
    <tr><td>kitbox:consent</td><td>Records your advertising and analytics choice</td><td>Until cleared</td></tr>
    <tr><td>kitbox:recent-tools</td><td>Personalises the Most used tools list</td><td>Until cleared</td></tr>
    <tr><td>kitbox:lang-suggest-dismissed</td><td>Stops the language banner reappearing</td><td>Until cleared</td></tr>
  </tbody>
</table>
<p>These values stay on your device. They are never transmitted, and every read and write is wrapped in error handling so that blocking storage does not break any tool.</p>"""),
            ("Advertising cookies", """
<p>If you accept advertising storage, Google AdSense is loaded and Google and its partners may set cookies or similar identifiers to select, cap, measure and — where permitted — personalise advertisements, and to detect invalid traffic. These are third-party cookies controlled by Google, not by Kitbox, and their lifetimes are set by Google.</p>
<p>If you reject non-essential storage, the AdSense script is not loaded at all and these cookies are not set.</p>"""),
            ("Analytics cookies", """
<p>No analytics tool is currently in use, so no analytics cookies are set. The category appears in the consent interface so that your preference is already recorded if analytics is ever introduced.</p>"""),
            ("Consent management", """
<p>On your first visit you are asked to choose. Google Consent Mode v2 defaults to denied for ad storage, ad user data, ad personalisation and analytics storage until you decide, and the advertising script is only loaded after consent.</p>
<p>You can change your choice at any time with the <strong>Cookie settings</strong> button in the footer of every page. Selecting <em>Manage preferences</em> lets you enable advertising and analytics independently.</p>"""),
            ("Controlling cookies in your browser", """
<p>Every major browser lets you block or delete cookies and site data. In Chrome and Edge, see Settings → Privacy and security → Third-party cookies; in Firefox, Settings → Privacy &amp; Security; in Safari, Settings → Privacy. Clearing site data for this domain removes the Kitbox preference values as well, so the site will behave as it does on a first visit.</p>
<p>Blocking storage entirely does not prevent any tool from working. You will simply be asked for your consent choice again and the theme will follow your system preference.</p>"""),
            ("Updates", """
<p>If the set of technologies used on the site changes, this page is updated. For questions write to <a href="mailto:%s" data-contact-email>%s</a>.</p>""" % (CONTACT_EMAIL, CONTACT_EMAIL)),
        ]
        return simple_page(lang, "cookies",
                           "Cookie Policy — Storage & Consent on Kitbox",
                           "Which cookies and local storage Kitbox uses, what each category does, how Google Consent Mode v2 is applied, and how to change your consent at any time.",
                           "Cookie Policy",
                           "Last updated: " + LASTMOD + ". Kitbox sets no cookies of its own; here is exactly what is stored and why.",
                           sections)

    sections = [
        ("ما الذي تغطيه هذه السياسة", """
<p>توضح هذه السياسة ملفات تعريف الارتباط وتقنيات التخزين المشابهة المستخدمة في Kitbox، ووظيفة كل فئة، وكيفية التحكم بها. وهي مكمّلة لـ<a href="/ar/privacy/">سياسة الخصوصية</a>.</p>"""),
        ("التخزين الضروري", """
<p>لا يضع Kitbox أي ملفات تعريف ارتباط خاصة به، لكنه يستخدم التخزين المحلي في متصفحك لأربع قيم تفضيلية صغيرة ضرورية ليتصرف الموقع كما طلبت:</p>
<table class="data">
  <thead><tr><th scope="col">المفتاح</th><th scope="col">الغرض</th><th scope="col">المدة</th></tr></thead>
  <tbody>
    <tr><td>kitbox:theme</td><td>حفظ اختيارك للمظهر الفاتح أو الداكن</td><td>حتى المسح</td></tr>
    <tr><td>kitbox:consent</td><td>تسجيل قرارك بشأن الإعلانات والتحليلات</td><td>حتى المسح</td></tr>
    <tr><td>kitbox:recent-tools</td><td>تخصيص قائمة الأدوات الأكثر استخدامًا</td><td>حتى المسح</td></tr>
    <tr><td>kitbox:lang-suggest-dismissed</td><td>منع ظهور شريط اللغة مجددًا</td><td>حتى المسح</td></tr>
  </tbody>
</table>
<p>تبقى هذه القيم على جهازك ولا تُرسل أبدًا، وكل قراءة وكتابة محاطة بمعالجة للأخطاء بحيث لا يؤدي حجب التخزين إلى تعطّل أي أداة.</p>"""),
        ("ملفات تعريف الارتباط الإعلانية", """
<p>إذا قبلت تخزين الإعلانات فسيُحمَّل Google AdSense، وقد تضع جوجل وشركاؤها ملفات تعريف ارتباط أو معرّفات مشابهة لاختيار الإعلانات وتحديد تكرارها وقياسها وتخصيصها حيثما يُسمح، ولاكتشاف الحركة غير الصالحة. وهذه ملفات تابعة لجوجل لا لـ Kitbox، وتحدد جوجل مددها.</p>
<p>وإذا رفضت التخزين غير الضروري فلن يُحمَّل سكربت AdSense إطلاقًا ولن تُوضع هذه الملفات.</p>"""),
        ("ملفات تعريف الارتباط التحليلية", """
<p>لا توجد أداة تحليلات مستخدمة حاليًا، لذا لا تُوضع أي ملفات تحليلية. وتظهر الفئة في واجهة الموافقة حتى يكون تفضيلك مسجّلًا مسبقًا إذا أُضيفت التحليلات مستقبلًا.</p>"""),
        ("إدارة الموافقة", """
<p>يُطلب منك الاختيار في زيارتك الأولى. ويضبط Google Consent Mode v2 الحالة الافتراضية على الرفض لتخزين الإعلانات وبيانات المستخدم الإعلانية والتخصيص وتخزين التحليلات حتى تقرر، ولا يُحمَّل سكربت الإعلانات إلا بعد الموافقة.</p>
<p>ويمكنك تغيير اختيارك في أي وقت عبر زر <strong>إعدادات ملفات تعريف الارتباط</strong> في تذييل كل صفحة، ويتيح لك خيار <em>إدارة التفضيلات</em> تفعيل الإعلانات والتحليلات كلًا على حدة.</p>"""),
        ("التحكم من داخل المتصفح", """
<p>تتيح كل المتصفحات الرئيسية حجب ملفات تعريف الارتباط وبيانات المواقع أو حذفها. ففي Chrome وEdge انتقل إلى الإعدادات ثم الخصوصية والأمان ثم ملفات تعريف الارتباط التابعة لجهات خارجية، وفي Firefox إلى الإعدادات ثم الخصوصية والأمان، وفي Safari إلى الإعدادات ثم الخصوصية. ومسح بيانات هذا النطاق يزيل أيضًا قيم تفضيلات Kitbox فيعود الموقع إلى حالته في الزيارة الأولى.</p>
<p>وحجب التخزين بالكامل لا يمنع أي أداة من العمل، وكل ما سيحدث هو إعادة سؤالك عن الموافقة واتباع المظهر لإعداد نظامك.</p>"""),
        ("التحديثات", """
<p>إذا تغيّرت مجموعة التقنيات المستخدمة في الموقع فستُحدَّث هذه الصفحة. وللأسئلة راسلنا على <a href="mailto:%s" data-contact-email>%s</a>.</p>""" % (CONTACT_EMAIL, CONTACT_EMAIL)),
    ]
    return simple_page(lang, "cookies",
                       "سياسة ملفات تعريف الارتباط — التخزين والموافقة",
                       "ما ملفات تعريف الارتباط والتخزين المحلي التي يستخدمها Kitbox، ووظيفة كل فئة، وكيفية تطبيق Google Consent Mode v2 وتغيير موافقتك في أي وقت.",
                       "سياسة ملفات تعريف الارتباط",
                       "آخر تحديث: " + LASTMOD + ". لا يضع Kitbox أي ملفات تعريف ارتباط خاصة به، وهذا بيان دقيق لما يُخزَّن ولماذا.",
                       sections)


# ---------------------------------------------------------------------------
# 404
# ---------------------------------------------------------------------------

def build_404(lang):
    title = L(lang, "Page Not Found — Kitbox", "الصفحة غير موجودة — Kitbox")
    desc = L(lang,
             "That page does not exist on Kitbox. Search the twelve free browser tools, jump straight to a popular utility, or head back to the home page.",
             "هذه الصفحة غير موجودة في Kitbox. ابحث في الأدوات المجانية الاثنتي عشرة داخل المتصفح، أو انتقل مباشرة إلى أداة شائعة، أو عد إلى الصفحة الرئيسية.")
    popular = ["image-compressor", "pdf-merge", "qr-code-generator", "password-generator"]
    body = """<div class="wrap">
  <div class="page-head">
    <h1>{h1}</h1>
    <p>{lead}</p>
    <div class="search-field">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <label class="sr-only" for="nf-search">{slabel}</label>
      <input type="search" id="nf-search" data-tool-search="#nf-tools .tool-grid" aria-describedby="nf-count" placeholder="{sph}" autocomplete="off">
    </div>
    <p class="hint" id="nf-count" role="status" aria-live="polite"></p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="{home}">{b1}</a>
      <a class="btn btn-secondary" href="{tools}">{b2}</a>
    </div>
  </div>
  <section id="nf-tools" aria-labelledby="nf-h" data-search-group>
    <h2 id="nf-h">{ph}</h2>
    <ul class="tool-grid">{cards}</ul>
  </section>
</div>""".format(
        h1=L(lang, "We could not find that page", "تعذّر العثور على هذه الصفحة"),
        lead=L(lang,
               "The address may be mistyped, or the page may have moved. Everything Kitbox offers is one of twelve tools, and they are all listed below and in the tools directory.",
               "ربما كان العنوان مكتوبًا بشكل خاطئ أو نُقلت الصفحة. كل ما يقدّمه Kitbox هو اثنتا عشرة أداة، وجميعها مدرجة أدناه وفي دليل الأدوات."),
        slabel=L(lang, "Search tools", "البحث في الأدوات"),
        sph=L(lang, "Search tools…", "ابحث عن أداة…"),
        home=url(lang), tools=url(lang, "tools"),
        b1=L(lang, "Go to the home page", "الذهاب إلى الصفحة الرئيسية"),
        b2=L(lang, "Browse all tools", "تصفّح كل الأدوات"),
        ph=L(lang, "Popular tools", "أدوات شائعة"),
        cards="".join(tool_card(lang, s) for s in popular),
    )
    filename = "ar/404.html" if lang == "ar" else "404.html"
    head = head_html(lang, "", title, desc)
    head = head.replace("<title>", '<meta name="robots" content="noindex">\n  <title>')
    html = """{head}
<body>
<a class="skip-link" href="#main">{skip}</a>
{header}
<main id="main">
{body}
</main>
{footer}
{consent}
</body>
</html>""".format(head=head, skip=L(lang, "Skip to content", "تخطّي إلى المحتوى"),
                  header=header_html(lang, url(lang)), body=body,
                  footer=footer_html(lang), consent=consent_html(lang))
    write(filename, html)


# ---------------------------------------------------------------------------
# Static assets, sitemap, config files
# ---------------------------------------------------------------------------

def build_assets():
    write("assets/img/logo.svg",
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" role="img" aria-label="Kitbox">'
          + logo("a").split(">", 1)[1])
    write("assets/img/favicon.svg",
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">'
          + logo("a").split(">", 1)[1])
    for size in (192, 512):
        write("assets/img/icons/icon-%d.svg" % size,
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="%d" height="%d">' % (size, size)
              + '<rect width="48" height="48" rx="10" fill="#0C1222"/>'
              + logo("a").split(">", 1)[1])

    og_slugs = ["home", "tools", "about", "contact", "privacy", "terms", "cookies", "404"] + SLUGS
    for slug in og_slugs:
        label = "Kitbox" if slug == "home" else slug.replace("-", " ")
        svg = """<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3D7BFF"/><stop offset="1" stop-color="#22D3EE"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#0C1222"/>
  <circle cx="980" cy="120" r="300" fill="url(#g)" opacity="0.12"/>
  <g transform="translate(80,210) scale(2.2)">
    <rect x="5" y="20" width="38" height="22" rx="5" fill="url(#g)"/>
    <path d="M24 4 37 9v6c0 3.6-2.3 6.4-5.2 8.1L24 27l-7.8-3.9C13.3 21.4 11 18.6 11 15V9z" fill="#131B33" stroke="url(#g)" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="m19.5 15.5 3.2 3.2 6-6.2" stroke="#2EE6A6" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="230" y="290" fill="#EAF0FF" font-family="Segoe UI, Arial, sans-serif" font-size="72" font-weight="700">Kitbox</text>
  <text x="230" y="360" fill="#9AA6CC" font-family="Segoe UI, Arial, sans-serif" font-size="40">%s</text>
  <text x="230" y="440" fill="#2EE6A6" font-family="Segoe UI, Arial, sans-serif" font-size="32">0 bytes uploaded — processed in your browser</text>
</svg>""" % label
        write("assets/img/og/%s.svg" % slug, svg)


def build_sitemap():
    slugs = [""] + ["tools"] + SLUGS + ["about", "contact", "privacy", "terms", "cookies"]
    entries = []
    for slug in slugs:
        for lang in ("en", "ar"):
            loc = ORIGIN + url(lang, slug)
            alts = (
                '    <xhtml:link rel="alternate" hreflang="en" href="%s"/>\n'
                '    <xhtml:link rel="alternate" hreflang="ar" href="%s"/>\n'
                '    <xhtml:link rel="alternate" hreflang="x-default" href="%s"/>\n'
                % (ORIGIN + url("en", slug), ORIGIN + url("ar", slug), ORIGIN + url("en", slug))
            )
            priority = "1.0" if slug == "" else ("0.9" if slug in SLUGS or slug == "tools" else "0.4")
            entries.append(
                "  <url>\n    <loc>%s</loc>\n%s    <lastmod>%s</lastmod>\n"
                "    <changefreq>monthly</changefreq>\n    <priority>%s</priority>\n  </url>"
                % (loc, alts, LASTMOD, priority)
            )
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
           'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
           + "\n".join(entries) + "\n</urlset>\n")
    write("sitemap.xml", xml)


def build_config_files():
    write("robots.txt",
          "User-agent: *\nAllow: /\n\n"
          "# Kitbox processes files in the browser; there are no private endpoints.\n"
          "Sitemap: %s/sitemap.xml\n" % ORIGIN)

    write("ads.txt",
          "# Kitbox authorised digital sellers.\n"
          "# Replace pub-XXXXXXXXXXXXXXXX with your AdSense publisher ID\n"
          "# (the same value as ADSENSE_PUBLISHER_ID in /assets/js/app.js).\n"
          "google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0\n")

    write("manifest.webmanifest", """{
  "name": "Kitbox — private browser tools",
  "short_name": "Kitbox",
  "description": "Free tools for images, PDF, text and developers. Files are processed on your device and never uploaded.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "lang": "en",
  "dir": "ltr",
  "theme_color": "#0C1222",
  "background_color": "#0C1222",
  "categories": ["utilities", "productivity"],
  "icons": [
    { "src": "/assets/img/icons/icon-192.svg", "sizes": "192x192", "type": "image/svg+xml", "purpose": "any" },
    { "src": "/assets/img/icons/icon-512.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any" },
    { "src": "/assets/img/favicon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "maskable" }
  ]
}
""")

    write("vercel.json", """{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "trailingSlash": true,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/sitemap.xml",
      "headers": [{ "key": "Content-Type", "value": "application/xml; charset=utf-8" }]
    }
  ]
}
""")

    write(".vercelignore", "scripts/\n")


# ---------------------------------------------------------------------------

def main():
    for lang in ("en", "ar"):
        build_home(lang)
        build_tools_dir(lang)
        for slug in SLUGS:
            build_tool(lang, slug)
        build_about(lang)
        build_contact(lang)
        build_privacy(lang)
        build_terms(lang)
        build_cookies(lang)
        build_404(lang)
    build_assets()
    build_sitemap()
    build_config_files()
    print("Kitbox build complete.")


if __name__ == "__main__":
    main()
