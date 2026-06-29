"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import clsx from "clsx";
import { getHistoryDetail, type ReviewResult, type Highlight } from "@/lib/api";

// ── Severity helpers ──────────────────────────────────────────────────────────
function korLevel(severity: string): "위험" | "주의" | "낮음" {
  if (severity === "high") return "위험";
  if (severity === "needs_review") return "주의";
  return "낮음";
}

const LEVEL = {
  위험: { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
  주의: { color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  낮음: { color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0" },
};

// ── Segment builder for inline highlighting ───────────────────────────────────
type Segment =
  | { kind: "text"; text: string }
  | { kind: "highlight"; text: string; highlight: Highlight };

function buildSegments(input: string, highlights: Highlight[]): Segment[] {
  const positioned = highlights
    .filter((h) => h.start != null && h.end != null)
    .sort((a, b) => (a.start ?? 0) - (b.start ?? 0));

  const segments: Segment[] = [];
  let pos = 0;

  for (const h of positioned) {
    const start = h.start!;
    const end = h.end!;
    if (start > pos) {
      segments.push({ kind: "text", text: input.slice(pos, start) });
    }
    if (start < end) {
      segments.push({ kind: "highlight", text: input.slice(start, end), highlight: h });
    }
    pos = Math.max(pos, end);
  }
  if (pos < input.length) {
    segments.push({ kind: "text", text: input.slice(pos) });
  }
  return segments;
}

// ── Phrase component ──────────────────────────────────────────────────────────
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
    위험: { color: "#EF4444", textDecorationLine: "underline" as const, textDecorationStyle: "wavy" as const, textDecorationColor: "#EF4444" },
    주의: { color: "#F59E0B", textDecorationLine: "underline" as const, textDecorationStyle: "dashed" as const, textDecorationColor: "#F59E0B" },
    낮음: { color: "#22C55E", textDecorationLine: "underline" as const, textDecorationStyle: "dotted" as const, textDecorationColor: "#22C55E" },
  };
  return (
    <span
      onClick={onClick}
      className={clsx("font-semibold cursor-pointer transition-all rounded", active && "px-0.5")}
      style={{ ...styleMap[level], backgroundColor: active ? LEVEL[level].bg : undefined }}
    >
      {text}
    </span>
  );
}

// ── Donut gauge ───────────────────────────────────────────────────────────────
function DonutGauge({ score }: { score: number }) {
  const cx = 110, cy = 110, r = 80;
  const circumference = 2 * Math.PI * r;
  const fillLen = (score / 100) * circumference;
  const color = score >= 67 ? "#EF4444" : score >= 34 ? "#F59E0B" : "#22C55E";
  const label = score >= 67 ? "위험·높음" : score >= 34 ? "주의" : "안전";
  return (
    <svg width="220" height="220" viewBox="0 0 220 220">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth="20" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="20" strokeLinecap="round"
        strokeDasharray={`${fillLen} ${circumference}`} transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="central" fontSize="44" fontWeight="900" fill={color}
        fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">{score}</text>
      <text x={cx} y={cy + 26} textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#6B7280"
        fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">{label}</text>
    </svg>
  );
}

// ── Related evidence group (BE related_* arrays) ──────────────────────────────
function RelatedGroup({
  title,
  color,
  items,
}: {
  title: string;
  color: string;
  items: { id: string; title: string; snippet?: string; similarity: number }[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-[12px] font-bold text-[#111]">{title}</span>
        <span className="text-[10px] text-[#9CA3AF]">{items.length}</span>
      </div>
      <div className="space-y-1.5">
        {items.slice(0, 3).map((it) => (
          <div key={it.id} className="rounded-lg border border-[#F3F4F6] bg-[#FAFAFA] p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold text-[#111] truncate">{it.title}</span>
              <span className="text-[10px] font-bold shrink-0" style={{ color }}>
                {Math.round(it.similarity * 100)}%
              </span>
            </div>
            {it.snippet && <p className="text-[11px] text-[#9CA3AF] mt-0.5 truncate">{it.snippet}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
type Tab = "inline" | "gauge" | "diff";

export default function ReviewResultPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("inline");
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [selected, setSelected] = useState<Highlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getHistoryDetail(id)
      .then((data) => {
        setResult(data);
        if (data.highlights.length > 0) setSelected(data.highlights[0]);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "불러오기에 실패했습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto px-6 py-8 flex justify-center items-center min-h-[400px]">
        <span className="w-8 h-8 border-2 border-[#2F6BFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <p className="text-[#EF4444] text-[14px]">{error ?? "결과를 찾을 수 없습니다."}</p>
        <a href="/history" className="mt-4 inline-block text-[13px] text-[#2F6BFF]">← 히스토리로 돌아가기</a>
      </div>
    );
  }

  const score = result.verdict.score;
  const scoreColor = score >= 67 ? "#EF4444" : score >= 34 ? "#F59E0B" : "#22C55E";
  const scoreLabel = score >= 67 ? "위험 · 높음" : score >= 34 ? "주의" : "안전";
  const segments = buildSegments(result.input, result.highlights);

  const counts = {
    위험: result.highlights.filter((h) => h.severity === "high").length,
    주의: result.highlights.filter((h) => h.severity === "needs_review").length,
    낮음: result.highlights.filter((h) => h.severity === "low").length,
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "inline", label: "개요" },
    { id: "gauge", label: "위험도" },
    { id: "diff", label: "Before→After" },
  ];

  const selLevel = selected ? korLevel(selected.severity) : "낮음";

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] text-[#9CA3AF] font-semibold tracking-widest mb-1 uppercase">
            Review Result · {id?.slice(0, 10)}
          </p>
          <h1 className="text-[22px] font-black text-[#111]">
            {result.verdict.advice
              ? result.verdict.advice.slice(0, 40)
              : result.input.slice(0, 40)}
          </h1>
        </div>
        <div className="flex bg-[#F3F4F6] rounded-lg p-1 gap-0.5 shrink-0">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={clsx("px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap",
                tab === t.id ? "bg-white text-[#111] shadow-sm" : "text-[#6B7280] hover:text-[#111]")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ TAB: 개요 ══ */}
      {tab === "inline" && (
        <>
          {/* Score card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 mb-4">
            <div className="flex items-center gap-6">
              <div className="shrink-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-[52px] font-black leading-none" style={{ color: scoreColor }}>{score}</span>
                  <span className="text-[18px] text-[#9CA3AF] font-medium">/100</span>
                </div>
                <p className="text-[13px] font-semibold mt-0.5" style={{ color: scoreColor }}>{scoreLabel}</p>
              </div>
              <div className="flex-1">
                <div className="relative h-2 rounded-full overflow-visible"
                  style={{ background: "linear-gradient(to right, #22C55E 0%, #F59E0B 50%, #EF4444 100%)" }}>
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 rounded-full shadow-md"
                    style={{ left: `calc(${score}% - 8px)`, borderColor: scoreColor }} />
                </div>
                <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1.5">
                  <span>0 안전</span><span>33</span><span>66</span><span>100 위험</span>
                </div>
              </div>
              <div className="flex gap-4 shrink-0">
                {(["위험", "주의", "낮음"] as const).map((l) => (
                  <div key={l} className="text-center">
                    <div className="text-[26px] font-black leading-none" style={{ color: LEVEL[l].color }}>{counts[l]}</div>
                    <div className="text-[11px] text-[#9CA3AF] mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Text highlight + detail panel */}
          <div className="grid grid-cols-[1fr_260px] gap-4">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <p className="text-[11px] text-[#9CA3AF] font-semibold mb-3 uppercase tracking-wider">
                입력 문구 · 위험 표현 표시
              </p>
              <p className="text-[18px] leading-[2.2] text-[#111]">
                {segments.map((seg, i) =>
                  seg.kind === "text" ? (
                    <span key={i}>{seg.text}</span>
                  ) : (
                    <Phrase key={i} text={seg.text} level={korLevel(seg.highlight.severity)}
                      active={selected?.phrase === seg.highlight.phrase}
                      onClick={() => setSelected(seg.highlight)} />
                  )
                )}
              </p>
              {result.highlights.filter((h) => h.start == null).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.highlights.filter((h) => h.start == null).map((h, i) => (
                    <button key={i} onClick={() => setSelected(h)}
                      className={clsx("px-2 py-1 rounded text-[12px] font-semibold border transition-colors",
                        selected?.phrase === h.phrase ? "text-white" : "bg-white")}
                      style={{
                        borderColor: LEVEL[korLevel(h.severity)].color,
                        color: selected?.phrase === h.phrase ? "white" : LEVEL[korLevel(h.severity)].color,
                        backgroundColor: selected?.phrase === h.phrase ? LEVEL[korLevel(h.severity)].color : undefined,
                      }}>
                      {h.phrase}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selected ? (
              <div className="rounded-xl border p-4 flex flex-col gap-3"
                style={{ borderColor: LEVEL[selLevel].border, backgroundColor: LEVEL[selLevel].bg }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: LEVEL[selLevel].color }} />
                  <span className="text-[13px] font-bold text-[#111]">&ldquo;{selected.phrase}&rdquo;</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                    style={{ background: LEVEL[selLevel].color }}>{selLevel}</span>
                </div>
                <p className="text-[10px] text-[#9CA3AF] font-medium -mt-1">
                  {[selected.tag, selected.category, selected.date].filter(Boolean).join(" · ")}
                </p>
                <p className="text-[12px] text-[#374151] leading-[1.7]">{selected.reason}</p>
                <p className="text-[10px] text-[#9CA3AF]">근거: {selected.basis}</p>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px] text-[#6B7280]">신뢰도</span>
                    <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width: `${Math.round(selected.confidence * 100)}%`, background: LEVEL[selLevel].color }} />
                    </div>
                    <span className="text-[11px] font-bold" style={{ color: LEVEL[selLevel].color }}>
                      {Math.round(selected.confidence * 100)}%
                    </span>
                  </div>
                </div>
                {selected.alt && (
                  <div className="bg-white rounded-lg p-3 border border-[#E5E7EB]">
                    <p className="text-[10px] text-[#9CA3AF] mb-1">대안 →</p>
                    <p className="text-[13px] font-semibold text-[#2F6BFF]">{selected.alt}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E5E7EB] p-4 flex items-center justify-center text-[13px] text-[#9CA3AF]">
                표현을 클릭하면 상세 정보가 표시됩니다
              </div>
            )}
          </div>

          {/* 관련 근거 — BE RAG 검색 결과 (민감주제/논란사례/신조어/유행어) */}
          {result.related_topics.length +
            result.related_issues.length +
            result.related_slang.length +
            result.related_trends.length >
            0 && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 mt-4">
              <p className="text-[11px] text-[#9CA3AF] font-semibold mb-3 uppercase tracking-wider">
                관련 근거 · RAG 검색 결과
              </p>
              <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                <RelatedGroup
                  title="민감 주제"
                  color="#EF4444"
                  items={result.related_topics.map((t) => ({
                    id: t.id,
                    title: t.title,
                    snippet: t.description,
                    similarity: t.similarity,
                  }))}
                />
                <RelatedGroup title="유사 논란 사례" color="#F59E0B" items={result.related_issues} />
                <RelatedGroup title="관련 신조어" color="#A78BFA" items={result.related_slang} />
                <RelatedGroup title="관련 유행어" color="#2F6BFF" items={result.related_trends} />
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ TAB: 위험도 ══ */}
      {tab === "gauge" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 flex flex-col items-center">
            <DonutGauge score={score} />
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
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <p className="text-[11px] text-[#9CA3AF] font-semibold mb-3 uppercase tracking-wider">
              입력 문구 · 위험 표현 표시
            </p>
            <p className="text-[18px] leading-[2.2] text-[#111]">
              {segments.map((seg, i) =>
                seg.kind === "text" ? (
                  <span key={i}>{seg.text}</span>
                ) : (
                  <Phrase key={i} text={seg.text} level={korLevel(seg.highlight.severity)}
                    active={false} onClick={() => {}} />
                )
              )}
            </p>
          </div>
        </div>
      )}

      {/* ══ TAB: Before→After ══ */}
      {tab === "diff" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap items-center">
            <span className="flex items-center gap-1 bg-[#F3F4F6] text-[#6B7280] text-[12px] font-semibold px-3 py-1.5 rounded-full">
              위험도 {score} · {scoreLabel}
            </span>
            {result.highlights.map((h, i) => {
              const lv = korLevel(h.severity);
              return (
                <span key={i} className="flex items-center gap-1.5 text-white text-[12px] font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: LEVEL[lv].color }}>
                  <span className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
                  &ldquo; {h.phrase} &rdquo; · {lv}
                </span>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <p className="text-[11px] font-bold text-[#9CA3AF] mb-4 tracking-widest">BEFORE · 원본</p>
              <p className="text-[17px] leading-[1.8] text-[#111]">{result.rewrite.before}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#BBF7D0] p-5">
              <p className="text-[11px] font-bold text-[#9CA3AF] mb-4 tracking-widest">AFTER · 제안</p>
              <p className="text-[17px] leading-[1.8] text-[#2F6BFF] font-semibold">{result.rewrite.after}</p>
            </div>
          </div>

          {result.verdict.advice && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <p className="text-[11px] text-[#9CA3AF] font-semibold mb-1">검토 의견</p>
              <p className="text-[13px] text-[#374151] leading-[1.7]">{result.verdict.advice}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <a href="/review"
              className="px-4 py-2.5 rounded-lg border border-[#E5E7EB] text-[13px] font-semibold text-[#6B7280] hover:bg-[#F3F4F6] transition-colors">
              ← 다시 검토
            </a>
            <a href="/history"
              className="px-4 py-2.5 rounded-lg bg-[#2F6BFF] text-white text-[13px] font-semibold hover:bg-[#1a56e8] transition-colors">
              히스토리 보기
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
