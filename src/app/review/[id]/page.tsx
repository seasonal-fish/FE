"use client";

import { useState } from "react";
import clsx from "clsx";

// ── Risk data (ordered: 위험 → 주의 → 낮음) ─────────────────────────────────
const RISKS = [
  {
    id: 1,
    phrase: "책상을 탁 치고",
    level: "위험" as const,
    category: "HISTORY · 역사·인권 · 1987.01",
    reason:
      "'책상을 탁 치니 억'은 1987년 박종철 고문치사 사건을 연상시키는 표현입니다. 가벼운 프로모션 맥락에서 쓰이면 인권 침사를 희화화한다는 비판을 받을 수 있습니다.",
    tags: "근거: 과거 광고 논란 DB · 민감 이슈 매칭(박종철 사건)",
    confidence: 93,
    after: "일상을 시원하게 씻어내고",
  },
  {
    id: 2,
    phrase: "700",
    level: "주의" as const,
    category: "SLANG · 은어·부정적 맥락",
    reason:
        "'700'은 '도망'을 뜻하는 커뮤니티 은어로, 맥락에 따라 부정적·조롱적 뉘앙스를 띨 수 있습니다. 공식 광고에서의 사용은 브랜드 이미지에 영향을 줄 수 있습니다.",
    tags: "근거: 신조어 DB · 어감 분류(중립~부정, 활성도 91)",
    confidence: 72,
    after: "더 시원하게",
  },
  {
    id: 3,
    phrase: "인생 노잼",
    level: "낮음" as const,
    category: "SLANG · 일상 표현",
    reason:
      "'인생 노잼'은 삶이 재미없다는 의미의 유행어로, 대부분의 맥락에서 가볍게 통용됩니다. 타겟 연령층에 따라 공감 또는 이질감을 유발할 수 있어 모니터링이 권장됩니다.",
    tags: "근거: 신조어 DB · 어감 분류(부정, 활성 중간)",
    confidence: 61,
    after: "아쉬우니까",
  },
];

