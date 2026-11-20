/*
 * 스쿼시 노트 — 카드뉴스(가로 슬라이드) 보기
 *
 * 문서 <main class="doc"> 의 내용을 버리지 않고 그대로 옮겨 담아 카드로 나눕니다.
 *   표지 → 들어가며 → H2 마다 새 카드 → H3 마다 새 카드 → 도표(figure)는 한 장씩
 *   → 글이 길면 "(이어서)" 카드 → 마지막 "정리" 카드(요약 + 이전/다음 글)
 *
 * 켜는 법 : <head> 에 squash-cards.css, 이 스크립트(squash.js 다음), 그리고
 *   <script>…classList.add("deck-mode")…</script> (보기 방식 기억) 를 넣습니다.
 * 넘기기 : 스와이프(scroll-snap) · 좌우 화살표 버튼 · ← → 키 · 하단 바
 * "긴 글로 보기" 를 누르면 원래의 스크롤 문서로 돌아가고, 그 선택은 브라우저에 기억됩니다.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var KEY = "squash-view";

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function setPref(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* 저장 안 되면 이번만 */ } }
  var ICON = {
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
    toc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    scroll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 4h12M6 9h12M6 14h12M6 19h8"/></svg>',
    cards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="13" height="14" rx="2"/><path d="M19 7v10"/><path d="M22 9v6"/></svg>'
  };

  var doc = document.querySelector("main.doc");

  /* ---------- 긴 글 보기 : 카드로 돌아가는 버튼만 ---------- */
  if (!root.classList.contains("deck-mode") || !doc) {
    root.classList.remove("deck-mode");
    if (doc && document.body.hasAttribute("data-cards")) {
      var t = el("button", "view-toggle");
      t.type = "button";
      t.innerHTML = ICON.cards + "카드로 보기";
      t.addEventListener("click", function () { setPref("cards"); location.reload(); });
      document.body.appendChild(t);
    }
    return;
  }

  /* ---------- 1. 문서를 카드 단위로 나누기 ---------- */
  var MAX_CHARS = 1100;                      // 한 카드에 담을 글의 대략적인 양
  var hero = doc.querySelector(".doc-hero");
  var heroIntro = hero ? hero.querySelector(":scope > blockquote") : null;
  var summary = doc.querySelector(":scope > blockquote.summary");
  var pager = doc.querySelector(":scope > nav.pager");

  function headInfo(h) {
    var n = h.querySelector(".sec-num, .sub-num");
    var num = n ? n.textContent.trim() : "";
    var text = h.textContent.replace(n ? n.textContent : "", "").trim();
    return { num: num, text: text, label: (num ? num + " " : "") + text, id: h.id };
  }
  function figTitle(f) {
    if (f.querySelector(".swing3d")) return "3D 스윙 뷰어";
    var svg = f.querySelector("svg[aria-label]");
    var t = svg ? svg.getAttribute("aria-label") : (f.querySelector("figcaption") || f).textContent;
    t = t.trim().replace(/\s+/g, " ");
    return "도표 · " + (t.length > 38 ? t.slice(0, 37) + "…" : t);
  }

  var cards = [], cur = null, h2i = null, h3i = null;
  function add(kind, title, kicker, tag) {
    cur = { kind: kind, title: title, kicker: kicker || "", tag: tag || "", nodes: [], chars: 0, sec: h2i };
    cards.push(cur);
    return cur;
  }
  function ctx() { return h3i || h2i; }

  // 표지 · 들어가며
  var cover = add("cover", "표지");
  if (heroIntro) {
    add("intro", "들어가며");
    cur.nodes.push(el("h2", null, "들어가며"));
    cur.nodes.push(heroIntro);
  }
  cur = null;

  Array.prototype.slice.call(doc.children).forEach(function (n) {
    if (n === hero || n === summary || n === pager) return;
    var tag = n.tagName;
    if (tag === "HR" || (tag === "NAV" && n.classList.contains("toc"))) { n.remove(); return; }
    if (tag === "H2") {
      h2i = headInfo(n); h3i = null;
      add("sec", h2i.label).nodes.push(n);
      return;
    }
    if (tag === "H3") {
      h3i = headInfo(n);
      add("sub", h3i.label, h2i ? h2i.label : "").nodes.push(n);
      return;
    }
    if (tag === "FIGURE") {
      // 제목만 있는 카드 바로 뒤의 도표는 그 카드에 함께 담는다
      if (cur && (cur.kind === "sec" || cur.kind === "sub") && cur.nodes.length <= 2 && cur.chars < 400) {
        cur.nodes.push(n);
        cur.withFig = true;
        cur = null;
        return;
      }
      var c = ctx();
      add("fig", figTitle(n), c ? c.label : "", n.querySelector(".swing3d") ? "3D" : "도표").nodes.push(n);
      cur = null;                                         // 도표 다음 글은 새 카드로
      return;
    }
    var len = (n.textContent || "").length;
    if (!cur || cur.kind === "fig" || cur.kind === "cover" || (cur.chars > MAX_CHARS && cur.nodes.length > 1)) {
      var c2 = ctx();
      add("cont", (c2 ? c2.label : "본문") + " (이어서)", c2 ? c2.label : "", "이어서");
    }
    cur.nodes.push(n);
    cur.chars += len;
  });

  if (summary || pager) {
    add("end", "정리");
    cur.sec = null;
    cur.nodes.push(el("h2", null, "정리"));
    if (summary) cur.nodes.push(summary);
    if (pager) cur.nodes.push(pager);
  }

  // 글 몇 줄뿐인 "(이어서)" 카드는 앞 카드에 다시 붙인다
  for (var ci = cards.length - 1; ci > 0; ci--) {
    var K = cards[ci], P = cards[ci - 1];
    if (K.kind === "cont" && K.chars < 220 && P.kind !== "fig" && P.kind !== "cover" && P.kind !== "intro" && !P.withFig &&
        !K.nodes.some(function (n) { return n.querySelector && n.querySelector("table, figure, svg"); })) {
      P.nodes = P.nodes.concat(K.nodes);
      P.chars += K.chars;
      cards.splice(ci, 1);
    }
  }

  // 같은 장 안의 짧은 소절(H3)은 최대 3개까지 한 카드로 묶는다 (훈련 드릴 목록 등)
  var PACK_CHARS = 650;
  for (var pi = 0; pi < cards.length - 1; pi++) {
    var A = cards[pi], B = cards[pi + 1];
    if (A.kind === "sub" && B.kind === "sub" && A.sec === B.sec && !A.withFig && !B.withFig &&
        A.chars + B.chars < PACK_CHARS && (A.packed || 1) < 3) {
      A.nodes = A.nodes.concat(B.nodes);
      A.chars += B.chars;
      A.packed = (A.packed || 1) + 1;
      A.title += " · " + B.title;
      cards.splice(pi + 1, 1);
      pi--;
    }
  }

  // 장 첫 카드 중 짧은 것(제목 + 비유 정도)은 큰 제목 카드로
  cards.forEach(function (c) {
    if (c.kind === "sec" && !c.withFig && c.nodes.length <= 2 && c.chars < 420) c.opener = true;
  });

  var N = cards.length;

  // 표지 내용
  (function () {
    var me = (window.SQUASH_DOCS || []).filter(function (d) { return d.id === document.body.getAttribute("data-doc"); })[0];
    if (hero) cover.nodes.push(hero);
    if (summary) {
      var s = el("div", "cover-sum");
      s.appendChild(el("b", "cs-label", "핵심 요약"));
      var sc = summary.cloneNode(true);
      while (sc.firstChild) s.appendChild(sc.firstChild);
      cover.nodes.push(s);
    } else if (me && me.desc) {
      var s2 = el("div", "cover-sum");
      s2.appendChild(el("b", "cs-label", "핵심 요약"));
      s2.appendChild(document.createTextNode(me.desc));
      cover.nodes.push(s2);
    }
    var head = el("div", "cover-toc-head");
    head.appendChild(el("span", null, "목차"));
    var total = el("strong", null, "전체 " + N + "장");
    head.appendChild(total);
    cover.nodes.push(head);
    var ul = el("ul", "cover-toc");
    cards.forEach(function (c, i) {
      if (c.kind !== "sec" && c.kind !== "intro" && c.kind !== "end") return;
      var li = el("li"), b = el("button");
      b.type = "button";
      var info = c.kind === "sec" ? c.sec : null;
      b.appendChild(el("span", "ct-num", info && info.num ? info.num : "·"));
      b.appendChild(el("span", null, info ? info.text : c.title));
      b.appendChild(el("span", "ct-page", (i + 1) + "장"));
      b.addEventListener("click", function () { go(i); });
      li.appendChild(b);
      ul.appendChild(li);
    });
    cover.nodes.push(ul);
    var start = el("button", "cover-start", "넘겨 보기 →");
    start.type = "button";
    start.addEventListener("click", function () { go(1); });
    cover.nodes.push(start);
  })();

  /* ---------- 2. 덱 만들기 ---------- */
  var deck = el("div", "deck");
  var prog = el("div", "deck-progress");
  var progBar = el("span");
  prog.appendChild(progBar);
  var track = el("div", "deck-track");
  track.tabIndex = 0;
  track.setAttribute("role", "region");
  track.setAttribute("aria-roledescription", "카드뉴스");
  track.setAttribute("aria-label", (document.querySelector("h1") || {}).textContent || "문서");

  var slides = cards.map(function (c, i) {
    var slide = el("section", "slide");
    slide.id = "c" + (i + 1);
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "카드");
    slide.setAttribute("aria-label", (i + 1) + " / " + N + " : " + c.title);
    var card = el("article", "card card-" + c.kind + (c.opener ? " card-opener" : "") + (c.withFig ? " card-fig" : ""));
    var body = el("div", "card-body");
    if (c.kicker && c.kind !== "sec") {
      var k = el("p", "card-kicker", c.kicker);
      if (c.tag) k.appendChild(el("span", "ck-tag", c.tag));
      body.appendChild(k);
    }
    c.nodes.forEach(function (n) { body.appendChild(n); });
    card.appendChild(body);
    var nx = el("button", "card-next");
    nx.type = "button";
    if (i < N - 1) {
      nx.appendChild(el("span", "cn-label", "다음"));
      nx.appendChild(el("span", "cn-title", cards[i + 1].title));
      nx.appendChild(el("span", "cn-arrow", "›"));
      nx.setAttribute("aria-label", "다음 카드 : " + cards[i + 1].title);
      nx.addEventListener("click", function () { go(i + 1); });
    } else {
      nx.classList.add("is-end");
      nx.appendChild(el("span", "cn-label", "마지막 카드"));
      nx.appendChild(el("span", "cn-title", "처음으로 돌아가려면 목차를 누르세요"));
      nx.tabIndex = -1;
    }
    card.appendChild(nx);
    slide.appendChild(card);
    track.appendChild(slide);
    return slide;
  });

  var prevBtn = el("button", "deck-arrow prev");
  prevBtn.type = "button"; prevBtn.innerHTML = ICON.prev; prevBtn.setAttribute("aria-label", "이전 카드");
  var nextBtn = el("button", "deck-arrow next");
  nextBtn.type = "button"; nextBtn.innerHTML = ICON.next; nextBtn.setAttribute("aria-label", "다음 카드");

  var bar = el("nav", "deck-bar");
  bar.setAttribute("aria-label", "카드 이동");
  var home = el("a", "db-btn db-home");
  home.href = "index.html";
  home.innerHTML = ICON.home + '<span class="db-label">홈</span>';
  home.setAttribute("aria-label", "스쿼시 노트 홈");
  var tocBtn = el("button", "db-btn db-toc");
  tocBtn.type = "button"; tocBtn.innerHTML = ICON.toc + '<span class="db-label">목차</span>';
  tocBtn.setAttribute("aria-label", "목차(표지 카드)로");
  var bPrev = el("button", "db-btn db-nav");
  bPrev.type = "button"; bPrev.innerHTML = ICON.prev; bPrev.setAttribute("aria-label", "이전 카드");
  var count = el("span", "db-count");
  count.setAttribute("aria-live", "polite");
  var bNext = el("button", "db-btn db-nav");
  bNext.type = "button"; bNext.innerHTML = ICON.next; bNext.setAttribute("aria-label", "다음 카드");
  var title = el("span", "db-title");
  var mode = el("button", "db-btn db-mode");
  mode.type = "button"; mode.innerHTML = ICON.scroll + '<span class="db-label">긴 글로 보기</span>';
  mode.setAttribute("aria-label", "긴 글(스크롤)로 보기");
  bar.append(home, tocBtn, bPrev, count, bNext, title, mode);

  deck.append(prog, track, prevBtn, nextBtn, bar);
  doc.textContent = "";
  doc.appendChild(deck);

  /* ---------- 3. 이동 ---------- */
  var idx = -1;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function go(i, instant) {
    i = Math.max(0, Math.min(N - 1, i));
    var x = i * track.clientWidth;
    if (instant || reduce || Math.abs(i - idx) > 1) {        // 여러 장을 건너뛸 때는 바로 이동
      track.style.scrollBehavior = "auto";
      track.scrollLeft = x;
      track.style.scrollBehavior = "";
    } else {
      track.scrollTo({ left: x, behavior: "smooth" });
    }
    setIndex(i);
  }

  var outlineLinks = Array.prototype.slice.call(document.querySelectorAll(".sidebar .outline a"));
  function setIndex(i) {
    if (i === idx) return;
    idx = i;
    var c = cards[i];
    progBar.style.width = ((i + 1) / N * 100) + "%";
    count.innerHTML = (i + 1) + " <small>/ " + N + "</small>";
    title.textContent = c.kind === "cover" ? "표지" : (c.kicker && c.kind !== "sec" ? c.kicker + " · " : "") + c.title.replace(/ \(이어서\)$/, "");
    prevBtn.disabled = bPrev.disabled = i === 0;
    nextBtn.disabled = bNext.disabled = i === N - 1;
    slides.forEach(function (s, j) {
      if (j === i) s.removeAttribute("inert"); else s.setAttribute("inert", "");
    });
    var secId = c.sec ? c.sec.id : null;
    outlineLinks.forEach(function (a) { a.classList.toggle("active", !!secId && a.getAttribute("href") === "#" + secId); });
    if (history.replaceState) history.replaceState(null, "", "#c" + (i + 1));
  }

  var ticking = false;
  track.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var w = track.clientWidth || 1;
      setIndex(Math.round(track.scrollLeft / w));
    });
  }, { passive: true });

  prevBtn.addEventListener("click", function () { go(idx - 1); });
  nextBtn.addEventListener("click", function () { go(idx + 1); });
  bPrev.addEventListener("click", function () { go(idx - 1); });
  bNext.addEventListener("click", function () { go(idx + 1); });
  tocBtn.addEventListener("click", function () { go(0); });
  mode.addEventListener("click", function () { setPref("scroll"); location.hash = ""; location.reload(); });

  // 키보드 : ← → (입력 칸·3D 캔버스·사이드바가 열렸을 때는 무시)
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|CANVAS)$/.test(t.tagName))) return;
    if (document.body.classList.contains("nav-open")) return;
    e.preventDefault();
    go(idx + (e.key === "ArrowRight" ? 1 : -1));
  });

  // 3D 뷰어·표 안에서 시작한 드래그는 카드 넘김으로 번지지 않게
  Array.prototype.slice.call(track.querySelectorAll(".swing3d, .table-wrap, pre")).forEach(function (n) {
    ["pointerdown", "touchstart", "touchmove", "mousedown"].forEach(function (ev) {
      n.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
    });
  });

  // 문서 안 링크(#b2 같은 목차·사이드바)는 해당 카드로
  function cardOf(id) {
    if (!id) return -1;
    var m = /^c(\d+)$/.exec(id);
    if (m) return Math.min(N, Math.max(1, +m[1])) - 1;
    var t = document.getElementById(id);
    if (!t) return -1;
    for (var i = 0; i < slides.length; i++) if (slides[i].contains(t)) return i;
    return -1;
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var i = cardOf(decodeURIComponent(a.getAttribute("href").slice(1)));
    if (i < 0) return;
    e.preventDefault();
    document.body.classList.remove("nav-open");
    go(i);
  });
  window.addEventListener("hashchange", function () {
    var i = cardOf(decodeURIComponent(location.hash.slice(1)));
    if (i >= 0 && i !== idx) go(i);
  });

  // 크기가 바뀌면 보던 카드 유지
  var lastW = track.clientWidth;
  function keep() {
    if (track.clientWidth === lastW) return;
    lastW = track.clientWidth;
    var i = idx; idx = -1;
    go(i, true);
  }
  if (window.ResizeObserver) new ResizeObserver(keep).observe(track);
  else window.addEventListener("resize", keep);

  root.classList.add("deck-ready");
  var start0 = cardOf(decodeURIComponent(location.hash.slice(1)));
  go(start0 >= 0 ? start0 : 0, true);
})();
