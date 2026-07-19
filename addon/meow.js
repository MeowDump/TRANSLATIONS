(function(){
  "use strict";
  window.i18nDict = window.i18nDict || {};
  window.i18nBoot = function(){
    var LANG = "en";
    try { LANG = localStorage.getItem("ibLang") || "en"; } catch(e){}
    if (LANG === "en") return;

    var DICT = window.i18nDict[LANG] || {};
    var _D = {};
    Object.entries(DICT).forEach(function(e){ _D[e[0].trim()] = e[1]; });

    // Normalize curly quotes to straight quotes for fallback matching
    function normalizeQuotes(s){
      return s
        .replace(/\u2018/g, "'")
        .replace(/\u2019/g, "'")
        .replace(/\u201C/g, '"')
        .replace(/\u201D/g, '"');
    }

    var FRAG = {
      "Analyzing user apps... (": "Analyzing user apps... (",
      "Checking risky apps... (": "Checking risky apps... (",
      " installed packages, ": " installed packages, ",
      "Found ": "Found ",
      " user apps": " user apps",
      "Active: ": "Active: ",
      "Loaded: ": "Loaded: ",
      "Mapped ": "Mapped ",
      "Activating ": "Activating ",
      "Applying ": "Applying ",
      " profile...": " profile...",
      " profile activated": " profile activated",
      "...": "..."
    };

    // Language-specific fragment overrides
    if (LANG === 'zh_CN') {
      FRAG = {
        "Analyzing user apps... (": "正在分析用户应用... (",
        "Checking risky apps... (": "正在检查风险应用... (",
        " installed packages, ": " 个已安装包， ",
        "Found ": "找到  ",
        " user apps": " 个用户应用",
        "Active: ": " 已激活：",
        "Loaded: ": " 已加载：",
        "Mapped ": "已映射 ",
        "Activating ": "正在激活",
        "Applying ": "正在应用",
        " profile...": "配置文件...",
        " profile activated": " 配置文件已激活",
        "...": "…"
      };
    } else if (LANG === 'hi') {
      FRAG = {
        "Analyzing user apps... (": "Rukja ... (",
        "Checking risky apps... (": "Checking... (",
        " installed packages, ": " Tumhare Apps, ",
        "Found ": "Mil gya ",
        " user apps": " Tere installed Apps",
        "Active: ": "Current: ",
        "Loaded: ": "Ho gya: ",
        "Mapped ": "Theek hai ",
        "Activating ": "Krti hoon ",
        "Applying ": "Ho rha h ",
        " profile...": " profile...",
        " profile activated": " profile active ho gya h",
        "...": "..."
      };
    } else if (LANG === 'ar') {
      FRAG = {
        "Analyzing user apps... (": "تهيئة تطبيقات المستخدم…(",
        "Checking risky apps... (": "البحث عن تطبيقات خطرة…(",
        " installed packages, ": " الحزم المثبتة, ",
        "Found ": "العثور ",
        " user apps": " تطبيقات المستخدم",
        "Active: ": " نشط: ",
        "Loaded: ": " تم التجهيز: ",
        "Mapped ": " تم التعيين ",
        "Activating ": "التنشيط ",
        "Applying ": " جاري التطبيق",
        " profile...": " ملف التعريف…",
        " profile activated": " تم تطبيق ملف التعريف",
        "...": "…"
      };
    }

    function tr(s){
      s = String(s);
      var k = s.trim();
      if (_D[k] != null) return _D[k];
      // Fallback: try with normalized quotes
      var kNorm = normalizeQuotes(k);
      if (_D[kNorm] != null) return _D[kNorm];
      var out = s;
      for (var from in FRAG){
        if (Object.prototype.hasOwnProperty.call(FRAG, from) && out.indexOf(from) !== -1){
          out = out.split(from).join(FRAG[from]);
        }
      }
      return out;
    }

    var SKIP = { SCRIPT:1, STYLE:1, NOSCRIPT:1, CODE:1, PRE:1, TEXTAREA:1 };

    function translateTextNode(node){
      var v = node.nodeValue;
      if (!v) return;
      if (node.__ibTranslated) return;
      var k = v.trim();
      if (!k) return;
      if (_D[k] != null) {
        node.nodeValue = _D[k];
        node.__ibTranslated = true;
        return;
      }
      var kNorm = normalizeQuotes(k);
      if (_D[kNorm] != null) {
        node.nodeValue = _D[kNorm];
        node.__ibTranslated = true;
      }
    }

    function underSkipped(node, root){
      var p = node.parentNode;
      while (p && p !== root){
        if (p.tagName && SKIP[p.tagName]) return true;
        if (p.classList && (p.classList.contains("material-icons") || p.classList.contains("material-symbols-outlined"))) return true;
        p = p.parentNode;
      }
      return false;
    }

    function translateElement(el){
      if (!el || el.nodeType !== 1) return;
      if (el.tagName && SKIP[el.tagName]) return;
      if (el.classList && (el.classList.contains("material-icons") || el.classList.contains("material-symbols-outlined"))) return;
      var root = el;
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: function(n){
          if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          return underSkipped(n, root) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        }
      });
      while (walker.nextNode()) translateTextNode(walker.currentNode);
      if (el.querySelectorAll){
        el.querySelectorAll("[placeholder],[title]").forEach(function(e){
          if (e.placeholder){ var p = e.placeholder.trim(); if (_D[p] != null) e.placeholder = _D[p]; }
          if (e.title){ var t = e.title.trim(); if (_D[t] != null) e.title = _D[t]; }
        });
      }
    }

    function patchPopup(){
      if (window.__ibPopupDone) return;
      if (typeof window.popup === "function" && !window.popup.__ibWrapped){
        var orig = window.popup;
        var wrapped = function(msg, type){ return orig.call(this, tr(msg), type); };
        wrapped.__ibWrapped = true;
        window.popup = wrapped;
        window.__ibPopupDone = true;
      }
    }

    function boot(){
      if (window.__ibBooted) return;
      window.__ibBooted = true;
      translateElement(document.body || document.documentElement);
      patchPopup();
      var obs = new MutationObserver(function(ms){
        for (var i = 0; i < ms.length; i++){
          var m = ms[i];
          if (m.type === "characterData"){ 
            if (!m.target.__ibTranslated) translateTextNode(m.target);
            continue; 
          }
          var added = m.addedNodes;
          for (var j = 0; j < added.length; j++){
            var n = added[j];
            if (n.nodeType === 1) translateElement(n);
            else if (n.nodeType === 3) translateTextNode(n);
          }
        }
      });
      obs.observe(document.body || document.documentElement, { childList: true, subtree: true, characterData: true });
    }

    if (document.readyState === "loading"){
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
    document.addEventListener("DOMContentLoaded", patchPopup);
    setTimeout(patchPopup, 0);
  };
  
    // Listen for language changes from parent window
    if (window.parent !== window) {
      window.addEventListener('message', function(e) {
        if (e.data && e.data.type === 'ibLangChange') {
          localStorage.setItem('ibLang', e.data.lang);
          location.reload();
        }
      });
    }
})();
