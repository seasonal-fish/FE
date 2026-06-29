"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import { getTrends, postGenerate, type TrendItem, type GenerateCandidate } from "@/lib/api";

const TONES = ["트렌디", "정중한", "유쾌한", "미니멀"];

const SAFETY_COLOR: Record<string, string> = {
  안전: "#22C55E",
  주의: "#F59E0B",
  위험: "#EF4444",
  검토실패: "#9CA3AF",
};

export default function GeneratePage() {
  const [product, setProduct] = useState("");
  const [tone, setTone] = useState("트렌디");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [results, setResults] = useState<GenerateCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTrends(12)
      .then((data) => {
        setTrends(data.trends);
        if (data.trends.length >= 2) {
          setSelectedKeywords([data.trends[0].tag, data.trends[1].tag]);
        }
      })
      .catch(() => {
        // 트렌드 로드 실패 시 빈 상태 유지
      })
      .finally(() => setTrendsLoading(false));
  }, []);

  const toggleKeyword = (tag: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(tag) ? prev.filter((k) => k !== tag) : [...prev, tag]
    );
  };

  const handleGenerate = async () => {
    if (!product.trim()) return;
    setError(null);
    setIsLoading(true);
    try {
      const data = await postGenerate(product, tone, selectedKeywords);
      setResults(data.candidates);
    } catch (e) {
      setError(e instanceof Error ? e.message : "문구 생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
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
              <button key={t} onClick={() => setTone(t)}
                className={clsx(
                  "px-4 py-1.5 rounded-full text-[13px] font-medium border transition-colors",
                  tone === t
                    ? "bg-[#2F6BFF] border-[#2F6BFF] text-white"
                    : "border-[#E5E7EB] text-[#6B7280] hover:border-[#2F6BFF] hover:text-[#2F6BFF]"
                )}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-[12px] text-[#6B7280] font-semibold">활용할 트렌드어</label>
            <span className="text-[10px] text-[#9CA3AF]">지식베이스 · 활성도순</span>
          </div>
          {trendsLoading ? (
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 w-20 rounded-full bg-[#F3F4F6] animate-pulse" />
              ))}
            </div>
          ) : trends.length === 0 ? (
            <p className="text-[12px] text-[#9CA3AF]">트렌드 데이터를 불러올 수 없습니다.</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {trends.map((kw) => (
                <button key={kw.tag} onClick={() => toggleKeyword(kw.tag)}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors flex items-center gap-1.5",
                    selectedKeywords.includes(kw.tag)
                      ? "bg-[#EEF3FF] border-[#2F6BFF] text-[#2F6BFF]"
                      : "border-[#E5E7EB] text-[#6B7280] hover:border-[#C0C0C0]"
                  )}>
                  {kw.tag}
                  {kw.up > 0 && (
                    <span className="text-[10px] text-[#22C55E] font-semibold">▲{kw.up}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#EF4444]">
          {error}
        </div>
      )}

      <button onClick={handleGenerate} disabled={!product.trim() || isLoading}
        className="w-full bg-[#2F6BFF] text-white py-3.5 rounded-lg text-[15px] font-semibold
          hover:bg-[#1a56e8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center gap-2 mb-8">
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
            {results.map((r, i) => {
              const levelColor = SAFETY_COLOR[r.safety_label] ?? "#9CA3AF";
              return (
                <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-[#111]">{r.text}</p>
                    {r.note && <p className="text-[12px] text-[#9CA3AF] mt-0.5">{r.note}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-[12px] font-bold px-2 py-0.5 rounded"
                      style={{ color: levelColor, background: levelColor + "18" }}>
                      {r.safety_label}
                    </div>
                    <span className="text-[13px] font-black" style={{ color: levelColor }}>{r.score}</span>
                    <span className="text-[11px] text-[#9CA3AF]">/100</span>
                  </div>
                  {r.review_id && (
                    <a href={`/review/${r.review_id}`}
                      className="shrink-0 px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[12px] font-semibold text-[#6B7280] hover:bg-[#F3F4F6] transition-colors">
                      검토로 이동
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
