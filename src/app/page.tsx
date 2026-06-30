import Link from "next/link";
import Reveal from "@/components/Reveal";
import MarqueeBackground from "@/components/MarqueeBackground";

const FEATURES = [
  {
    icon: "🔍",
    title: "민감 사건 자동 감지",
    desc: "역사적·사회적 논란 사건 DB와 광고 문구를 즉시 대조해 위험 표현을 찾아냅니다.",
  },
  {
    icon: "📈",
    title: "신조어 트렌드 모니터링",
    desc: "네이버 데이터랩 연동으로 최신 신조어 활성도를 실시간 추적합니다.",
  },
  {
    icon: "✍️",
    title: "대체 문구 자동 제안",
    desc: "위험 표현에 대한 근거와 안전한 대안 문구를 함께 제공합니다.",
  },
  {
    icon: "🖼️",
    title: "포스터 이미지 분석",
    desc: "이미지·PDF 포스터를 업로드하면 텍스트를 추출해 동일하게 검토합니다.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-[#F7F7F8]">
      {/* Hero */}
      <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 text-center overflow-hidden">
        <MarqueeBackground />
        {/* 콘텐츠는 마퀴 위로 */}
        <div className="relative z-10 flex flex-col items-center">
        {/* Pill badge */}
        <Reveal delay={0}>
          <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-full px-4 py-2 mb-12 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#2F6BFF] inline-block shrink-0" />
            <span className="text-[13px] text-[#555]">
              광고가 나가기 <strong className="text-[#111]">전에</strong> , 사고를 막는다
            </span>
          </div>
        </Reveal>

        {/* Headline */}
        <Reveal delay={120}>
          <h1 className="text-[58px] font-black leading-[1.15] tracking-tight mb-5 max-w-2xl">
            사람이 놓친 한 단어가
            <br />
            <span className="text-[#2F6BFF]">브랜드를 무너뜨립니다.</span>
          </h1>
        </Reveal>

        {/* Sub */}
        <Reveal delay={240}>
          <p
            className="text-[16px] text-[#555] max-w-[480px] leading-[1.8] mb-12"
            style={{ wordBreak: "keep-all", textWrap: "balance" }}
          >
            광고 문구·포스터를 넣으면 사회적·역사적으로 민감하게 해석될 위험을{" "}
            <strong className="text-[#111] font-semibold whitespace-nowrap">근거·대체문구와 함께</strong>{" "}
            진단합니다. 최신 신조어부터 과거 논란 사례까지, 결재 라인이 못 거른 빈틈을 메웁니다.
          </p>
        </Reveal>

        {/* CTA buttons */}
        <Reveal delay={360}>
          <div className="flex items-center gap-3">
            <Link
              href="/review"
              className="bg-[#2F6BFF] text-white px-7 py-3 rounded-xl text-[14px] font-semibold hover:bg-[#1a56e8] transition-colors"
            >
              문구 검토 시작 →
            </Link>
            <Link
              href="/generate"
              className="bg-white text-[#111] border border-[#D1D5DB] px-7 py-3 rounded-xl text-[14px] font-semibold hover:bg-[#F3F4F6] transition-colors"
            >
              트렌드 문구 생성
            </Link>
          </div>
        </Reveal>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-[900px] mx-auto px-6 pb-24">
        <Reveal>
          <p className="text-center text-[11px] font-semibold text-[#9CA3AF] tracking-widest uppercase mb-3">
            주요 기능
          </p>
          <h2 className="text-center text-[28px] font-black text-[#111] mb-10">
            결재 라인이 놓친 빈틈을 메웁니다
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 100}>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 h-full">
                <span className="text-[28px] mb-3 block">{f.icon}</span>
                <h3 className="text-[16px] font-bold text-[#111] mb-2">{f.title}</h3>
                <p className="text-[14px] text-[#6B7280] leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
