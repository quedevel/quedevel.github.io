/* 스쿼시 노트 — 공통 페이지 스크립트 (index + 문서)
 * - 사이드바 페이지 트리 / 현재 문서 아웃라인 / 브레드크럼
 * - 테마 전환, 모바일 내비게이션 드로어
 * - 이전·다음 글, 홈 화면 카드와 제작 예정 표
 */
(function () {
  "use strict";
  var root = document.documentElement;
  var body = document.body;
  var docs = window.SQUASH_DOCS || [];
  var series = window.SQUASH_SERIES || {};
  var published = docs.filter(function (d) { return d.status === "published"; });
  var docId = body.dataset.doc || null;
  var me = docs.filter(function (d) { return d.id === docId; })[0] || null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- theme ---------- */
  function effectiveTheme() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.querySelectorAll(".theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = effectiveTheme() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("squash-theme", next); } catch (e) {}
    });
  });

  /* ---------- mobile drawer ---------- */
  function closeNav() { body.classList.remove("nav-open"); }
  document.querySelectorAll(".menu-btn").forEach(function (b) {
    b.addEventListener("click", function () { body.classList.toggle("nav-open"); });
  });
  var scrim = document.querySelector(".scrim");
  if (scrim) scrim.addEventListener("click", closeNav);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });

  /* ---------- sidebar ---------- */
  var spyItems = [];
  var sb = document.querySelector(".sidebar-scroll");
  if (sb) {
    var ws = el("a", "ws");
    ws.href = "index.html";
    var wsi = el("span", "ws-icon");
    wsi.setAttribute("aria-hidden", "true");
    ws.appendChild(wsi);
    var wst = el("span");
    wst.appendChild(document.createTextNode("스쿼시 노트"));
    wst.appendChild(el("small", null, "원리로 읽는 스쿼시"));
    ws.appendChild(wst);
    sb.appendChild(ws);

    var home = el("a", "nav-item" + (body.classList.contains("home") ? " current" : ""));
    home.href = "index.html";
    home.appendChild(el("span", "ic", "🏠"));
    home.appendChild(el("span", "tx", "홈"));
    sb.appendChild(home);

    Object.keys(series).forEach(function (key) {
      var items = docs.filter(function (d) { return d.series === key; });
      if (!items.length) return;
      var g = el("div", "nav-group");
      g.appendChild(el("div", "nav-label", series[key].title));
      items.forEach(function (d) {
        var isPub = d.status === "published";
        var a = el(isPub ? "a" : "div", "nav-item" + (isPub ? "" : " planned") + (d.id === docId ? " current" : ""));
        if (isPub) a.href = d.href;
        a.appendChild(el("span", "ic", d.icon || "📄"));
        a.appendChild(el("span", "tx", d.title));
        if (!isPub) a.title = "준비 중";
        g.appendChild(a);
        if (d.id === docId) g.appendChild(buildOutline());
      });
      sb.appendChild(g);
    });
    var cur = sb.querySelector(".nav-item.current");
    if (cur) setTimeout(function () { cur.scrollIntoView({ block: "center" }); }, 0);
  }

  function buildOutline() {
    var box = el("div", "outline");
    document.querySelectorAll(".doc > h2[id]").forEach(function (h) {
      var a = el("a");
      a.href = "#" + h.id;
      var num = h.querySelector(".sec-num");
      a.textContent = (num ? num.textContent + ". " : "") + h.textContent.replace(num ? num.textContent : "", "").trim();
      a.addEventListener("click", closeNav);
      box.appendChild(a);
      spyItems.push({ a: a, h: h });
    });
    return box;
  }

  /* ---------- breadcrumb ---------- */
  var crumbs = document.querySelector(".crumbs");
  if (crumbs) {
    crumbs.textContent = "";
    var c0 = el("a", null, "스쿼시 노트");
    c0.href = "index.html";
    crumbs.appendChild(c0);
    if (me) {
      crumbs.appendChild(el("span", "sep", "/"));
      crumbs.appendChild(el("span", null, (series[me.series] || {}).title || ""));
      crumbs.appendChild(el("span", "sep", "/"));
      crumbs.appendChild(el("span", "cur", (me.icon ? me.icon + " " : "") + me.title));
    }
  }

  /* ---------- scroll ---------- */
  var ticking = false, current = null;
  function onScroll() {
    ticking = false;
    body.classList.toggle("scrolled", (window.scrollY || root.scrollTop) > 8);
    if (!spyItems.length) return;
    var hit = null;
    for (var i = 0; i < spyItems.length; i++) {
      if (spyItems[i].h.getBoundingClientRect().top <= 110) hit = spyItems[i]; else break;
    }
    if (hit === current) return;
    if (current) current.a.classList.remove("active");
    current = hit;
    if (hit) hit.a.classList.add("active");
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* ---------- pager ---------- */
  var pager = document.querySelector(".pager");
  if (pager && docId) {
    var idx = -1;
    published.forEach(function (d, i) { if (d.id === docId) idx = i; });
    function link(d, cls, dir) {
      var a = el("a", cls);
      a.href = d.href;
      a.appendChild(el("span", "ic", d.icon || "📄"));
      var t = el("span");
      t.appendChild(el("span", "dir", dir));
      t.appendChild(el("span", "t", d.title));
      a.appendChild(t);
      return a;
    }
    if (idx > 0) pager.appendChild(link(published[idx - 1], "prev", "← 이전 페이지"));
    if (idx >= 0 && idx < published.length - 1) pager.appendChild(link(published[idx + 1], "next", "다음 페이지 →"));
  }

  /* ---------- home ---------- */
  var shelves = document.getElementById("shelves");
  if (body.classList.contains("home") && shelves) {
    shelves.textContent = "";
    Object.keys(series).forEach(function (key) {
      var items = published.filter(function (d) { return d.series === key; });
      if (!items.length) return;
      var h = el("h2", "section-h");
      h.appendChild(el("span", null, (series[key].icon ? series[key].icon + " " : "") + series[key].title));
      h.appendChild(el("span", "count", String(items.length)));
      shelves.appendChild(h);
      shelves.appendChild(el("p", "section-sub", series[key].desc));
      var grid = el("div", "cards");
      items.forEach(function (d) {
        var a = el("a", "card");
        a.href = d.href;
        var th = el("div", "thumb");
        var clip = el("div", "clip");
        if (d.thumb) {
          var img = el("img");
          img.src = d.thumb; img.alt = ""; img.loading = "lazy";
          img.onerror = function () { img.remove(); };
          clip.appendChild(img);
        }
        th.appendChild(clip);
        th.appendChild(el("span", "c-icon", d.icon || "📄"));
        a.appendChild(th);
        var b = el("div", "body");
        b.appendChild(el("h3", null, d.title));
        b.appendChild(el("p", null, d.desc));
        var meta = el("div", "meta");
        (d.tags || []).forEach(function (t) { meta.appendChild(el("span", "pill", t)); });
        if (d.meta) meta.appendChild(el("span", "pill accent", d.meta));
        b.appendChild(meta);
        a.appendChild(b);
        grid.appendChild(a);
      });
      shelves.appendChild(grid);
    });

    var planned = docs.filter(function (d) { return d.status === "planned"; });
    if (planned.length) {
      var ph = el("h2", "section-h");
      ph.appendChild(el("span", null, "🗓️ 제작 예정"));
      ph.appendChild(el("span", "count", String(planned.length)));
      shelves.appendChild(ph);
      shelves.appendChild(el("p", "section-sub", "상황별 전술을 한 편씩 이어서 정리하고 있습니다."));
      var tb = el("div", "ltable");
      var head = el("div", "row head");
      ["#", "페이지", "다루는 내용", "상태"].forEach(function (t) { head.appendChild(el("div", null, t)); });
      tb.appendChild(head);
      planned.forEach(function (d) {
        var r = el("div", "row");
        r.appendChild(el("div", "no", d.no != null ? String(d.no) : "·"));
        var tt = el("div", "tt");
        tt.appendChild(el("span", null, d.icon || "📄"));
        tt.appendChild(el("span", null, d.title));
        r.appendChild(tt);
        r.appendChild(el("div", "ds", d.desc));
        var st = el("div");
        st.appendChild(el("span", "pill amber", "준비 중"));
        r.appendChild(st);
        tb.appendChild(r);
      });
      shelves.appendChild(tb);
    }
  }

  onScroll();
})();