const LEVEL = {
  위험: { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", label: "위험" },
  주의: { color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", label: "주의" },
  낮음: { color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0", label: "낮음" },
};

const SCORE = 78;

type Tab = "inline" | "gauge" | "diff";

// ── Donut gauge SVG ──────────────────────────────────────────────────────────
function DonutGauge({ score }: { score: number }) {
  const cx = 110, cy = 110, r = 80;
  const circumference = 2 * Math.PI * r;
  const fillLen = (score / 100) * circumference;
  const color = score >= 67 ? "#EF4444" : score >= 34 ? "#F59E0B" : "#22C55E";
  const label = score >= 67 ? "위험·높음" : score >= 34 ? "주의" : "안전";

  return (
    <svg width="220" height="220" viewBox="0 0 220 220">
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth="20" />
      {/* Score ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="20"
        strokeLinecap="round"
        strokeDasharray={`${fillLen} ${circumference}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Center text */}
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fontSize="44"
        fontWeight="900"
        fill={color}
        fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
      >
        {score}
      </text>
      <text
        x={cx}
        y={cy + 18}
        textAnchor="middle"
        fontSize="13"
        fill="#6B7280"
        fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}

// ── Highlighted phrase with correct text-decoration ──────────────────────────
function Phrase({
  text,
  level,
  active,
  onClick,
}: {
  text: string;
  level: "위험" | "주의" | "낮음";
  active: boolean;
  onClick: () => void;
}) {
  const styleMap = {
    위험: {
      color: "#EF4444",
      textDecorationLine: "underline" as const,
      textDecorationStyle: "wavy" as const,
      textDecorationColor: "#EF4444",
    },
    주의: {
      color: "#F59E0B",
      textDecorationLine: "underline" as const,
      textDecorationStyle: "dashed" as const,
      textDecorationColor: "#F59E0B",
    },
    낮음: {
      color: "#22C55E",
      textDecorationLine: "underline" as const,
      textDecorationStyle: "dotted" as const,
      textDecorationColor: "#22C55E",
    },
  };
  return (
    <span
      onClick={onClick}
      className={clsx(
        "font-semibold cursor-pointer transition-all rounded",
        active && "px-0.5"
      )}
      style={{
        ...styleMap[level],
        backgroundColor: active ? LEVEL[level].bg : undefined,
      }}
    >
      {text}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReviewResultPage() {
  const [tab, setTab] = useState<Tab>("inline");
  const [selected, setSelected] = useState(RISKS[0]);

  const counts = {
    위험: RISKS.filter((r) => r.level === "위험").length,
    주의: RISKS.filter((r) => r.level === "주의").length,
    낮음: RISKS.filter((r) => r.level === "낮음").length,
  };

  const scoreColor = SCORE >= 67 ? "#EF4444" : SCORE >= 34 ? "#F59E0B" : "#22C55E";
  const tabs: { id: Tab; label: string }[] = [
    { id: "inline", label: "개요" },
    { id: "gauge", label: "위험도" },
    { id: "diff", label: "Before→After" },
  ];

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] text-[#9CA3AF] font-semibold tracking-widest mb-1 uppercase">
            Review Result · #8121 · OCR·포스터
          </p>
          <h1 className="text-[22px] font-black text-[#111]">
            여름 워터파크 프로모션 헤드라인
          </h1>
        </div>
        {/* Tab switcher */}
        <div className="flex bg-[#F3F4F6] rounded-lg p-1 gap-0.5 shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap",
                tab === t.id
                  ? "bg-white text-[#111] shadow-sm"
                  : "text-[#6B7280] hover:text-[#111]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          TAB: 개요
      ══════════════════════════════════════════════ */}
      {tab === "inline" && (
        <>
          {/* Score card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 mb-4">
            <div className="flex items-center gap-6">
              {/* Score number */}
              <div className="shrink-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-[52px] font-black leading-none" style={{ color: scoreColor }}>
                    {SCORE}
                  </span>
                  <span className="text-[18px] text-[#9CA3AF] font-medium">/100</span>
                </div>
                <p className="text-[13px] font-semibold mt-0.5" style={{ color: scoreColor }}>
                  위험 · 높음
                </p>
              </div>

              {/* Gradient bar */}
              <div className="flex-1">
                <div className="relative h-2 rounded-full overflow-visible" style={{
                  background: "linear-gradient(to right, #22C55E 0%, #F59E0B 50%, #EF4444 100%)"
                }}>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 rounded-full shadow-md"
                    style={{
                      left: `calc(${SCORE}% - 8px)`,
                      borderColor: scoreColor,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1.5">
                  <span>0 안전</span>
                  <span>33</span>
                  <span>66</span>
                  <span>100 위험</span>
                </div>
              </div>

              {/* Risk counts */}
              <div className="flex gap-4 shrink-0">
                {(["위험", "주의", "낮음"] as const).map((l) => (
                  <div key={l} className="text-center">
                    <div
                      className="text-[26px] font-black leading-none"
                      style={{ color: LEVEL[l].color }}
                    >
                      {counts[l]}
                    </div>
                    <div className="text-[11px] text-[#9CA3AF] mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Text highlight + detail panel */}
          <div className="grid grid-cols-[1fr_260px] gap-4">
            {/* Left: highlighted text */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <p className="text-[11px] text-[#9CA3AF] font-semibold mb-3 uppercase tracking-wider">
                입력 문구 · 위험 표현 표시
              </p>
              <p className="text-[18px] leading-[2.2] text-[#111]">
                이 여름,{" "}
                <Phrase
                  text="책상을 탁 치고"
                  level="위험"
                  active={selected.id === 1}
                  onClick={() => setSelected(RISKS[0])}
                />{" "}
                떠나는 시원한 워터파크 특가! 지금 못 가면{" "}
                <Phrase
                  text="인생 노잼"
                  level="낮음"
                  active={selected.id === 3}
                  onClick={() => setSelected(RISKS[2])}
                />{" "}
                ...{" "}
                <Phrase
                  text="700"
                  level="주의"
                  active={selected.id === 2}
                  onClick={() => setSelected(RISKS[1])}
                />{" "}
                찍고 시원하게 질러!
              </p>
            </div>

            {/* Right: risk detail */}
            <div
              className="rounded-xl border p-4 flex flex-col gap-3"
              style={{
                borderColor: LEVEL[selected.level].border,
                backgroundColor: LEVEL[selected.level].bg,
              }}
            >
              {/* Title row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: LEVEL[selected.level].color }}
                />
                <span className="text-[13px] font-bold text-[#111]">
                  &ldquo;{selected.phrase}&rdquo;
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                  style={{ background: LEVEL[selected.level].color }}
                >
                  {selected.level}
                </span>
              </div>

              {/* Category */}
              <p className="text-[10px] text-[#9CA3AF] font-medium -mt-1">{selected.category}</p>

              {/* Reason */}
              <p className="text-[12px] text-[#374151] leading-[1.7]">{selected.reason}</p>

              {/* Tags */}
              <p className="text-[10px] text-[#9CA3AF]">{selected.tags}</p>

              {/* Confidence */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] text-[#6B7280]">신뢰도</span>
                  <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${selected.confidence}%`,
                        background: LEVEL[selected.level].color,
                      }}
                    />
                  </div>
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: LEVEL[selected.level].color }}
                  >
                    {selected.confidence}%
                  </span>
                </div>
              </div>

              {/* Alternative */}
              <div className="bg-white rounded-lg p-3 border border-[#E5E7EB]">
                <p className="text-[10px] text-[#9CA3AF] mb-1">대안 →</p>
                <p className="text-[13px] font-semibold text-[#2F6BFF]">{selected.after}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          TAB: 위험도
      ══════════════════════════════════════════════ */}
      {tab === "gauge" && (
        <div className="space-y-4">
          {/* Donut card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 flex flex-col items-center">
            <DonutGauge score={SCORE} />
            <div className="flex gap-6 mt-2">
              {(["위험", "주의", "낮음"] as const).map((l) => (
                <div key={l} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: LEVEL[l].color }} />
                  <span className="text-[13px] font-semibold" style={{ color: LEVEL[l].color }}>
                    {l} {counts[l]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Text card below */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <p className="text-[11px] text-[#9CA3AF] font-semibold mb-3 uppercase tracking-wider">
              입력 문구 · 위험 표현 표시
            </p>
            <p className="text-[18px] leading-[2.2] text-[#111]">
              이 여름,{" "}
              <Phrase text="책상을 탁 치고" level="위험" active={false} onClick={() => {}} />{" "}
              떠나는 시원한 워터파크 특가! 지금 못 가면{" "}
              <Phrase text="인생 노잼" level="낮음" active={false} onClick={() => {}} />{" "}
              ...{" "}
              <Phrase text="700" level="주의" active={false} onClick={() => {}} />{" "}
              찍고 시원하게 질러!
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: Before→After
      ══════════════════════════════════════════════ */}
      {tab === "diff" && (
        <div className="space-y-4">
          {/* Summary pills */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="flex items-center gap-1 bg-[#F3F4F6] text-[#6B7280] text-[12px] font-semibold px-3 py-1.5 rounded-full">
              위험도 {SCORE} · 높음
            </span>
            {RISKS.map((r) => (
              <span
                key={r.id}
                className="flex items-center gap-1.5 text-white text-[12px] font-semibold px-3 py-1.5 rounded-full"
                style={{ background: LEVEL[r.level].color }}
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
                &ldquo; {r.phrase} &rdquo; · {r.level}
              </span>
            ))}
          </div>

          {/* Before / After columns */}
          <div className="grid grid-cols-2 gap-4">
            {/* BEFORE */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <p className="text-[11px] font-bold text-[#9CA3AF] mb-4 tracking-widest">
                BEFORE · 원본
              </p>
              <p className="text-[17px] leading-[2.2] text-[#111]">
                이 여름,{" "}
                <span
                  className="font-semibold"
                  style={{ color: "#EF4444", textDecoration: "line-through", textDecorationColor: "#EF4444" }}
                >
                  책상을 탁 치고
                </span>{" "}
                떠나는 시원한 워터파크 특가! 지금 못 가면{" "}
                <span
                  className="font-semibold"
                  style={{ color: "#22C55E", textDecoration: "line-through", textDecorationColor: "#22C55E" }}
                >
                  인생 노잼
                </span>{" "}
                ...{" "}
                <span
                  className="font-semibold"
                  style={{ color: "#F59E0B", textDecoration: "line-through", textDecorationColor: "#F59E0B" }}
                >
                  700
                </span>{" "}
                찍고 시원하게 질러!
              </p>
            </div>

            {/* AFTER */}
            <div className="bg-white rounded-xl border border-[#BBF7D0] p-5">
              <p className="text-[11px] font-bold text-[#9CA3AF] mb-4 tracking-widest">
                AFTER · 제안
              </p>
              <p className="text-[17px] leading-[2.2] text-[#111]">
                이 여름,{" "}
                <span
                  className="font-semibold"
                  style={{
                    color: "#2F6BFF",
                    textDecorationLine: "underline",
                    textDecorationColor: "#2F6BFF",
                  }}
                >
                  일상을 시원하게 씻어내고
                </span>{" "}
                떠나는 시원한 워터파크 특가! 지금 못 가면{" "}
                <span
                  className="font-semibold"
                  style={{
                    color: "#2F6BFF",
                    textDecorationLine: "underline",
                    textDecorationColor: "#2F6BFF",
                  }}
                >
                  아쉬우니까
                </span>
                ,{" "}
                <span
                  className="font-semibold"
                  style={{
                    color: "#2F6BFF",
                    textDecorationLine: "underline",
                    textDecorationColor: "#2F6BFF",
                  }}
                >
                  더 시원하게
                </span>{" "}
                즐겨요!
              </p>
              <button className="mt-4 bg-[#111] text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-[#333] transition-colors">
                이 문구로 교체
              </button>
            </div>
          </div>

          {/* Action row */}
          <div className="flex gap-3 pt-1">
            <a
              href="/review"
              className="px-4 py-2.5 rounded-lg border border-[#E5E7EB] text-[13px] font-semibold text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
            >
              ← 다시 검토
            </a>
            <button className="px-4 py-2.5 rounded-lg bg-[#2F6BFF] text-white text-[13px] font-semibold hover:bg-[#1a56e8] transition-colors">
              리포트 내보내기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
