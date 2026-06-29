"use client";

import { useState } from "react";
import clsx from "clsx";

const TONES = ["트렌디", "정중한", "유쾌한", "미니멀"];

const KEYWORDS = [
  { tag: "#갓생", delta: "▲32%", score: 91 },
  { tag: "#물멍", delta: "▲21%", score: 72 },
  { tag: "#갓성비", delta: "▲18%", score: 64 },
  { tag: "#여름나기", delta: "▲12%", score: 58 },
  { tag: "#플렉스", delta: "▲9%", score: 51 },
  { tag: "#디톡스", delta: "▲7%", score: 44 },
];

const MOCK_RESULTS = [
  {
    id: 1,
    text: "갓생을 실현하는 여름, 워터파크에서 플렉스!",
    score: 12,
    level: "안전",
  },
  {
    id: 2,
    text: "이번 여름 갓성비 워터파크 특가 — 물멍하며 리셋하세요.",
    score: 8,
    level: "안전",
  },
  {
    id: 3,
    text: "진짜 갓생러의 여름 루틴: 워터파크 디톡스",
    score: 21,
    level: "주의",
  },
];

export default function GeneratePage() {
  const [product, setProduct] = useState("");
  const [tone, setTone] = useState("트렌디");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(["#갓생", "#물멍"]);
  const [results, setResults] = useState<typeof MOCK_RESULTS>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleKeyword = (tag: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(tag) ? prev.filter((k) => k !== tag) : [...prev, tag]
    );
  };

  const handleGenerate = () => {
    if (!product.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setResults(MOCK_RESULTS);
      setIsLoading(false);
    }, 1800);
  };

  return (
    <div className="max-w-[700px] mx-auto px-6 py-10">
      <p className="text-[11px] text-[#9CA3AF] font-semibold tracking-widest mb-1">
        TREND-BASED · GENERATE
      </p>
      <h1 className="text-[26px] font-black text-[#111] mb-1">트렌드 기반 문구 생성</h1>
      <p className="text-[14px] text-[#6B7280] mb-8">
        제품 정보와 최신 신조어를 조합해 후보를 생성합니다. 생성된 문구는 자동으로 리스크 검토를 거칩니다.
      </p>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 space-y-5 mb-6">
        {/* Product input */}
        <div>
          <label className="text-[12px] text-[#6B7280] font-semibold mb-2 block">
            제품 / 캠페인
          </label>
          <input
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="예: 여름 워터파크 시즌 프로모션"
            className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] text-[#111] placeholder:text-[#C0C0C0] outline-none focus:border-[#2F6BFF] transition-colors"
          />
        </div>

        {/* Tone */}
        <div>
          <label className="text-[12px] text-[#6B7280] font-semibold mb-2 block">톤</label>
          <div className="flex gap-2 flex-wrap">
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={clsx(
                  "px-4 py-1.5 rounded-full text-[13px] font-medium border transition-colors",
                  tone === t
                    ? "bg-[#2F6BFF] border-[#2F6BFF] text-white"
                    : "border-[#E5E7EB] text-[#6B7280] hover:border-[#2F6BFF] hover:text-[#2F6BFF]"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-[12px] text-[#6B7280] font-semibold">
              활용할 트렌드어
            </label>
            <span className="text-[10px] text-[#9CA3AF]">지식베이스 · 활성도순</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {KEYWORDS.map((kw) => (
              <button
                key={kw.tag}
                onClick={() => toggleKeyword(kw.tag)}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors flex items-center gap-1.5",
                  selectedKeywords.includes(kw.tag)
                    ? "bg-[#EEF3FF] border-[#2F6BFF] text-[#2F6BFF]"
                    : "border-[#E5E7EB] text-[#6B7280] hover:border-[#C0C0C0]"
                )}
              >
                {kw.tag}
                <span className="text-[10px] text-[#22C55E] font-semibold">{kw.delta}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!product.trim() || isLoading}
        className="w-full bg-[#2F6BFF] text-white py-3.5 rounded-lg text-[15px] font-semibold
          hover:bg-[#1a56e8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center gap-2 mb-8"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            문구 생성 중...
          </>
        ) : (
          "문구 생성 →"
        )}
      </button>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <p className="text-[12px] text-[#9CA3AF] font-semibold mb-3">
            생성된 문구 후보 · 리스크 자동 검토 완료
          </p>
          <div className="space-y-3">
            {results.map((r) => {
              const levelColor =
                r.level === "안전" ? "#22C55E" : r.level === "주의" ? "#F59E0B" : "#EF4444";
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center gap-4"
                >
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-[#111]">{r.text}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className="text-[12px] font-bold px-2 py-0.5 rounded"
                      style={{ color: levelColor, background: levelColor + "18" }}
                    >
                      {r.level}
                    </div>
                    <span className="text-[13px] font-black" style={{ color: levelColor }}>
                      {r.score}
                    </span>
                    <span className="text-[11px] text-[#9CA3AF]">/100</span>
                  </div>
                  <button className="shrink-0 px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[12px] font-semibold text-[#6B7280] hover:bg-[#F3F4F6] transition-colors">
                    검토로 이동
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
