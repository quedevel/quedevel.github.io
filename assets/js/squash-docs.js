/*
 * 스쿼시 노트 문서 목록 — 단일 소스
 * - index.html 의 카드·로드맵, 문서 하단의 이전/다음 글 링크가 모두 이 배열에서 만들어집니다.
 * - 새 문서를 발행하면 해당 항목의 status 를 "published" 로 바꾸고 href·thumb·meta 를 채우세요.
 * - 배열 순서가 곧 읽는 순서(이전/다음 글 순서)입니다.
 */
window.SQUASH_SERIES = {
  principle: { icon: "🔬", title: "기초 원리", desc: "샷이 왜 그렇게 날아가는지, 역학으로 이해하기" },
  tactics:   { icon: "♟️", title: "단식 전술 시리즈", desc: "랠리의 기본 골격에서 상황별 정석까지" },
  training:  { icon: "🏋️", title: "훈련 세션", desc: "전술을 몸에 새기는 인원별 훈련 프로그램" }
};

window.SQUASH_DOCS = [
  {
    id: "drive-mechanics", icon: "🌀", tone: "blue",
    series: "principle",
    status: "published",
    href: "스쿼시_정석드라이브_역학원리.html",
    title: "스쿼시 정석 드라이브의 물리·역학 원리",
    desc: "프로의 드라이브는 왜 바운드 후에도 백월까지 뻗고, 동호인의 공은 왜 비슷한 자리에서 죽을까? 공의 성질부터 스윙·임팩트·스핀까지 역학으로 풀어 봅니다.",
    tags: ["드라이브", "역학", "스핀"],
    thumb: "images/드라이브_궤적비교.svg",
    meta: "도표 6장 · 약 15분"
  },
  {
    id: "forehand-biomechanics", icon: "🦾", tone: "teal",
    series: "principle",
    status: "published",
    href: "스쿼시_포핸드_생체역학.html",
    title: "포핸드 드라이브의 생체역학",
    desc: "프로의 포핸드는 왜 힘을 꽉 주지 않는데도 공이 백월까지 뻗을까? 팔 각도가 만드는 지렛대, 채찍처럼 늦게 따라오는 라켓 머리, 라켓이 지나가는 길과 면의 각도까지 쉬운 말로 풀어 봅니다.",
    tags: ["포핸드", "생체역학", "채찍 효과"],
    thumb: "images/포핸드_관절세팅.svg",
    meta: "도표 4장 · 3D 뷰어 · 약 20분"
  },
  {
    id: "backhand-biomechanics", icon: "🪃", tone: "violet",
    series: "principle",
    status: "published",
    href: "스쿼시_백핸드_생체역학.html",
    title: "백핸드 드라이브의 생체역학",
    desc: "프로의 백핸드는 왜 가볍게 휘두르는데도 벽을 따라 깊게 뻗을까? 닫아 둔 어깨, 일찍 멈추는 몸통, 어깨에서 부채처럼 펼쳐지는 팔, 아래팔 비틀기의 타이밍까지 쉬운 말로 풀어 봅니다.",
    tags: ["백핸드", "생체역학", "몸통 브레이크"],
    thumb: "images/백핸드_관절세팅.svg",
    meta: "도표 3장 · 3D 뷰어 · 약 20분"
  },
  {
    id: "singles-tactics", icon: "📐", tone: "violet",
    series: "tactics",
    no: 0,
    status: "published",
    href: "스쿼시_단식_경기운용_전술.html",
    title: "스쿼시 단식 경기 운용과 전술의 원리",
    desc: "상대 위치에 따른 샷 선택, 다이나믹 T 대기 위치, 페이스 변화와 헌팅, 빌드업 패턴까지. 프로의 정석 경기 운용을 코트의 기하학과 동선으로 풀어 봅니다.",
    tags: ["전술", "샷 선택", "T 포지션"],
    thumb: "images/전술_샷선택_3상황.svg",
    meta: "도표 3장 · 약 20분"
  },
  {
    id: "serve-return", icon: "🎯", tone: "teal",
    series: "tactics", no: 1, status: "published",
    href: "스쿼시_서브와_리턴_전술.html",
    title: "서브와 리턴 — 랠리의 첫 세 타",
    desc: "프로는 왜 서브로 에이스를 노리지 않을까? 서브·리턴·3구째를 첫 T 쟁탈전으로 보고, 옆벽 접촉 지점과 동선으로 정석을 정리합니다.",
    tags: ["서브", "리턴", "3구째"],
    thumb: "images/서브리턴_리턴선택지.svg",
    meta: "도표 4장 · 약 20분"
  },
  {
    id: "defense", icon: "🛡️", tone: "blue",
    series: "tactics", no: 2, status: "published",
    href: "스쿼시_수비_상황별_전술.html",
    title: "수비 상황별 전술 — 밀렸을 때 살아남기",
    desc: "백 코너에 갇혔을 때, 앞으로 끌려 나왔을 때, 겨우 공에 닿았을 때. 수비를 시간 벌기로 보고 롭·탈출·복귀 동선의 정석을 정리합니다.",
    tags: ["수비", "롭", "T 되찾기"],
    thumb: "images/수비_백코너탈출.svg",
    meta: "도표 4장 · 약 25분"
  },
  {
    id: "attack", icon: "⚡", tone: "amber",
    series: "tactics", no: 3, status: "published",
    href: "스쿼시_공격_마무리_전술.html",
    title: "공격과 마무리 — 기회를 점수로 바꾸기",
    desc: "짧은 공이 왔을 때 킬·드롭·니크 중 무엇을 고를까? 발리 공격, 디셉션과 홀드, 공격 보스트, 4코너 공략과 역동작까지 마무리의 정석을 정리합니다.",
    tags: ["킬·드롭", "발리", "역동작"],
    thumb: "images/공격_4코너_역동작.svg",
    meta: "도표 4장 · 약 25분"
  },
  {
    id: "rally-patterns", icon: "🧩", tone: "violet",
    series: "tactics", no: 4, status: "published",
    href: "스쿼시_프로_랠리패턴_분석.html",
    title: "프로 랠리 패턴 분석",
    desc: "랠리는 샷 하나가 아니라 순서로 이긴다. 랠리 단계별 목표, 프로가 반복해 쓰는 대표 샷 시퀀스 네 가지, 템포 전환, 실수 직후의 대처를 정리합니다.",
    tags: ["랠리 단계", "샷 시퀀스", "템포"],
    thumb: "images/랠리패턴_AB.svg",
    meta: "도표 4장 · 약 20분"
  },
  {
    id: "opponent-types", icon: "👥", tone: "rose",
    series: "tactics", no: 5, status: "published",
    href: "스쿼시_상대유형별_공략.html",
    title: "상대 유형별 공략",
    desc: "하드 히터, 리트리버, 샷메이커, 키 큰 상대와 빠른 상대, 왼손잡이, 강하거나 약한 상대. 상대에 맞게 정석의 비중을 조정하는 법과 경기 중 상대를 읽는 법을 정리합니다.",
    tags: ["유형별 공략", "왼손잡이", "상대 분석"],
    thumb: "images/상대유형_공략지점.svg",
    meta: "도표 3장 · 약 20분"
  },
  {
    id: "court-zones", icon: "🗺️", tone: "teal",
    series: "tactics", no: 6, status: "published",
    href: "스쿼시_코트구역별_특수상황.html",
    title: "코트 구역별 특수 상황",
    desc: "사이드월에 붙은 타이트 볼, 미들 코트 사이드월 근처의 애매한 공, 몸쪽으로 오는 바디 볼, 넓지 않은 크로스의 인터셉트. 공의 위치가 선택지를 어떻게 바꾸는지 정리합니다.",
    tags: ["타이트 볼", "바디 볼", "인터셉트"],
    thumb: "images/코트구역_지도.svg",
    meta: "도표 4장 · 약 18분"
  },
  {
    id: "score-flow", icon: "📊", tone: "blue",
    series: "tactics", no: 7, status: "published",
    href: "스쿼시_스코어와_경기흐름_운영.html",
    title: "스코어와 경기 흐름 운영",
    desc: "PAR 11 점수에 따라 바뀌는 공격의 문턱, 앞설 때와 뒤질 때의 운영, 게임 스코어별 매치 전략, 게임 사이 90초 휴식, 흐름을 빼앗겼을 때 되찾는 순서를 정리합니다.",
    tags: ["스코어", "매치 전략", "모멘텀"],
    thumb: "images/스코어_운영지도.svg",
    meta: "도표 3장 · 약 18분"
  },
  {
    id: "fitness-env-rules", icon: "🔋", tone: "amber",
    series: "tactics", no: 8, status: "published",
    href: "스쿼시_체력_환경_규칙_변수.html",
    title: "체력·환경·규칙 변수",
    desc: "지쳤을 때와 상대가 지쳤을 때의 운영, 공 온도와 코트 컨디션, 5분 워밍업 활용, 렛·스트로크 판정의 원리와 클리어링, 턴 판단까지 정리합니다.",
    tags: ["체력", "공 온도", "렛·스트로크"],
    thumb: "images/규칙_렛판정흐름.svg",
    meta: "도표 3장 · 약 22분"
  },
  {
    id: "drive-training", icon: "🔁", tone: "teal",
    series: "training", no: 1, status: "published",
    href: "스쿼시_드라이브_훈련세션.html",
    title: "드라이브 훈련 세션",
    desc: "좋은 드라이브의 채점 기준과 60분 세션 구조, 혼자·둘·셋·그룹·코치 레슨별 드릴, 전술 장면별 미니 블록, 주간 프로그램과 기록표까지 정리합니다.",
    tags: ["드라이브", "드릴", "측정·기록"],
    thumb: "images/드라이브_타깃존.svg",
    meta: "도표 3장 · 약 20분"
  },
  {
    id: "kill-drop-training", icon: "💥", tone: "rose",
    series: "training", no: 2, status: "published",
    href: "스쿼시_킬드롭_훈련세션.html",
    title: "킬·드롭 훈련 세션",
    desc: "틴 위 목표 띠와 킬·드롭 채점표, 칠 공을 고르는 판단 흐름, 혼자·둘·셋·그룹·코치 레슨별 드릴과 주간 프로그램까지 정리합니다.",
    tags: ["킬·드롭", "틴 마진", "공격 판단"],
    thumb: "images/킬드롭_타깃.svg",
    meta: "도표 3장 · 약 20분"
  }
];
