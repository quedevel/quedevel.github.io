/*
 * 스쿼시 노트 문서 목록 — 단일 소스
 * - index.html 의 카드·로드맵, 문서 하단의 이전/다음 글 링크가 모두 이 배열에서 만들어집니다.
 * - 새 문서를 발행하면 해당 항목의 status 를 "published" 로 바꾸고 href·thumb·meta 를 채우세요.
 * - 배열 순서가 곧 읽는 순서(이전/다음 글 순서)입니다.
 */
window.SQUASH_SERIES = {
  principle: { icon: "🔬", title: "기초 원리", desc: "샷이 왜 그렇게 날아가는지, 역학으로 이해하기" },
  tactics:   { icon: "♟️", title: "단식 전술 시리즈", desc: "랠리의 기본 골격에서 상황별 정석까지" }
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
    series: "tactics", no: 3, status: "planned",
    href: "스쿼시_공격_마무리_전술.html",
    title: "공격과 마무리 — 기회를 점수로 바꾸기",
    desc: "짧은 공 마무리, 발리 공격, 디셉션과 홀드, 공격 보스트, 4코너 공략, 역동작"
  },
  {
    id: "rally-patterns", icon: "🧩", tone: "violet",
    series: "tactics", no: 4, status: "planned",
    href: "스쿼시_프로_랠리패턴_분석.html",
    title: "프로 랠리 패턴 분석",
    desc: "랠리 단계별 목표, 대표 샷 시퀀스, 템포 전환, 실수 직후의 대처"
  },
  {
    id: "opponent-types", icon: "👥", tone: "rose",
    series: "tactics", no: 5, status: "planned",
    href: "스쿼시_상대유형별_공략.html",
    title: "상대 유형별 공략",
    desc: "하드 히터·수비형·공격형·왼손잡이 상대, 실력 차, 경기 중 상대 분석"
  },
  {
    id: "court-zones", icon: "🗺️", tone: "teal",
    series: "tactics", no: 6, status: "planned",
    href: "스쿼시_코트구역별_특수상황.html",
    title: "코트 구역별 특수 상황",
    desc: "사이드월에 붙은 공, 미들 코트 볼, 몸쪽 공, 와이드하지 않은 크로스 응징"
  },
  {
    id: "score-flow", icon: "📊", tone: "blue",
    series: "tactics", no: 7, status: "planned",
    href: "스쿼시_스코어와_경기흐름_운영.html",
    title: "스코어와 경기 흐름 운영",
    desc: "점수별 리스크 관리, 매치 단위 전략, 게임 사이 휴식, 흐름을 빼앗겼을 때"
  },
  {
    id: "fitness-env-rules", icon: "🔋", tone: "amber",
    series: "tactics", no: 8, status: "planned",
    href: "스쿼시_체력_환경_규칙_변수.html",
    title: "체력·환경·규칙 변수",
    desc: "체력 운영, 코트 컨디션과 공 온도, 워밍업 활용, 렛·스트로크와 클리어링"
  }
];
