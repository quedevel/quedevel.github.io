/*
 * 스쿼시 노트 — Three.js 3D 그립 뷰어
 *
 *   <div class="grip3d"></div>
 *   <script src="assets/js/grip-viewer.js" defer></script>
 *
 * 팔각형 손잡이를 쥔 오른손을 손가락 마디(구 + 원기둥)로 만들어 보여 줍니다.
 * - 정석 그립 ↔ 망치 그립 : 손가락 마디 위치와 라켓의 돌아간 각도가 부드럽게 바뀝니다.
 * - 쥐는 힘 : 힘 빼기 / 임팩트(포핸드) / 임팩트(백핸드)에서 힘을 주는 부위를 색으로 표시합니다.
 * - 시점 : 손바닥 쪽 · 손등 쪽 · 위에서(V자) · 손잡이 끝에서(면 각도)
 * 좌표 : 손잡이 축 = +x (손잡이 끝 x = 0, 라켓 머리 쪽 +x), 위 = +y, 단위 cm.
 * 손잡이 둘레 각도 φ : 손잡이 끝에서 볼 때 윗면 0°, 시계 방향(+z 쪽)으로 증가. 손잡이 면 k번의 가운데 = 45 × (k − 1)°.
 */
(function () {
  "use strict";

  var IMPORTS = {
    "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"
  };
  var DEG = Math.PI / 180;

  /* ------------------------------------------------------------------ *
   * 손 모양 데이터 : 각 마디 [φ(도), 축에서의 거리 ρ(cm), x(cm)]
   * 손 기준 각도이며 V자(엄지–검지 사이)가 φ = 0 에 오도록 잡았다.
   * rot : 라켓(손잡이)이 손 안에서 돌아간 각도. 정석은 반 면 22.5° → 8·1번 모서리가 V자 아래로 온다.
   * ------------------------------------------------------------------ */
  var GRIPS = {
    pro: {
      rot: 22.5,
      fingers: {
        thumb:  [[18, 4.7, 5.4], [-8, 3.35, 7.0], [-52, 2.75, 8.2], [-92, 2.6, 8.9]],
        index:  [[40, 3.55, 9.1], [112, 2.65, 10.4], [156, 2.6, 11.2], [190, 2.55, 11.7]],
        middle: [[60, 3.6, 6.8], [142, 2.6, 6.85], [196, 2.55, 6.9], [238, 2.5, 6.95]],
        ring:   [[80, 3.55, 4.85], [160, 2.55, 4.85], [210, 2.5, 4.85], [248, 2.45, 4.85]],
        pinky:  [[100, 3.45, 3.0], [168, 2.5, 3.0], [206, 2.45, 3.0], [238, 2.4, 3.0]]
      }
    },
    hammer: {
      rot: 0,
      fingers: {
        thumb:  [[18, 4.7, 5.0], [-14, 3.5, 6.1], [-62, 3.35, 6.3], [-104, 3.3, 6.1]],
        index:  [[40, 3.55, 8.7], [128, 2.55, 8.7], [186, 2.5, 8.7], [226, 2.45, 8.7]],
        middle: [[60, 3.6, 6.8], [150, 2.55, 6.8], [206, 2.5, 6.8], [248, 2.45, 6.8]],
        ring:   [[80, 3.55, 4.9], [168, 2.5, 4.9], [220, 2.45, 4.9], [258, 2.4, 4.9]],
        pinky:  [[100, 3.45, 3.0], [176, 2.45, 3.0], [216, 2.4, 3.0], [248, 2.35, 3.0]]
      }
    }
  };
  var RADIUS = { thumb: 0.98, index: 0.84, middle: 0.88, ring: 0.82, pinky: 0.74 };
  var FINGER_NAMES = { thumb: "엄지", index: "검지", middle: "중지", ring: "약지", pinky: "새끼" };

  // 쥐는 힘 표시 : pull = 당겨 조임, brace = 뒤에서 받침, light = 가볍게
  var PRESSURE = {
    relax:  { thumb: "light", index: "light", middle: "light", ring: "light", pinky: "light", heel: "light" },
    fh:     { thumb: "light", index: "brace", middle: "pull", ring: "pull", pinky: "pull", heel: "brace" },
    bh:     { thumb: "brace", index: "light", middle: "pull", ring: "pull", pinky: "pull", heel: "brace" },
    hammer: { thumb: "pull", index: "pull", middle: "pull", ring: "pull", pinky: "pull", heel: "pull" }
  };
  var COLOR = { skin: 0xf2c6a2, light: 0xf2c6a2, pull: 0xf0703a, brace: 0x3b82d6 };

  var CAPTION = {
    pro: {
      title: "정석 그립 (방아쇠 그립)",
      points: [
        "V자(주황 표시)가 손잡이 <b>8번과 1번 사이의 왼쪽 모서리</b>에 온다. 검지 뿌리 마디는 2번 면",
        "검지를 중지에서 <b>1~2 cm 띄워</b> 방아쇠처럼 손잡이 옆에 걸친다 → 지렛대의 받침점",
        "손잡이가 손 안에서 <b>반 면(22.5°)</b> 돌아간 채 쥐어져, 손 모양 그대로 면이 천장 쪽으로 약 15~20° 열린다 (보라 화살표)"
      ]
    },
    hammer: {
      title: "망치 그립 (초보)",
      points: [
        "V자가 <b>1번 면 가운데</b>(윗면)에 온다 → 면이 손바닥과 나란해 <b>수직</b>",
        "다섯 손가락을 뭉쳐 쥐고, 엄지가 손가락 위를 덮는다 → 받침점이 없다",
        "손잡이가 손바닥 한가운데에 박혀 손목을 꺾고 아래팔을 비틀 여유가 줄어든다"
      ]
    }
  };
  var PRESS_CAPTION = {
    relax: "<b>힘 빼기 (준비 ~ 다운스윙)</b> : 다섯 손가락 모두 10 중 약 2~3. 라켓이 손에서 빠지지 않을 만큼만",
    fh: "<b>임팩트 · 포핸드</b> : 중지·약지·새끼가 손잡이 끝을 당겨 조이고(주황), 검지와 새끼 두덩이 반대편에서 받친다(파랑)",
    bh: "<b>임팩트 · 백핸드</b> : 아래 세 손가락의 당김은 같고(주황), 받치는 손가락만 엄지·엄지 두덩으로 바뀐다(파랑)",
    hammer: "<b>망치 그립</b> : 처음부터 끝까지 다섯 손가락 모두 꽉(주황) → 손목에 브레이크가 걸린 채 휘두름"
  };

  var CAMS = [
    { key: "diag", label: "비스듬히", pos: [-10, 14, -26], target: [6, 0, 0] },
    { key: "front", label: "공 쪽 (손가락 끝)", pos: [7, 5, -30], target: [6, 0, 0] },
    { key: "below", label: "아래에서 (검지 간격)", pos: [7, -30, -6], target: [7, 0, 0] },
    { key: "top", label: "위에서 (V자)", pos: [6.5, 30, 3], target: [6.5, 0, 0] },
    { key: "back", label: "손등 쪽", pos: [5, 9, 30], target: [5, 0, 1] },
    { key: "end", label: "손잡이 끝에서 (면 각도)", pos: [-34, 3, -6], target: [10, 0, 0] }
  ];

  var STYLE = [
    ".grip3d{--g-ink:#242424;--g-ink2:#424242;--g-muted:#737373;--g-line:#e6e6e4;--g-acc:#5b5fc7;--g-acc-soft:#eeeefb;",
    "color:var(--g-ink);background:#fff;border:1px solid var(--g-line);border-radius:12px;padding:10px;margin:24px 0;touch-action:pan-y}",
    ".fig .grip3d{border:0;padding:0;margin:0}",
    ".grip3d>.g-msg{min-height:220px;display:grid;place-items:center;color:var(--g-muted);font-size:.84rem}",
    ".g-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 6px}",
    ".g-bar .g-lab{font-size:.74rem;color:var(--g-muted);font-weight:600;min-width:52px}",
    ".g-bar button,.g-cams button{font:inherit;cursor:pointer;border:1px solid var(--g-line);background:#fff;color:var(--g-ink2);border-radius:8px;white-space:nowrap;transition:background .15s,border-color .15s,color .15s}",
    ".g-bar button{padding:6px 11px;font-size:.82rem;font-weight:600}",
    ".g-bar button:hover{background:#f7f7f6}",
    ".g-bar button[aria-pressed=true]{border-color:var(--g-acc);background:var(--g-acc-soft);color:var(--g-acc)}",
    ".g-view{position:relative;aspect-ratio:16/10;max-height:520px;width:100%;border-radius:8px;overflow:hidden;background:linear-gradient(#f4f6f9,#eceae5)}",
    ".g-view canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}",
    ".g-view canvas:active{cursor:grabbing}",
    ".g-cams{position:absolute;top:8px;right:8px;left:8px;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:4px;pointer-events:none}",
    ".g-cams button{pointer-events:auto;padding:3px 8px;font-size:.72rem;background:rgba(255,255,255,.9)}",
    ".g-cams button[aria-pressed=true]{border-color:var(--g-acc);color:var(--g-acc)}",
    ".g-hint{position:absolute;left:10px;bottom:8px;font-size:.7rem;color:var(--g-muted);background:rgba(255,255,255,.85);padding:2px 7px;border-radius:6px;pointer-events:none}",
    ".g-cap{margin:10px 4px 2px}",
    ".g-cap-title{margin:0 0 4px;font-size:.92rem}",
    ".g-cap-title b{color:var(--g-acc)}",
    ".g-cap ul{margin:0;padding-left:1.1em;font-size:.84rem;color:var(--g-ink2);line-height:1.6}",
    ".g-press{margin:6px 0 0;font-size:.82rem;color:var(--g-ink2);background:#f6f6f4;border-radius:8px;padding:6px 10px}",
    ".g-legend{margin:6px 0 0;font-size:.74rem;color:var(--g-muted)}",
    ".g-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin:0 4px 0 0;vertical-align:-1px}",
    "@media (max-width:600px){.g-view{aspect-ratio:4/3.6}.g-bar .g-lab{min-width:100%}.g-cams{top:6px}}"
  ].join("");

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function ensureImportMap() {
    if (document.querySelector('script[type="importmap"]')) return;
    var s = document.createElement("script");
    s.type = "importmap";
    s.textContent = JSON.stringify({ imports: IMPORTS });
    (document.head || document.documentElement).appendChild(s);
  }
  var libs = null;
  function loadLibs() {
    if (!libs) {
      ensureImportMap();
      libs = Promise.all([import("three"), import("three/addons/controls/OrbitControls.js")])
        .then(function (m) { return { T: m[0], OrbitControls: m[1].OrbitControls }; });
    }
    return libs;
  }

  function textSprite(T, text, color, px, depth) {
    var c = document.createElement("canvas"), ctx = c.getContext("2d");
    var font = "700 " + (px || 40) + "px 'Pretendard Variable', Pretendard, 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";
    ctx.font = font;
    var w = Math.ceil(ctx.measureText(text).width) + 22, h = (px || 40) + 18;
    c.width = w; c.height = h;
    ctx.font = font;
    ctx.fillStyle = "rgba(255,255,255,.88)";
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(0, 0, w, h, 10); ctx.fill(); } else ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color || "#495057";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 11, h / 2 + 2);
    var tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    var s = new T.Sprite(new T.SpriteMaterial({ map: tex, depthTest: !!depth, transparent: true, sizeAttenuation: false }));
    s.renderOrder = 10;
    var k = 0.03 / h;
    s.scale.set(w * k, h * k, 1);
    return s;
  }

  /* ------------------------------------------------------------------ */
  function Viewer(host, L) {
    var T = L.T, self = this;
    var renderer = null, raf = 0, visible = true;
    this.invalidate = function () { if (renderer && !raf && visible) raf = requestAnimationFrame(frame); };

    var grip = host.getAttribute("data-grip") === "hammer" ? "hammer" : "pro";
    var press = grip === "hammer" ? "hammer" : "relax";
    var camKey = host.getAttribute("data-cam") || "diag";

    // ---- DOM
    host.innerHTML = "";
    host.classList.add("grip3d");
    function bar(label, items, onPick) {
      var b = el("div", "g-bar");
      b.setAttribute("role", "group");
      b.setAttribute("aria-label", label);
      b.appendChild(el("span", "g-lab", label));
      var btns = items.map(function (it) {
        var x = el("button", null, it[1]);
        x.type = "button";
        x.addEventListener("click", function () { onPick(it[0]); });
        b.appendChild(x);
        return { key: it[0], el: x };
      });
      return { el: b, set: function (k) { btns.forEach(function (o) { o.el.setAttribute("aria-pressed", o.key === k ? "true" : "false"); }); } };
    }
    var gripBar = bar("그립", [["pro", "정석 그립 (방아쇠)"], ["hammer", "망치 그립 (초보)"]], function (k) { self.setGrip(k); });
    var pressBar = bar("쥐는 힘", [["relax", "힘 빼기"], ["fh", "임팩트 · 포핸드"], ["bh", "임팩트 · 백핸드"]], function (k) { self.setPress(k); });
    var view = el("div", "g-view");
    var cams = el("div", "g-cams");
    var camBtns = CAMS.map(function (c) {
      var b = el("button", null, c.label);
      b.type = "button";
      b.addEventListener("click", function () { self.cam(c.key); });
      cams.appendChild(b);
      return b;
    });
    var hint = el("div", "g-hint", "드래그 : 돌려 보기 · 휠/두 손가락 : 확대");
    var cap = el("div", "g-cap");
    cap.setAttribute("aria-live", "polite");
    var capTitle = el("p", "g-cap-title"), capList = el("ul"), capPress = el("p", "g-press");
    var legend = el("p", "g-legend");
    legend.innerHTML = '<i style="background:#f0703a"></i>당겨 조이는 곳 &nbsp; <i style="background:#3b82d6"></i>뒤에서 받치는 곳 &nbsp; <i style="background:#f59f00;border-radius:50%"></i>V자 &nbsp; <i style="background:#7c4dff"></i>라켓 면이 바라보는 방향 &nbsp; <i style="background:#adb5bd"></i>수직 기준';
    cap.append(capTitle, capList, capPress, legend);
    host.append(gripBar.el, pressBar.el, view, cap);

    // ---- three
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); }
    catch (e) { view.appendChild(el("div", "g-msg", "이 브라우저에서는 3D(WebGL)를 표시할 수 없습니다.")); renderer = null; }
    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(32, 1.6, 0.5, 400);
    var controls = null;
    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.domElement.setAttribute("role", "img");
      renderer.domElement.setAttribute("aria-label", "팔각형 손잡이를 쥔 오른손 3D 모형 — 드래그해서 돌려 볼 수 있음");
      view.append(renderer.domElement, cams, hint);
      controls = new L.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.12;
      controls.minDistance = 10;
      controls.maxDistance = 160;
      controls.addEventListener("change", function () { self.invalidate(); });
      ["pointerdown", "touchstart", "touchmove"].forEach(function (ev) {
        renderer.domElement.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
      });
    }
    scene.add(new T.HemisphereLight(0xffffff, 0xcfc6b8, 1.6));
    var key = new T.DirectionalLight(0xffffff, 1.6);
    key.position.set(-20, 40, -30);
    var fill = new T.DirectionalLight(0xffffff, 0.8);
    fill.position.set(30, 10, 40);
    scene.add(key, fill);

    // ---- 라켓 (손잡이 축을 따라 돈다)
    var racket = new T.Group();
    scene.add(racket);
    var RF = 1.57;                              // 팔각형 외접 반지름 (둘레 약 9.6 cm)
    var handleGeo = new T.CylinderGeometry(RF, RF, 25.5, 8, 1, false, Math.PI / 8);
    handleGeo.rotateZ(-Math.PI / 2);
    handleGeo.translate(12.75, 0, 0);
    var handle = new T.Mesh(handleGeo, new T.MeshStandardMaterial({ color: 0x4a4f57, roughness: 0.85, flatShading: true }));
    var capGeo = new T.CylinderGeometry(RF + 0.25, RF + 0.25, 0.8, 8, 1, false, Math.PI / 8);
    capGeo.rotateZ(-Math.PI / 2);
    capGeo.translate(-0.4, 0, 0);
    var buttCap = new T.Mesh(capGeo, new T.MeshStandardMaterial({ color: 0x25282d, roughness: 0.6, flatShading: true }));
    // 윗면(1번) 표시 띠
    var stripe = new T.Mesh(new T.BoxGeometry(25.5, 0.06, 1.0), new T.MeshStandardMaterial({ color: 0x8d96a3, roughness: 0.9 }));
    stripe.position.set(12.75, RF * Math.cos(22.5 * DEG) + 0.02, 0);
    var shaftMat = new T.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.45, metalness: 0.25 });
    var shaftGeo = new T.CylinderGeometry(0.55, 0.75, 19, 12);
    shaftGeo.rotateZ(-Math.PI / 2);
    shaftGeo.translate(25.5 + 9.5, 0, 0);
    var shaft = new T.Mesh(shaftGeo, shaftMat);
    var pts = [];
    for (var i = 0; i < 72; i++) { var a = i / 72 * Math.PI * 2; pts.push(new T.Vector3(56 + 12.5 * Math.cos(a), 9.5 * Math.sin(a), 0)); }
    var hoop = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 120, 0.75, 10, true), shaftMat);
    var bedShape = new T.Shape();
    bedShape.absellipse(56, 0, 11.8, 8.8, 0, Math.PI * 2, false, 0);
    var bed = new T.Mesh(new T.ShapeGeometry(bedShape, 48), new T.MeshStandardMaterial({ color: 0xdfe5ec, transparent: true, opacity: 0.5, side: T.DoubleSide, depthWrite: false }));
    var sl = [];
    for (var sx = 45; sx <= 67; sx += 1.6) { var hh = 8.8 * Math.sqrt(Math.max(0, 1 - Math.pow((sx - 56) / 11.8, 2))); sl.push(sx, -hh, 0, sx, hh, 0); }
    for (var sy = -8; sy <= 8; sy += 1.6) { var ww = 11.8 * Math.sqrt(Math.max(0, 1 - Math.pow(sy / 8.8, 2))); sl.push(56 - ww, sy, 0, 56 + ww, sy, 0); }
    var sg = new T.BufferGeometry();
    sg.setAttribute("position", new T.Float32BufferAttribute(sl, 3));
    var strings = new T.LineSegments(sg, new T.LineBasicMaterial({ color: 0x8a96a6, transparent: true, opacity: 0.7 }));
    racket.add(handle, buttCap, stripe, shaft, hoop, bed, strings);
    // 면 번호 (손잡이 끝 바깥에)
    for (var k = 1; k <= 8; k++) {
      var phi = 45 * (k - 1) * DEG;
      var lab = textSprite(T, String(k), k === 1 || k === 8 ? "#c2410c" : "#495057", 34);
      lab.position.set(-1.4, 2.6 * Math.cos(phi), 2.6 * Math.sin(phi));
      racket.add(lab);
    }
    // 면이 바라보는 방향 (포핸드로 공을 미는 면) + 수직 기준
    var faceArrow = new T.ArrowHelper(new T.Vector3(0, 0, -1), new T.Vector3(56, 0, 0), 15, 0x7c4dff, 3, 1.8);
    racket.add(faceArrow);
    var refArrow = new T.ArrowHelper(new T.Vector3(0, 0, -1), new T.Vector3(56, 0, 0), 15, 0xadb5bd, 2.4, 1.4);
    scene.add(refArrow);
    var faceLab = textSprite(T, "면 방향", "#6741d9", 34);
    scene.add(faceLab);

    // ---- 손
    var hand = new T.Group();
    scene.add(hand);
    var mats = {};
    ["thumb", "index", "middle", "ring", "pinky", "heel"].forEach(function (n) {
      mats[n] = new T.MeshStandardMaterial({ color: COLOR.skin, roughness: 0.75 });
    });
    var sphereGeo = new T.SphereGeometry(1, 24, 16);
    var cylGeo = new T.CylinderGeometry(1, 1, 1, 20, 1, true);
    var parts = {};
    Object.keys(RADIUS).forEach(function (n) {
      var jr = [], sg2 = [];
      for (var j = 0; j < 4; j++) {
        var s = new T.Mesh(sphereGeo, mats[n]);
        var r = RADIUS[n] * (j === 0 ? 1.12 : j === 3 ? 0.92 : 1);
        s.scale.setScalar(r);
        hand.add(s);
        jr.push(s);
        if (j < 3) { var c = new T.Mesh(cylGeo, mats[n]); hand.add(c); sg2.push(c); }
      }
      parts[n] = { joints: jr, segs: sg2 };
    });
    // 손바닥 : 손잡이를 감싸는 두꺼운 호(손잡이 축 방향으로 밀어낸 도형)
    function palmGeometry() {
      // 양 끝을 반원으로 둥글린 두꺼운 호 (손잡이 끝에서 본 단면)를 손잡이 축 방향으로 밀어 냄
      var a0 = 4 * DEG, a1 = 104 * DEG, r0 = 1.72, r1 = 3.45, rm = (r0 + r1) / 2, hw = (r1 - r0) / 2;
      var shp = new T.Shape(), first = true;
      function W(y, z) { var x = -z, yy = y; if (first) { shp.moveTo(x, yy); first = false; } else shp.lineTo(x, yy); }   // 세계 (y, z) → 도형 (−z, y)
      function at(r, a) { W(r * Math.cos(a), r * Math.sin(a)); }
      var N = 28, t, th;
      for (t = 0; t <= N; t++) at(r0, a0 + (a1 - a0) * t / N);
      var c1 = [rm * Math.cos(a1), rm * Math.sin(a1)], rad1 = [Math.cos(a1), Math.sin(a1)], tan1 = [-Math.sin(a1), Math.cos(a1)];
      for (t = 1; t < 12; t++) { th = Math.PI * t / 12; W(c1[0] + hw * (-rad1[0] * Math.cos(th) + tan1[0] * Math.sin(th)), c1[1] + hw * (-rad1[1] * Math.cos(th) + tan1[1] * Math.sin(th))); }
      for (t = N; t >= 0; t--) at(r1, a0 + (a1 - a0) * t / N);
      var c0 = [rm * Math.cos(a0), rm * Math.sin(a0)], rad0 = [Math.cos(a0), Math.sin(a0)], tan0 = [-Math.sin(a0), Math.cos(a0)];
      for (t = 1; t < 12; t++) { th = Math.PI * t / 12; W(c0[0] + hw * (rad0[0] * Math.cos(th) - tan0[0] * Math.sin(th)), c0[1] + hw * (rad0[1] * Math.cos(th) - tan0[1] * Math.sin(th))); }
      var g = new T.ExtrudeGeometry(shp, { depth: 7.8, bevelEnabled: true, bevelThickness: 1.3, bevelSize: 0.75, bevelSegments: 6, curveSegments: 8 });
      g.rotateY(Math.PI / 2);      // 밀어낸 방향(+z) → +x , 도형 (sx, sy) → 세계 (y = sy, z = −sx)
      g.translate(1.4, 0, 0);
      g.computeVertexNormals();
      return g;
    }
    var skinMat = new T.MeshStandardMaterial({ color: COLOR.skin, roughness: 0.75 });
    var palm = new T.Mesh(palmGeometry(), skinMat);
    hand.add(palm);
    // 손등·엄지 두덩·손목
    var backOfHand = new T.Mesh(sphereGeo, skinMat);
    var hypothenar = new T.Mesh(sphereGeo, mats.heel);   // 새끼 두덩 : 손잡이 끝을 묻어 두는 자리
    var thenar = new T.Mesh(sphereGeo, mats.thumb);
    var wrist = new T.Mesh(new T.CylinderGeometry(2.5, 2.9, 11, 24), new T.MeshStandardMaterial({ color: COLOR.skin, roughness: 0.8, transparent: true, opacity: 0.55 }));
    hand.add(backOfHand, thenar, wrist, hypothenar);
    function dir(phi) { return new T.Vector3(0, Math.cos(phi * DEG), Math.sin(phi * DEG)); }
    function place(m, phi, rho, x) { m.position.copy(dir(phi).multiplyScalar(rho)).setX(x); }
    place(backOfHand, 52, 4.3, 5.2);
    backOfHand.scale.set(4.9, 2.2, 3.4);
    backOfHand.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir(52));
    place(hypothenar, 112, 3.35, 1.6);
    hypothenar.scale.set(1.9, 1.25, 1.7);
    hypothenar.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir(112));
    place(thenar, 12, 4.4, 4.6);
    thenar.scale.set(2.6, 1.7, 1.9);
    thenar.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir(12));
    var wristDir = dir(84).multiplyScalar(0.62).add(new T.Vector3(-0.78, 0, 0)).normalize();
    var wristBase = dir(70).multiplyScalar(5.6).setX(1.6);
    wrist.position.copy(wristBase).addScaledVector(wristDir, 5.5);
    wrist.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), wristDir);

    // V자 표시와 라벨
    var vMark = new T.Mesh(new T.TorusGeometry(0.75, 0.22, 10, 24), new T.MeshStandardMaterial({ color: 0xf59f00, emissive: 0x8a5300, roughness: 0.4 }));
    place(vMark, 2, 3.25, 7.6);
    vMark.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), dir(2));
    hand.add(vMark);
    var vLab = textSprite(T, "V자", "#d9480f", 36, true);
    vLab.position.copy(dir(-6).multiplyScalar(6.4)).setX(7.6);
    hand.add(vLab);
    var gapLab = textSprite(T, "검지 1~2 cm 띄움", "#1c7ed6", 32, true);
    hand.add(gapLab);
    var nameLabs = {};
    Object.keys(FINGER_NAMES).forEach(function (n) { nameLabs[n] = textSprite(T, FINGER_NAMES[n], "#5c4033", 28, true); hand.add(nameLabs[n]); });

    // ---- 상태 · 보간
    function snapshot(g) {
      var G = GRIPS[g], o = { rot: G.rot, f: {} };
      Object.keys(G.fingers).forEach(function (n) { o.f[n] = G.fingers[n].map(function (p) { return p.slice(); }); });
      return o;
    }
    function lerpState(a, b, t) {
      var o = { rot: a.rot + (b.rot - a.rot) * t, f: {} };
      Object.keys(a.f).forEach(function (n) {
        o.f[n] = a.f[n].map(function (p, j) { return p.map(function (v, k2) { return v + (b.f[n][j][k2] - v) * t; }); });
      });
      return o;
    }
    var cur = snapshot(grip), from = null, to = null, tw0 = 0;
    var V3 = T.Vector3, up = new V3(0, 1, 0), tmpA = new V3(), tmpB = new V3();

    function applyState(S) {
      racket.rotation.set(S.rot * DEG, 0, 0);
      Object.keys(parts).forEach(function (n) {
        var P = S.f[n].map(function (p) { return dir(p[0]).multiplyScalar(p[1]).setX(p[2]); });
        parts[n].joints.forEach(function (m, j) { m.position.copy(P[j]); });
        parts[n].segs.forEach(function (c, j) {
          tmpA.copy(P[j]); tmpB.copy(P[j + 1]);
          var len = tmpA.distanceTo(tmpB);
          c.position.copy(tmpA).add(tmpB).multiplyScalar(0.5);
          c.quaternion.setFromUnitVectors(up, tmpB.clone().sub(tmpA).normalize());
          var rr = RADIUS[n] * (j === 2 ? 0.95 : 1);
          c.scale.set(rr, len, rr);
        });
      });
      Object.keys(nameLabs).forEach(function (n) {
        var tip = S.f[n][3], dj = S.f[n][2];
        nameLabs[n].position.copy(dir(tip[0]).multiplyScalar(tip[1] + 2.2)).setX(tip[2] + (n === "index" ? 1.2 : 0));
      });
      // 검지 간격 라벨 : 정석일 때만
      var idx = S.f.index[0], mid = S.f.middle[0];
      var gap = idx[2] - mid[2] - RADIUS.index - RADIUS.middle;
      gapLab.visible = gap > 0.4;
      gapLab.position.copy(dir(108).multiplyScalar(6.8)).setX((idx[2] + mid[2]) / 2 + 1.6);
      // 면 방향 라벨
      var n2 = new V3(0, 0, -1).applyAxisAngle(new V3(1, 0, 0), S.rot * DEG);
      faceLab.position.set(56, 0, 0).addScaledVector(n2, 17.5).add(new V3(0, 1.8, 0));
    }

    function applyPress() {
      var map = PRESSURE[grip === "hammer" ? "hammer" : press];
      Object.keys(mats).forEach(function (n) {
        var c = COLOR[map[n] || "light"];
        mats[n].color.setHex(c);
        mats[n].emissive.setHex(map[n] === "pull" ? 0x3a1200 : map[n] === "brace" ? 0x0a1f3d : 0x000000);
      });
    }

    function renderCaption() {
      var C = CAPTION[grip];
      capTitle.innerHTML = "<b>" + C.title + "</b> — 손잡이를 반 면 돌려 쥐었는지(라켓 면 각도)와 손가락 자리를 비교해 보세요";
      if (grip === "hammer") capTitle.innerHTML = "<b>" + C.title + "</b> — 다섯 손가락이 한 덩어리로 뭉쳐 있습니다";
      capList.innerHTML = C.points.map(function (p) { return "<li>" + p + "</li>"; }).join("");
      capPress.innerHTML = PRESS_CAPTION[grip === "hammer" ? "hammer" : press] +
        ' · 라켓 면 : <b>' + (GRIPS[grip].rot ? "수직에서 약 " + Math.round(GRIPS[grip].rot) + "° 열림 (손가락이 감기며 실제 15~20°)" : "수직 (열리지 않음)") + "</b>";
      gripBar.set(grip);
      pressBar.set(grip === "hammer" ? "" : press);
      pressBar.el.style.opacity = grip === "hammer" ? 0.5 : 1;
    }

    function frame(now) {
      raf = 0;
      var again = false;
      if (to) {
        var t = Math.min(1, (now - tw0) / 700);
        cur = lerpState(from, to, ease(t));
        applyState(cur);
        if (t >= 1) to = null; else again = true;
      }
      if (camTo) {
        var c = Math.min(1, (now - cw0) / 650), e = ease(c);
        camera.position.lerpVectors(camFrom, camTo, e);
        controls.target.lerpVectors(tgtFrom, tgtTo, e);
        if (c >= 1) camTo = null; else again = true;
      }
      if (controls && controls.update()) again = true;
      renderer.render(scene, camera);
      if (again) self.invalidate();
    }

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.setGrip = function (g) {
      if (g === grip) return;
      grip = g;
      if (grip === "hammer") press = "relax";
      from = cur; to = snapshot(grip); tw0 = performance.now();
      if (reduce) { cur = to; to = null; applyState(cur); }
      applyPress(); renderCaption(); self.invalidate();
    };
    this.setPress = function (p) {
      if (grip === "hammer") return;
      press = p; applyPress(); renderCaption(); self.invalidate();
    };
    var camFrom = null, camTo = null, tgtFrom = null, tgtTo = null, cw0 = 0;
    function camDef(k) { return CAMS.filter(function (c) { return c.key === k; })[0] || CAMS[0]; }
    this.cam = function (k) {
      camKey = k;
      var d = camDef(k);
      camFrom = camera.position.clone(); camTo = new V3().fromArray(d.pos);
      tgtFrom = controls.target.clone(); tgtTo = new V3().fromArray(d.target);
      cw0 = performance.now();
      if (reduce) { camera.position.copy(camTo); controls.target.copy(tgtTo); camTo = null; }
      camBtns.forEach(function (b, i) { b.setAttribute("aria-pressed", CAMS[i].key === k ? "true" : "false"); });
      self.invalidate();
    };

    function resize() {
      if (!renderer) return;
      var w = view.clientWidth, h = view.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 1.3 ? 40 : 32;
      camera.updateProjectionMatrix();
      self.invalidate();
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(view); else window.addEventListener("resize", resize);
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) self.invalidate(); }).observe(view);

    applyState(cur);
    applyPress();
    renderCaption();
    if (renderer) {
      var d0 = camDef(camKey);
      camera.position.fromArray(d0.pos);
      controls.target.fromArray(d0.target);
      controls.update();
      camBtns.forEach(function (b, i) { b.setAttribute("aria-pressed", CAMS[i].key === camKey ? "true" : "false"); });
    }
    var p0 = host.getAttribute("data-press");
    if (p0 && PRESSURE[p0] && grip !== "hammer") { press = p0; applyPress(); renderCaption(); }
    resize();
    this.debug = { scene: scene, camera: camera, hand: hand, racket: racket };
  }

  function boot() {
    var hosts = Array.prototype.slice.call(document.querySelectorAll(".grip3d"));
    if (!hosts.length) return;
    if (!document.getElementById("grip3d-style")) {
      var st = document.createElement("style");
      st.id = "grip3d-style";
      st.textContent = STYLE;
      document.head.appendChild(st);
    }
    loadLibs().then(function (L) {
      window.__gripViewers = hosts.map(function (h) { return new Viewer(h, L); });
    }).catch(function (err) {
      hosts.forEach(function (h) { h.innerHTML = ""; h.appendChild(el("div", "g-msg", "3D 뷰어를 불러오지 못했습니다. 인터넷 연결(CDN)과 WebGL 지원을 확인해 주세요.")); });
      if (window.console) console.error("[grip3d]", err);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
