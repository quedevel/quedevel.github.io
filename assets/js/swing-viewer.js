/*
 * 스쿼시 노트 — Mannequin.js 3D 스윙 뷰어
 *
 * 사용법 (HTML·마크다운 공통)
 *   <div class="swing3d" data-swing="forehand"></div>   ← 또는 "backhand"
 *   <script src="assets/js/swing-viewer.js" defer></script>
 *
 * - Three.js · Mannequin.js 는 CDN(jsDelivr)에서 import map 으로 불러옵니다. 페이지에 import map 이 없으면 이 스크립트가 넣습니다.
 * - 한 페이지에 컨테이너가 여러 개 있어도 각각 독립된 캔버스·카메라·마네킹으로 그려집니다.
 * - 관절 각도는 아래 SWINGS 의 숫자가 그대로 마네킹 관절에 들어갑니다. 라켓 면 열림·팔꿈치 각 등은 3D 모델에서 다시 재서 캡션에 표시합니다.
 * - 오른손잡이 기준. 앞벽은 -z 방향, 바닥은 y = 0, 단위는 m.
 */
(function () {
  "use strict";

  var IMPORTS = {
    "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/",
    "mannequin": "https://cdn.jsdelivr.net/npm/mannequin-js@5.2.3/src/mannequin.js"
  };

  /* ------------------------------------------------------------------ *
   * 자세 데이터 (단위 : 도)
   *  hip      골반이 옆벽 정면에서 앞벽 쪽으로 열린 각 (음수 = 더 닫힘)
   *  chest    어깨선이 옆벽 정면에서 앞벽 쪽으로 열린 각
   *  hipLean / lean   골반 / 몸통의 앞으로 숙임
   *  arm      abd : 팔을 몸통 옆으로 벌린 각 (0 = 차렷, 90 = 어깨 높이)
   *           horiz : 벌린 팔이 몸 앞(+)·뒤(-)로 간 각 (0 = 몸통 옆 평면)
   *           er : 어깨 뒤로 젖히기 (0 = 아래팔이 앞을 향함, 90 = 위를 향함)
   *           elbow : 팔꿈치 굽힘 (0 = 완전히 폄 → 팔꿈치 각 = 180 - elbow)
   *  wrist    ext : 손등 쪽 젖힘, rad : 엄지 쪽 세움, pro : 아래팔 안으로 비틀기(+) / 바깥으로(-)
   *  face     임팩트에서 라켓 면 열림 목표 → pro 를 3D 모델에서 풀어 맞춤
   * ------------------------------------------------------------------ */
  var SWINGS = {
    forehand: {
      label: "포핸드 드라이브",
      side: 1,                       // +1 : 오른쪽 옆벽을 보고 섬
      front: "l",                    // 앞발
      legs: {
        l: { raise: 52, straddle: 14, turn: 0, knee: 72, foot: 40 },
        r: { raise: -22, straddle: 12, turn: 0, knee: 26, foot: -10 }
      },
      cams: { diag: [2.7, 1.0, 2.9], back: [0.3, 0.9, 3.9], side: [3.9, 0.5, -0.2], top: [0.01, 4.2, 0.4] },
      stages: [
        {
          name: "백스윙 준비",
          lead: "몸통을 감아 두고, 팔꿈치는 직각, 손목은 세워 둔다",
          points: [
            "어깨선이 골반보다 약 30° 더 돌아가 있음 (감아 둔 태엽)",
            "팔을 옆으로 약 75° 벌려 팔꿈치는 어깨 높이 또는 약간 아래, 굽힘 약 90° (80~100°)",
            "어깨 뒤로 젖히기 약 75° (60~90°) · 손목은 손등 쪽 약 38°, 엄지 쪽 약 20° 세움 → 라켓 머리는 머리 높이 이상"
          ],
          measure: ["sep", "elbow", "fr"],
          pose: {
            hip: -18, chest: -48, hipLean: 8, lean: 14, tilt: -4,
            head: { turn: 38, nod: 12 },
            arm: { abd: 75, horiz: -18, er: 75, elbow: 90 },
            wrist: { ext: 38, rad: 20, pro: -25 },
            larm: { abd: 62, horiz: 70, er: 10, elbow: 25 }
          }
        },
        {
          name: "다운스윙(래그)",
          lead: "골반·몸통이 먼저 돌고, 라켓 머리는 뒤에 남는다",
          points: [
            "골반이 먼저 앞벽 쪽으로 열리고 어깨선이 뒤따름",
            "팔꿈치 약 90° 유지 · 어깨는 약 110° (90~120°)까지 저절로 더 젖혀짐 — 고무줄이 가장 팽팽한 순간",
            "손목이 손등 쪽 약 60° (50~70°)까지 저절로 더 젖혀져, 라켓 머리가 손보다 뒤에 처져 늦게 따라옴"
          ],
          measure: ["sep", "elbow", "fr"],
          pose: {
            hip: 8, chest: -18, hipLean: 10, lean: 16, tilt: -6,
            head: { turn: 30, nod: 18 },
            arm: { abd: 72, horiz: 8, er: 112, elbow: 90 },
            wrist: { ext: 62, rad: 20, pro: -65 },
            larm: { abd: 58, horiz: 52, er: 10, elbow: 30 }
          }
        },
        {
          name: "임팩트",
          lead: "팔꿈치를 다 펴지 않고, 열린 면으로 평평하게 맞힌다",
          points: [
            "팔꿈치 각 약 150° (140~160°) — 완전히 펴지 않음 · 팔꿈치는 몸통 앞쪽으로 낮아짐",
            "라켓 머리는 손과 거의 같은 높이, 면은 수직에서 약 17° (15~20°) 열림",
            "라켓은 약 5~10° 내려오며 맞고, 공은 두 방향 사이인 약 14° 위로 출발"
          ],
          measure: ["elbow", "open", "height"],
          face: { open: 17 },
          pose: {
            hip: 32, chest: 18, hipLean: 15, lean: 18, tilt: -14,
            head: { turn: 10, nod: 30 },
            arm: { abd: 27, horiz: 101.5, er: 71.5, elbow: 30 },
            wrist: { ext: 15, rad: 20, pro: 0 },
            larm: { abd: 55, horiz: 20, er: 0, elbow: 35 }
          }
        },
        {
          name: "팔로우스루",
          lead: "맞은 뒤 라켓은 반대쪽 어깨 방향으로 감속한다",
          points: [
            "몸통이 앞벽 쪽으로 열리며 회전을 마무리",
            "아래팔이 안으로 비틀린 채 라켓이 왼쪽 어깨 쪽으로 감겨 올라감",
            "팔꿈치가 다시 접히며 남은 기세를 흡수"
          ],
          measure: ["elbow"],
          pose: {
            hip: 45, chest: 72, hipLean: 10, lean: 14, tilt: -4,
            head: { turn: -10, nod: 18 },
            arm: { abd: 63.5, horiz: 77, er: 70, elbow: 80 },
            wrist: { ext: 23, rad: 20, pro: 23 },
            larm: { abd: 40, horiz: -20, er: 0, elbow: 40 }
          }
        }
      ]
    },

    backhand: {
      label: "백핸드 드라이브",
      side: -1,                      // -1 : 왼쪽 옆벽을 보고 섬
      front: "r",
      legs: {
        r: { raise: 52, straddle: 14, turn: 0, knee: 72, foot: -40 },
        l: { raise: -22, straddle: 12, turn: 0, knee: 26, foot: 10 }
      },
      cams: { diag: [-2.7, 1.0, -2.8], back: [-0.3, 0.9, 3.9], side: [-3.9, 0.5, -0.2], top: [0.01, 4.2, 0.4] },
      stages: [
        {
          name: "백스윙 준비",
          lead: "어깨를 닫아 감고, 팔은 가슴 앞에 접어 둔다",
          points: [
            "어깨선은 옆벽보다 약 40° (30~45°) 더 돌아 등이 앞벽 쪽으로 살짝 보임 · 골반은 약 8°만 — 비틀림 약 30~40°",
            "팔꿈치 약 100° (90~110°)로 접고, 위팔은 가슴 앞을 약 40° 가로지름 · 손은 반대쪽 어깨 앞",
            "손목은 엄지 쪽 약 20° 세우고 앞뒤로는 거의 중립 · 라켓 머리는 반대쪽 어깨 위·뒤"
          ],
          measure: ["sep", "elbow", "fr"],
          pose: {
            hip: -8, chest: -42, hipLean: 8, lean: 16, tilt: 4,
            head: { turn: -50, nod: 14 },
            arm: { abd: 81, horiz: 132, er: 82, elbow: 80 },
            wrist: { ext: -7, rad: 20, pro: 59 },
            larm: { abd: 45, horiz: 75, er: 20, elbow: 95 }
          }
        },
        {
          name: "다운스윙(래그)",
          lead: "골반이 먼저 풀리고, 팔꿈치가 앞장서 나간다",
          points: [
            "골반이 먼저 앞벽 쪽으로 풀리고, 어깨선은 아직 닫힌 쪽에 남음",
            "팔꿈치가 잠깐 먼저 나가고, 라켓 머리는 손보다 뒤에 처짐",
            "반대 팔이 뒤로 빠지기 시작 — 몸통을 멈출 균형추"
          ],
          measure: ["sep", "elbow", "fr"],
          pose: {
            hip: 6, chest: -20, hipLean: 10, lean: 18, tilt: 4,
            head: { turn: -40, nod: 20 },
            arm: { abd: 76, horiz: 70, er: 20, elbow: 85 },
            wrist: { ext: -15, rad: 20, pro: 41 },
            larm: { abd: 45, horiz: 30, er: 10, elbow: 60 }
          }
        },
        {
          name: "임팩트",
          lead: "몸통은 거의 옆을 본 채 멈추고, 팔은 부채처럼 펼쳐진다",
          points: [
            "어깨선은 약 10° (0~15°)만 열림 · 반대 팔은 뒤로 뻗어 몸통을 멈춤 (버스 급정거)",
            "팔꿈치 각 약 168° (160~175°) — 거의 펴짐 · 타점은 앞발보다 약 20~40 cm 앞",
            "면은 수직에서 약 17° (15~20°) 열림 → 공은 약 14° 위로 출발"
          ],
          measure: ["elbow", "open", "ahead", "height"],
          face: { open: 17 },
          pose: {
            hip: 20, chest: 10, hipLean: 5, lean: 15, tilt: -25,
            head: { turn: -25, nod: 30 },
            arm: { abd: 55.5, horiz: 29, er: 0, elbow: 12 },
            wrist: { ext: 0, rad: 20, pro: 0 },
            larm: { abd: 65, horiz: -25, er: 0, elbow: 10 }
          }
        },
        {
          name: "팔로우스루",
          lead: "팔은 목표선 쪽 위로, 몸통은 옆을 본 채 남는다",
          points: [
            "어깨선은 크게 열리지 않고 옆을 본 자리 근처에 머묾",
            "팔은 어깨에서 계속 펼쳐져 앞벽 쪽 위로 올라감",
            "반대 팔은 뒤에 남아 균형을 잡음"
          ],
          measure: ["elbow"],
          pose: {
            hip: 25, chest: 22, hipLean: 8, lean: 10, tilt: 4,
            head: { turn: -25, nod: 10 },
            arm: { abd: 108.5, horiz: 16, er: 28, elbow: 18 },
            wrist: { ext: 6, rad: 20, pro: -22 },
            larm: { abd: 70, horiz: -30, er: 0, elbow: 15 }
          }
        }
      ]
    }
  };

  var MEASURE_LABEL = {
    sep: function (m) { return "어깨–골반 비틀림 " + Math.round(Math.abs(m.sep)) + "°"; },
    elbow: function (m) { return "팔꿈치 각 " + Math.round(m.elbow) + "°"; },
    fr: function (m) { return "아래팔–라켓 각 " + Math.round(m.fr) + "°"; },
    open: function (m) { return "면 열림 " + Math.round(m.open) + "°"; },
    height: function (m) { return "타점 높이 " + m.height.toFixed(2) + " m"; },
    ahead: function (m) { return "앞발보다 " + Math.round(m.ahead * 100) + " cm 앞"; }
  };

  var CAMS = [
    { key: "diag", label: "대각선" },
    { key: "back", label: "뒤에서" },
    { key: "side", label: "옆벽에서" },
    { key: "top", label: "위에서" }
  ];

  /* ------------------------------------------------------------------ */
  var STYLE = [
    ".swing3d{--sw-ink:#242424;--sw-ink2:#424242;--sw-muted:#737373;--sw-line:#e6e6e4;--sw-acc:#5b5fc7;--sw-acc-soft:#eeeefb;",
    "font-family:inherit;color:var(--sw-ink);background:#fff;border:1px solid var(--sw-line);border-radius:12px;padding:10px;margin:24px 0}",
    ".fig .swing3d{border:0;padding:0;margin:0}",
    ".swing3d>.sw-msg{position:static;min-height:220px}",
    ".sw-bar{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}",
    ".sw-bar button,.sw-cams button{font:inherit;cursor:pointer;border:1px solid var(--sw-line);background:#fff;color:var(--sw-ink2);border-radius:8px;transition:background .15s,border-color .15s,color .15s}",
    ".sw-step{flex:1 1 auto;white-space:nowrap;padding:7px 10px;font-size:.84rem;font-weight:600;text-align:left;display:flex;gap:7px;align-items:center}",
    ".sw-step .n{flex:none;display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#f0f0ee;color:var(--sw-muted);font-size:.74rem;font-weight:700}",
    ".sw-step:hover{background:#f7f7f6}",
    ".sw-step[aria-pressed=true]{border-color:var(--sw-acc);background:var(--sw-acc-soft);color:var(--sw-acc)}",
    ".sw-step[aria-pressed=true] .n{background:var(--sw-acc);color:#fff}",
    ".sw-play{flex:none;white-space:nowrap;padding:7px 12px;font-size:.84rem;font-weight:600}",
    ".sw-play:hover{background:#f7f7f6}",
    ".sw-view{position:relative;aspect-ratio:16/10;max-height:520px;width:100%;border-radius:8px;overflow:hidden;background:linear-gradient(#f4f6f9,#eceae5)}",
    ".sw-view canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}",
    ".sw-view canvas:active{cursor:grabbing}",
    ".sw-cams{position:absolute;top:8px;right:8px;display:flex;gap:4px}",
    ".sw-cams button{padding:3px 8px;font-size:.72rem;background:rgba(255,255,255,.88)}",
    ".sw-cams button[aria-pressed=true]{border-color:var(--sw-acc);color:var(--sw-acc)}",
    ".sw-hint{position:absolute;left:10px;bottom:8px;font-size:.7rem;color:var(--sw-muted);background:rgba(255,255,255,.8);padding:2px 7px;border-radius:6px;pointer-events:none}",
    ".sw-msg{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:16px;font-size:.84rem;color:var(--sw-muted)}",
    ".sw-cap{margin:10px 4px 2px}",
    ".sw-cap-title{margin:0 0 4px;font-size:.92rem;color:var(--sw-ink)}",
    ".sw-cap-title b{color:var(--sw-acc)}",
    ".sw-cap ul{margin:0;padding-left:1.1em;font-size:.84rem;color:var(--sw-ink2);line-height:1.6}",
    ".sw-measure{margin:6px 0 0;font-size:.78rem;color:var(--sw-muted)}",
    ".sw-measure span{display:inline-block;margin:2px 6px 0 0;padding:1px 8px;border-radius:999px;background:#f3f3f1;color:var(--sw-ink2);font-variant-numeric:tabular-nums}",
    ".sw-legend{margin:6px 0 0;font-size:.74rem;color:var(--sw-muted)}",
    ".sw-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin:0 4px 0 0;vertical-align:-1px}",
    "@media (max-width:600px){.sw-view{aspect-ratio:4/3.4}.sw-step{min-width:calc(50% - 3px);flex:1 1 calc(50% - 3px)}.sw-play{flex:1 1 100%}.sw-cams{top:6px;right:6px}.sw-cams button{padding:2px 6px}}"
  ].join("");

  var DEG = Math.PI / 180;
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerpPose(a, b, t) {
    var o = {};
    for (var k in b) {
      if (typeof b[k] === "number") o[k] = lerp(a[k], b[k], t);
      else if (b[k] && typeof b[k] === "object") o[k] = lerpPose(a[k], b[k], t);
    }
    return o;
  }
  function clone(p) { return JSON.parse(JSON.stringify(p)); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function ensureImportMap() {
    if (document.querySelector('script[type="importmap"]')) return;
    var s = document.createElement("script");
    s.type = "importmap";
    s.textContent = JSON.stringify({ imports: IMPORTS });
    (document.head || document.documentElement).appendChild(s);
  }

  var libPromise = null;
  function loadLibs() {
    if (libPromise) return libPromise;
    ensureImportMap();
    var headBefore = new Set(Array.prototype.slice.call(document.head.children));
    libPromise = Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
      import("mannequin")
    ]).then(function (mods) {
      var M = mods[2];
      // Mannequin.js 는 불러오는 순간 전체 화면 캔버스·favicon·viewport 를 붙인다 → 걷어 낸다
      try {
        var st = M.getStage();
        st.renderer.setAnimationLoop(null);
        st.renderer.domElement.remove();
        st.renderer.dispose();
        st.renderer.forceContextLoss();
      } catch (e) { /* 버전에 따라 없을 수 있음 */ }
      Array.prototype.slice.call(document.head.children).forEach(function (n) {
        if (headBefore.has(n)) return;
        if (n.matches('link[rel="icon"]') || n.matches('meta[name="viewport"]')) n.remove();
      });
      return { T: mods[0], OrbitControls: mods[1].OrbitControls, M: M };
    });
    return libPromise;
  }

  /* ------------------------------------------------------------------ *
   * 리그 : 마네킹 + 라켓 + 관절 세팅
   * ------------------------------------------------------------------ */
  function makeRacket(T) {
    var g = new T.Group();
    var frameM = new T.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.45, metalness: 0.25 });
    var gripM = new T.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.9 });
    var bumperM = new T.MeshStandardMaterial({ color: 0xd94f2b, roughness: 0.6 });
    // 손잡이 : y = -0.06 ~ 0.20, 샤프트 : 0.20 ~ 0.39, 머리 : 중심 0.50 (686 mm 라켓)
    var grip = new T.Mesh(new T.CylinderGeometry(0.0135, 0.0145, 0.26, 14), gripM);
    grip.position.y = 0.07;
    var shaft = new T.Mesh(new T.CylinderGeometry(0.0062, 0.009, 0.20, 10), frameM);
    shaft.position.y = 0.295;
    var pts = [];
    for (var i = 0; i < 64; i++) {
      var a = i / 64 * Math.PI * 2;
      pts.push(new T.Vector3(0, 0.50 + 0.125 * Math.sin(a), 0.095 * Math.cos(a)));
    }
    var hoop = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 96, 0.0075, 8, true), frameM);
    var top = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.slice(10, 23), false), 20, 0.0085, 8, false), bumperM);
    var shape = new T.Shape();
    shape.absellipse(0, 0, 0.088, 0.118, 0, Math.PI * 2, false, 0);
    var bedGeo = new T.ShapeGeometry(shape, 40);
    bedGeo.rotateY(Math.PI / 2);          // 면을 y–z 평면에, 법선을 +x 로
    bedGeo.translate(0, 0.50, 0);
    var bed = new T.Mesh(bedGeo, new T.MeshStandardMaterial({ color: 0xdfe5ec, transparent: true, opacity: 0.55, side: T.DoubleSide, roughness: 1, depthWrite: false }));
    var lines = [];
    for (var z = -0.08; z <= 0.081; z += 0.016) {
      var h = 0.118 * Math.sqrt(Math.max(0, 1 - (z / 0.088) * (z / 0.088)));
      lines.push(0, 0.50 - h, z, 0, 0.50 + h, z);
    }
    for (var y = -0.108; y <= 0.109; y += 0.018) {
      var w = 0.088 * Math.sqrt(Math.max(0, 1 - (y / 0.118) * (y / 0.118)));
      lines.push(0, 0.50 + y, -w, 0, 0.50 + y, w);
    }
    var sg = new T.BufferGeometry();
    sg.setAttribute("position", new T.Float32BufferAttribute(lines, 3));
    var strings = new T.LineSegments(sg, new T.LineBasicMaterial({ color: 0x8a96a6, transparent: true, opacity: 0.7 }));
    [grip, shaft, hoop, top].forEach(function (m) { m.castShadow = true; });
    g.add(grip, shaft, hoop, top, bed, strings);
    g.userData.sweet = new T.Vector3(0, 0.48, 0);
    g.userData.butt = new T.Vector3(0, -0.06, 0);
    g.userData.tip = new T.Vector3(0, 0.625, 0);
    return g;
  }

  function createRig(L, cfg) {
    var T = L.T, M = L.M;
    var root = new T.Group();
    var turn = new T.Group();
    turn.rotation.y = cfg.side * Math.PI / 2;      // 마네킹 기본 정면 +z → 포핸드 +x, 백핸드 -x
    root.add(turn);
    var man = new M.Male(1.78);
    turn.add(man);
    man.position.set(0, 0, 0);

    // 색 : 치는 팔의 위팔(파랑)·아래팔(초록)을 도표와 같은 색으로
    man.recolor("#efe3cf", "#5d6470", "#e6d7bf", "#cdb08a", "#efe3cf", "#f3e8d6", "#cdb08a");
    man.r_arm.recolor("#3b82d6", "#cdb08a");
    man.r_elbow.recolor("#2f9a57", "#cdb08a");

    // 그립 : 손가락을 손잡이에 감음
    [1, 2, 3, 4].forEach(function (i) {
      var f = man["r_finger_" + i];
      f.bend = 75; f.mid.bend = 80; f.tip.bend = 45;
    });
    man.r_finger_0.straddle = 30; man.r_finger_0.bend = 25; man.r_finger_0.mid.bend = 30; man.r_finger_0.tip.bend = 20;
    [1, 2, 3, 4].forEach(function (i) {
      var f = man["l_finger_" + i];
      f.bend = 35; f.mid.bend = 40; f.tip.bend = 25;
    });

    man.updateMatrixWorld(true);
    var ws = new T.Vector3();
    man.r_wrist.imageWrapper.getWorldScale(ws);
    var racket = makeRacket(T);
    var holder = new T.Group();
    holder.add(racket);
    man.r_wrist.attach(holder);
    holder.scale.setScalar(1 / ws.x);
    // 손 좌표 : +y 손끝, +x 손등, +z 엄지 쪽. 손잡이는 엄지 쪽으로 55° 기울어 쥠 (중립에서 아래팔–라켓 약 125°)
    holder.position.set(-0.9, 2.7, -0.3);
    holder.rotation.set(55 * DEG, 0, 0);

    // 발 : 골반이 돌아도 다리·발은 바닥에 고정
    var bodyQ = new T.Quaternion();
    var stance = {};
    ["l", "r"].forEach(function (s) {
      var lr = s === "l" ? -1 : 1, L2 = cfg.legs[s];
      stance[s] = {
        q: new T.Quaternion().setFromEuler(new T.Euler(-lr * L2.straddle * DEG, -lr * L2.turn * DEG, L2.raise * DEG, "ZXY")),
        knee: L2.knee, foot: L2.foot
      };
    });
    // 발이 바닥과 평평할 때의 방향 (몸 기준) 기록
    man.pelvis.rotation.set(0, 0, 0);
    ["l", "r"].forEach(function (s) {
      man[s + "_leg"].rotation.set(0, 0, 0);
      man[s + "_knee"].rotation.set(0, 0, 0);
      man[s + "_ankle"].rotation.set(0, 0, 0);
    });
    man.updateMatrixWorld(true);
    man.body.getWorldQuaternion(bodyQ);
    var footRel = {};
    ["l", "r"].forEach(function (s) {
      var q = new T.Quaternion();
      man[s + "_ankle"].getWorldQuaternion(q);
      footRel[s] = bodyQ.clone().invert().multiply(q);
    });

    var V = T.Vector3;
    var tmpQ = new T.Quaternion(), tmpQ2 = new T.Quaternion(), mtx = new T.Matrix4();
    var box = new T.Box3(), box2 = new T.Box3();
    var yAxis = new V(0, 1, 0);

    function setArm(armJ, elbowJ, A, lr) {
      var a = A.abd * DEG, h = A.horiz * DEG, er = A.er * DEG;
      // 몸통 옆 평면에서 벌린 팔(기준 : 아래팔이 앞을 향함)을 세로축으로 horiz 만큼 앞뒤로 돌린다
      var u = new V(0, -Math.cos(a), lr * Math.sin(a));
      var n0 = new V(1, 0, 0);
      var w = new V().crossVectors(u, n0).multiplyScalar(lr);
      tmpQ2.setFromAxisAngle(yAxis, lr * h);
      u.applyQuaternion(tmpQ2); n0.applyQuaternion(tmpQ2); w.applyQuaternion(tmpQ2);
      var p = n0.clone().multiplyScalar(Math.cos(er)).addScaledVector(w, Math.sin(er)).normalize();
      var y = u.clone().negate();
      var z = new V().crossVectors(p, y).normalize();
      mtx.makeBasis(p, y, z);
      armJ.quaternion.setFromRotationMatrix(mtx);
      elbowJ.rotation.set(0, 0, A.elbow * DEG);
    }

    function apply(P) {
      var ys = cfg.side;     // 앞벽 쪽으로 열기 = 포핸드 왼쪽(+), 백핸드 오른쪽(-) 회전
      man.pelvis.rotation.set(0, ys * P.hip * DEG, -P.hipLean * DEG, "YXZ");
      man.torso.rotation.set(-(P.tilt || 0) * DEG, ys * (P.chest - P.hip) * DEG, -P.lean * DEG, "YXZ");
      man.head.rotation.set(0, P.head.turn / 2 * DEG, -P.head.nod / 2 * DEG, "YXZ");
      man.neck.rotation.copy(man.head.rotation);
      setArm(man.r_arm, man.r_elbow, P.arm, 1);
      setArm(man.l_arm, man.l_elbow, P.larm, -1);
      man.r_wrist.rotation.set(P.wrist.ext * DEG, -P.wrist.pro * DEG, P.wrist.rad * DEG, "YXZ");
      man.l_wrist.rotation.set(0, 0, 0);
      tmpQ.copy(man.pelvis.quaternion).invert();
      ["l", "r"].forEach(function (s) {
        man[s + "_leg"].quaternion.copy(tmpQ).multiply(stance[s].q);
        man[s + "_knee"].rotation.set(0, 0, stance[s].knee * DEG);
      });
      root.position.y = 0;
      root.updateMatrixWorld(true);
      // 발바닥을 바닥과 평평하게
      ["l", "r"].forEach(function (s) {
        var ank = man[s + "_ankle"];
        var target = bodyQ.clone().multiply(tmpQ2.setFromAxisAngle(yAxis, stance[s].foot * DEG)).multiply(footRel[s]);
        ank.parent.getWorldQuaternion(tmpQ);
        ank.quaternion.copy(tmpQ.invert().multiply(target));
      });
      root.updateMatrixWorld(true);
      box.setFromObject(man.l_ankle);
      box2.setFromObject(man.r_ankle);
      root.position.y = -Math.min(box.min.y, box2.min.y);
      root.updateMatrixWorld(true);
    }

    function wp(obj, local) {
      var v = local ? local.clone() : new V();
      return obj.localToWorld(v);
    }

    function measure(P) {
      var sh = wp(man.r_arm), elb = wp(man.r_elbow), wr = wp(man.r_wrist);
      var sweet = wp(racket, racket.userData.sweet), butt = wp(racket, racket.userData.butt), tip = wp(racket, racket.userData.tip);
      var axis = tip.clone().sub(butt).normalize();
      var nq = new T.Quaternion();
      racket.getWorldQuaternion(nq);
      var n = new V(1, 0, 0).applyQuaternion(nq);
      if (n.z > 0) n.negate();                        // 앞벽(-z) 쪽을 보는 면
      var frontAnk = wp(man[cfg.front + "_ankle"]);
      return {
        sep: P.chest - P.hip,
        elbow: sh.clone().sub(elb).angleTo(wr.clone().sub(elb)) / DEG,
        fr: elb.clone().sub(wr).angleTo(axis) / DEG,
        open: Math.asin(Math.max(-1, Math.min(1, n.y))) / DEG,
        aim: Math.atan2(n.x, -n.z) / DEG,
        normal: n,
        sweet: sweet,
        height: sweet.y,
        ahead: frontAnk.z - sweet.z,
        headY: sweet.y,
        handY: wr.y
      };
    }

    return { root: root, man: man, racket: racket, apply: apply, measure: measure };
  }

  /* ------------------------------------------------------------------ *
   * 장면 소품
   * ------------------------------------------------------------------ */
  function textSprite(T, text, color, px) {
    var c = document.createElement("canvas");
    var ctx = c.getContext("2d");
    var font = "600 " + (px || 44) + "px 'Pretendard Variable', Pretendard, 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";
    ctx.font = font;
    var w = Math.ceil(ctx.measureText(text).width) + 24, h = (px || 44) + 20;
    c.width = w; c.height = h;
    ctx.font = font;
    ctx.fillStyle = "rgba(255,255,255,.85)";
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(0, 0, w, h, 12); ctx.fill(); } else ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color || "#5b6472";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 12, h / 2 + 2);
    var tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    var s = new T.Sprite(new T.SpriteMaterial({ map: tex, depthTest: false, transparent: true, sizeAttenuation: false }));
    s.renderOrder = 10;
    var k = 0.034 / h;                    // 화면 높이의 약 6% — 카메라 거리와 관계없이 같은 크기
    s.scale.set(w * k, h * k, 1);
    return s;
  }

  /* ------------------------------------------------------------------ *
   * 뷰어
   * ------------------------------------------------------------------ */
  function Viewer(host, L) {
    var T = L.T;
    var kind = host.getAttribute("data-swing") === "backhand" ? "backhand" : "forehand";
    var cfg = SWINGS[kind];
    var stages = cfg.stages;
    var self = this;
    this.host = host;
    var renderer = null, raf = 0, visible = true;
    this.invalidate = function () {
      if (!renderer || raf || !visible) return;
      raf = requestAnimationFrame(frame);
    };

    var rig = createRig(L, cfg);

    // 임팩트 면 열림 목표 → 아래팔 비틀기(pro) 값을 3D 모델에서 풀어 고정
    stages.forEach(function (st) {
      if (!st.face) return;
      var best = null;
      for (var pro = -90; pro <= 90; pro += 1) {
        st.pose.wrist.pro = pro;
        rig.apply(st.pose);
        var m = rig.measure(st.pose);
        var err = Math.abs(m.open - st.face.open) + 0.02 * Math.abs(m.aim);
        if (m.normal.z < -0.5 && (!best || err < best.err)) best = { err: err, pro: pro };
      }
      if (best) {
        var lo = best.pro - 1, hi = best.pro + 1;
        for (var p2 = lo; p2 <= hi; p2 += 0.05) {
          st.pose.wrist.pro = p2;
          rig.apply(st.pose);
          var m2 = rig.measure(st.pose);
          var e2 = Math.abs(m2.open - st.face.open) + 0.02 * Math.abs(m2.aim);
          if (e2 < best.err) best = { err: e2, pro: p2 };
        }
        st.pose.wrist.pro = best.pro;
      }
    });

    // 단계별 측정값 + 라켓 머리가 지나가는 길
    var measures = stages.map(function (st) { rig.apply(st.pose); return rig.measure(st.pose); });
    var trail = [], impactStage = -1;
    stages.forEach(function (st, i) { if (st.face) impactStage = i; });
    for (var s = 0; s < stages.length - 1; s++) {
      for (var k = 0; k < 40; k++) {
        var t = k / 40;
        var P = lerpPose(stages[s].pose, stages[s + 1].pose, t);
        rig.apply(P);
        trail.push(rig.measure(P).sweet);
      }
    }
    rig.apply(stages[stages.length - 1].pose);
    trail.push(rig.measure(stages[stages.length - 1].pose).sweet);
    var impact = measures[impactStage] || measures[0];

    // ---- DOM
    host.innerHTML = "";
    host.classList.add("swing3d");
    var bar = el("div", "sw-bar");
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", cfg.label + " 단계");
    var stepBtns = stages.map(function (st, i) {
      var b = el("button", "sw-step");
      b.type = "button";
      b.appendChild(el("span", "n", String(i + 1)));
      b.appendChild(document.createTextNode(st.name));
      b.addEventListener("click", function () { self.stopPlay(); self.go(i); });
      bar.appendChild(b);
      return b;
    });
    var playBtn = el("button", "sw-play", "▶ 이어 보기");
    playBtn.type = "button";
    playBtn.addEventListener("click", function () { self.play(); });
    bar.appendChild(playBtn);

    var view = el("div", "sw-view");
    var cams = el("div", "sw-cams");
    var camBtns = CAMS.map(function (c) {
      var b = el("button", null, c.label);
      b.type = "button";
      b.addEventListener("click", function () { self.cam(c.key); });
      cams.appendChild(b);
      return b;
    });
    var hint = el("div", "sw-hint", "드래그 : 돌려 보기 · 휠/두 손가락 : 확대");
    var cap = el("div", "sw-cap");
    cap.setAttribute("aria-live", "polite");
    var capTitle = el("p", "sw-cap-title");
    var capList = el("ul");
    var capMeasure = el("p", "sw-measure");
    var legend = el("p", "sw-legend");
    legend.innerHTML = '<i style="background:#3b82d6"></i>위팔 &nbsp; <i style="background:#2f9a57"></i>아래팔 &nbsp; <i style="background:#e8743b"></i>라켓 머리가 지나가는 길 &nbsp; <i style="background:#f5a623;border-radius:50%"></i>타점 &nbsp; <i style="background:#7c4dff"></i>면이 바라보는 방향 &nbsp; <i style="background:#2f80ed"></i>공이 나가는 방향';
    cap.append(capTitle, capList, capMeasure, legend);
    host.append(bar, view, cap);

    // ---- three
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      view.appendChild(el("div", "sw-msg", "이 브라우저에서는 3D(WebGL)를 표시할 수 없습니다. 아래 단계 설명은 그대로 볼 수 있습니다."));
      renderer = null;
    }
    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(30, 1.6, 0.05, 60);
    var controls = null;
    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      renderer.domElement.setAttribute("aria-label", cfg.label + " 3D 마네킹 — 드래그해서 돌려 볼 수 있음");
      renderer.domElement.setAttribute("role", "img");
      view.append(renderer.domElement, cams, hint);
      controls = new L.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.12;
      controls.minDistance = 1.2;
      controls.maxDistance = 9;
      controls.maxPolarAngle = Math.PI * 0.495;
      controls.addEventListener("change", function () { self.invalidate(); });
    }

    scene.add(new T.HemisphereLight(0xffffff, 0xd9cdb8, 1.5));
    var sun = new T.DirectionalLight(0xffffff, 1.9);
    sun.position.set(2.5, 6, 3.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -2.5; sun.shadow.camera.right = 2.5;
    sun.shadow.camera.top = 2.5; sun.shadow.camera.bottom = -2.5;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 14;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);

    // 바닥 · 옆벽 · 앞벽 방향
    var center = new T.Vector3(impact.sweet.x * 0.5, 0, impact.sweet.z * 0.5 + 0.1);
    var floor = new T.Mesh(new T.PlaneGeometry(9, 9), new T.MeshStandardMaterial({ color: 0xf1e7d6, roughness: 0.95 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    var grid = new T.GridHelper(9, 18, 0xdccfb8, 0xe6dccb);
    grid.position.y = 0.002;
    scene.add(grid);
    var wallX = impact.sweet.x + cfg.side * 0.55;
    var wallLine = new T.Mesh(new T.BoxGeometry(0.03, 0.01, 6), new T.MeshBasicMaterial({ color: 0xc23b3b }));
    wallLine.position.set(wallX, 0.005, -0.5);
    var wall = new T.Mesh(new T.PlaneGeometry(6, 2.2), new T.MeshBasicMaterial({ color: 0x9aa7b8, transparent: true, opacity: 0.12, side: T.DoubleSide, depthWrite: false }));
    wall.rotation.y = Math.PI / 2;
    wall.position.set(wallX, 1.1, -0.5);
    var wallLabel = textSprite(T, "옆벽", "#8a5a5a", 40);
    wallLabel.position.set(wallX, 0.12, 1.3);
    scene.add(wallLine, wall, wallLabel);
    var fwArrow = new T.ArrowHelper(new T.Vector3(0, 0, -1), new T.Vector3(center.x, 0.01, 1.7), 0.9, 0x8a94a6, 0.18, 0.1);
    var fwLabel = textSprite(T, "앞벽 방향 ↑", "#5b6472", 40);
    fwLabel.position.set(center.x, 0.1, 1.95);
    scene.add(fwArrow, fwLabel);

    scene.add(rig.root);

    // 라켓 머리 길
    var trailGeo = new T.BufferGeometry().setFromPoints(trail);
    var trailLine = new T.Line(trailGeo, new T.LineDashedMaterial({ color: 0xe8743b, dashSize: 0.05, gapSize: 0.03, transparent: true, opacity: 0.9 }));
    trailLine.computeLineDistances();
    scene.add(trailLine);

    // 타점의 공 · 면 방향 · 공 출발 방향
    var ball = new T.Mesh(new T.SphereGeometry(0.024, 24, 16), new T.MeshStandardMaterial({ color: 0xf5a623, roughness: 0.5 }));
    ball.position.copy(impact.sweet).addScaledVector(impact.normal, 0.03);
    ball.castShadow = true;
    scene.add(ball);
    var faceArrow = new T.ArrowHelper(impact.normal, impact.sweet, 0.42, 0x7c4dff, 0.08, 0.045);
    var launch = new T.Vector3(0, Math.sin(14 * DEG), -Math.cos(14 * DEG));
    var launchArrow = new T.ArrowHelper(launch, ball.position, 0.9, 0x2f80ed, 0.1, 0.05);
    scene.add(faceArrow, launchArrow);

    // ---- 상태
    var curPose = clone(stages[0].pose), fromPose = null, toPose = null, tw0 = 0, twDur = 0, twDone = null;
    var camFrom = null, camTo = null, tgtFrom = null, tgtTo = null, cw0 = 0;
    var stageIdx = 0, camKey = "diag", playing = false, playTimer = 0;
    var target = new T.Vector3(center.x, 0.95, center.z);
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function camPos(key) {
      var o = cfg.cams[key];
      return new T.Vector3(target.x + o[0], target.y + o[1], target.z + o[2]);
    }
    camera.position.copy(camPos(camKey));
    camera.lookAt(target);
    if (controls) { controls.target.copy(target); controls.update(); }

    function updateExtras() {
      var atImpact = stageIdx === impactStage && !toPose;
      faceArrow.visible = atImpact;
      launchArrow.visible = atImpact;
    }

    function renderCaption() {
      var st = stages[stageIdx], m = measures[stageIdx];
      capTitle.innerHTML = "";
      var b = el("b", null, (stageIdx + 1) + ". " + st.name);
      capTitle.append(b, document.createTextNode(" — " + st.lead));
      capList.innerHTML = "";
      st.points.forEach(function (p) { capList.appendChild(el("li", null, p)); });
      capMeasure.innerHTML = "";
      capMeasure.appendChild(document.createTextNode("3D 모델에서 잰 값 "));
      st.measure.forEach(function (key) {
        var txt = MEASURE_LABEL[key](m);
        if (txt) capMeasure.appendChild(el("span", null, txt));
      });
      stepBtns.forEach(function (bt, i) { bt.setAttribute("aria-pressed", i === stageIdx ? "true" : "false"); });
    }

    function renderCams() {
      camBtns.forEach(function (bt, i) { bt.setAttribute("aria-pressed", CAMS[i].key === camKey ? "true" : "false"); });
    }


    function frame(now) {
      raf = 0;
      var again = false;
      if (toPose) {
        var t = twDur ? Math.min(1, (now - tw0) / twDur) : 1;
        curPose = lerpPose(fromPose, toPose, ease(t));
        rig.apply(curPose);
        if (t >= 1) {
          toPose = null;
          updateExtras();
          var cb = twDone; twDone = null;
          if (cb) cb();
        } else again = true;
      }
      if (camTo) {
        var c = Math.min(1, (now - cw0) / 650), e = ease(c);
        camera.position.lerpVectors(camFrom, camTo, e);
        if (controls) controls.target.lerpVectors(tgtFrom, tgtTo, e);
        if (c >= 1) camTo = null; else again = true;
      }
      if (controls && controls.update()) again = true;
      renderer.render(scene, camera);
      if (again || toPose) self.invalidate();
    }

    this.go = function (i, dur, done) {
      stageIdx = i;
      fromPose = clone(curPose);
      toPose = clone(stages[i].pose);
      twDur = reduce ? 0 : (dur == null ? 750 : dur);
      tw0 = performance.now();
      twDone = done || null;
      updateExtras();
      renderCaption();
      self.invalidate();
    };

    this.cam = function (key) {
      camKey = key;
      camFrom = camera.position.clone();
      camTo = camPos(key);
      tgtFrom = controls ? controls.target.clone() : target.clone();
      tgtTo = target.clone();
      cw0 = performance.now();
      if (reduce) { camera.position.copy(camTo); if (controls) controls.target.copy(tgtTo); camTo = null; }
      renderCams();
      self.invalidate();
    };

    this.stopPlay = function () {
      playing = false;
      clearTimeout(playTimer);
      playBtn.textContent = "▶ 이어 보기";
    };

    this.play = function () {
      if (playing) { self.stopPlay(); return; }
      playing = true;
      playBtn.textContent = "■ 멈춤";
      // 백스윙에서 잠깐 멈췄다가 → 래그는 천천히 → 임팩트까지는 빠르게 → 팔로우스루
      var seq = [[0, 450, 500], [1, 650, 350], [2, 260, 700], [3, 520, 0]];
      var n = 0;
      function next() {
        if (!playing) return;
        if (n >= seq.length) { self.stopPlay(); return; }
        var s = seq[n++];
        self.go(s[0], s[1], function () { playTimer = setTimeout(next, s[2]); });
      }
      next();
    };

    // 크기 · 화면에 보일 때만 그리기
    function resize() {
      if (!renderer) return;
      var w = view.clientWidth, h = view.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 1.3 ? 38 : 30;
      camera.updateProjectionMatrix();
      self.invalidate();
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(view);
    else window.addEventListener("resize", resize);
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible) self.invalidate();
      }).observe(view);
    }
    T.DefaultLoadingManager.onLoad = function () { self.invalidate(); };
    [120, 600, 1500].forEach(function (ms) { setTimeout(function () { self.invalidate(); }, ms); });

    // 초기 상태 (data-stage / data-cam 로 지정 가능)
    var s0 = parseInt(host.getAttribute("data-stage"), 10);
    stageIdx = s0 >= 1 && s0 <= stages.length ? s0 - 1 : 0;
    curPose = clone(stages[stageIdx].pose);
    rig.apply(curPose);
    var c0 = host.getAttribute("data-cam");
    if (c0 && cfg.cams[c0]) { camKey = c0; camera.position.copy(camPos(c0)); camera.lookAt(target); if (controls) controls.update(); }
    updateExtras();
    renderCaption();
    renderCams();
    resize();

    this.debug = { camera: camera, controls: controls, rig: rig, measures: measures, stages: stages, trail: trail };
  }

  /* ------------------------------------------------------------------ */
  function boot() {
    var hosts = Array.prototype.slice.call(document.querySelectorAll(".swing3d[data-swing]"));
    if (!hosts.length) return;
    if (!document.getElementById("swing3d-style")) {
      var st = document.createElement("style");
      st.id = "swing3d-style";
      st.textContent = STYLE;
      document.head.appendChild(st);
    }
    hosts.forEach(function (h) {
      if (!h.firstChild) h.appendChild(el("div", "sw-msg", "3D 마네킹을 불러오는 중…"));
    });
    loadLibs().then(function (L) {
      window.__swingViewers = hosts.map(function (h) { return new Viewer(h, L); });
    }).catch(function (err) {
      hosts.forEach(function (h) {
        h.innerHTML = "";
        h.appendChild(el("div", "sw-msg", "3D 뷰어를 불러오지 못했습니다. 인터넷 연결(CDN)과 WebGL 지원을 확인해 주세요."));
      });
      if (window.console) console.error("[swing3d]", err);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
