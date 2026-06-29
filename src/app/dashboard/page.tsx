"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getEvents,
  getEventDetail,
  getTrends,
  type EventListItem,
  type EventDetail,
  type TrendItem,
} from "@/lib/api";

// 주간 시계열은 BE에 스냅샷 소스가 아직 없어 정적 디자인 데이터로 유지한다.
const trendData = [
  { week: "W1", 갓생: 60, 물멍: 50, 알빠노: 45, "700": 55 },
  { week: "W2", 갓생: 62, 물멍: 53, 알빠노: 47, "700": 58 },
  { week: "W3", 갓생: 65, 물멍: 55, 알빠노: 48, "700": 61 },
  { week: "W4", 갓생: 68, 물멍: 57, 알빠노: 50, "700": 65 },
  { week: "W5", 갓생: 70, 물멍: 59, 알빠노: 52, "700": 68 },
  { week: "W6", 갓생: 72, 물멍: 60, 알빠노: 53, "700": 71 },
  { week: "W7", 갓생: 73, 물멍: 62, 알빠노: 54, "700": 74 },
  { week: "W8", 갓생: 75, 물멍: 63, 알빠노: 55, "700": 77 },
  { week: "W9", 갓생: 77, 물멍: 65, 알빠노: 56, "700": 80 },
  { week: "W10", 갓생: 80, 물멍: 67, 알빠노: 57, "700": 83 },
  { week: "W11", 갓생: 83, 물멍: 69, 알빠노: 58, "700": 87 },
  { week: "W12", 갓생: 85, 물멍: 72, 알빠노: 60, "700": 91 },
];

const LINE_COLORS: Record<string, string> = {
  "700": "#F59E0B",
  갓생: "#2F6BFF",
  물멍: "#22C55E",
  알빠노: "#EF4444",
};

const RANK_BAR_COLORS = ["#F59E0B", "#2F6BFF", "#22C55E", "#A78BFA", "#6B7280", "#6B7280", "#6B7280", "#6B7280"];

const periods = ["7일", "30일", "90일"];

// 전례의 위험도(level) 한국어 값 → 색상. 운영 DB에 level 원천이 없어 비어 있을 수 있다.
function levelColor(level: string): string {
  if (level.includes("위험")) return "#EF4444";
  if (level.includes("주의")) return "#F59E0B";
  return "#9CA3AF";
}

// delta(전주 대비) 표기. BE 시계열 미도입으로 현재는 0 → "–".
function deltaLabel(delta: number): { text: string; color: string } {
  if (delta > 0) return { text: `▲${delta}`, color: "#22C55E" };
  if (delta < 0) return { text: `▼${Math.abs(delta)}`, color: "#EF4444" };
  return { text: "–", color: "#9CA3AF" };
}

export default function DashboardPage() {
  const [period, setPeriod] = useState("30일");

  const [events, setEvents] = useState<EventListItem[]>([]);
  const [eventTotal, setEventTotal] = useState(0);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 최초 로드: 사건 목록(전체) + 활성도 랭킹 TOP 8
  useEffect(() => {
    Promise.all([getEvents(100, 0), getTrends(8)])
      .then(([ev, tr]) => {
        // 연결된 논란 광고가 많은 순으로 정렬(동일 건수면 제목 순).
        const sorted = [...ev.events].sort(
          (a, b) => b.issue_count - a.issue_count || a.title.localeCompare(b.title)
        );
        setEvents(sorted);
        setEventTotal(ev.total);
        setTrends(tr.trends);
        if (sorted.length > 0) setSelectedId(sorted[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "불러오기에 실패했습니다."))
      .finally(() => setLoading(false));
  }, []);

  // 선택된 사건의 상세(연결 전례) 로드
  useEffect(() => {
    if (!selectedId) return;
    setDetailLoading(true);
    getEventDetail(selectedId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const issueTotal = events.reduce((sum, e) => sum + e.issue_count, 0);
  const maxUp = Math.max(1, ...trends.map((t) => t.up));

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <p className="text-[11px] text-[#9CA3AF] font-semibold tracking-widest mb-1 uppercase">
        Dashboard · 리스크 모니터링
      </p>

      {/* Title row */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[26px] font-black text-[#111]">광고 리스크 한눈에 보기</h1>
        <div className="flex bg-[#F3F4F6] rounded-lg p-1 gap-0.5">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-[13px] font-medium transition-colors ${
                period === p
                  ? "bg-white text-[#111] shadow-sm"
                  : "text-[#6B7280] hover:text-[#111]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] text-[13px] rounded-lg px-4 py-3 mb-4">
          데이터를 불러오지 못했습니다: {error} — BE 서버가 실행 중인지 확인하세요.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {/* 민감 사건 — 실데이터(events total) */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] text-[#6B7280] font-medium">민감 사건</span>
            <span className="text-[12px] font-semibold text-[#6B7280]">DB</span>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-[34px] font-black text-[#111] leading-none">
              {loading ? "–" : eventTotal}
            </span>
            <span className="text-[13px] text-[#9CA3AF]">건</span>
          </div>
          <p className="text-[11px] text-[#9CA3AF]">민감 이슈 DB</p>
        </div>

        {/* 논란 광고 — 실데이터(issue_count 합계) */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] text-[#6B7280] font-medium">논란 광고</span>
            <span className="text-[12px] font-semibold text-[#6B7280]">연결</span>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-[34px] font-black text-[#111] leading-none">
              {loading ? "–" : issueTotal}
            </span>
            <span className="text-[13px] text-[#9CA3AF]">건</span>
          </div>
          <p className="text-[11px] text-[#9CA3AF]">사건 1:N 연결</p>
        </div>

        {/* 활성도 랭킹 수 — 실데이터(trends) */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] text-[#6B7280] font-medium">트렌드어</span>
            <span className="text-[12px] font-semibold text-[#2F6BFF]">TOP</span>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-[34px] font-black text-[#2F6BFF] leading-none">
              {loading ? "–" : trends.length}
            </span>
            <span className="text-[13px] text-[#9CA3AF]">개</span>
          </div>
          <p className="text-[11px] text-[#9CA3AF]">활성도 랭킹</p>
        </div>

        {/* 활성도 급상승 — delta>0 개수 */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] text-[#6B7280] font-medium">활성도 급상승</span>
            <span className="text-[12px] font-semibold text-[#F59E0B]">▲</span>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-[34px] font-black text-[#111] leading-none">
              {loading ? "–" : trends.filter((t) => t.delta > 0).length}
            </span>
            <span className="text-[13px] text-[#9CA3AF]">개</span>
          </div>
          <p className="text-[11px] text-[#9CA3AF]">전주 대비 상승</p>
        </div>
      </div>

      {/* Chart + ranking */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
        {/* Chart header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[15px] font-bold text-[#111]">신조어 활성도</span>
              <span className="text-[10px] bg-[#F3F4F6] text-[#6B7280] rounded px-2 py-0.5 font-semibold tracking-wide">
                NAVER DataLab
              </span>
            </div>
            <p className="text-[12px] text-[#9CA3AF]">검색 트렌드 기반 활성도 지수 · 최근 12주</p>
          </div>
          <div className="flex gap-4 text-[12px] text-[#6B7280]">
            {Object.entries(LINE_COLORS).map(([name, color]) => (
              <span key={name} className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 inline-block rounded-full" style={{ backgroundColor: color }} />
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Line chart (정적 디자인 데이터) */}
          <div className="flex-1 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[20, 100]}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                />
                {Object.entries(LINE_COLORS).map(([name, color]) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Ranking — 실데이터(/trends) */}
          <div className="w-[230px] shrink-0">
            <p className="text-[11px] text-[#9CA3AF] font-semibold mb-3 uppercase tracking-wider">
              활성도 랭킹 · TOP {trends.length || 8}
            </p>
            {loading ? (
              <p className="text-[12px] text-[#9CA3AF]">불러오는 중…</p>
            ) : trends.length === 0 ? (
              <p className="text-[12px] text-[#9CA3AF]">데이터 없음</p>
            ) : (
              <div className="flex flex-col gap-2">
                {trends.map((t, i) => {
                  const term = t.tag.replace(/^#/, "");
                  const d = deltaLabel(t.delta);
                  return (
                    <div key={t.tag} className="flex items-center gap-2">
                      <span className="text-[11px] text-[#9CA3AF] w-3 shrink-0">{t.rank || i + 1}</span>
                      <span className="text-[12px] font-medium text-[#111] w-12 shrink-0 truncate">{term}</span>
                      <div className="flex-1 h-[6px] bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.round((t.up / maxUp) * 100)}%`,
                            backgroundColor: RANK_BAR_COLORS[i] ?? "#6B7280",
                          }}
                        />
                      </div>
                      <span className="text-[12px] font-bold text-[#111] w-6 text-right shrink-0">{t.up}</span>
                      <span
                        className="text-[11px] font-semibold w-8 text-right shrink-0"
                        style={{ color: d.color }}
                      >
                        {d.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Incident mapping section — 실데이터(/events) */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[15px] font-bold text-[#111]">민감 사건 매핑</span>
            <p className="text-[12px] text-[#9CA3AF] mt-0.5">사건별 연결된 논란 광고 현황</p>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Incident list */}
          <div className="w-[260px] shrink-0 bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
            {loading ? (
              <p className="text-[12px] text-[#9CA3AF] px-4 py-3">불러오는 중…</p>
            ) : events.length === 0 ? (
              <p className="text-[12px] text-[#9CA3AF] px-4 py-3">사건이 없습니다</p>
            ) : (
              <div className="max-h-[440px] overflow-y-auto">
                {events.map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => setSelectedId(inc.id)}
                    className={`w-full text-left px-4 py-3 border-b border-[#F3F4F6] last:border-0 transition-colors ${
                      selectedId === inc.id ? "bg-[#F0F5FF]" : "hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0" />
                        <span className="text-[13px] font-semibold text-[#111] truncate">{inc.title}</span>
                      </div>
                      {inc.year && (
                        <span className="text-[11px] text-[#9CA3AF] shrink-0 ml-1">{inc.year}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pl-4">
                      {inc.category && (
                        <span className="text-[10px] bg-[#F3F4F6] text-[#6B7280] rounded px-1.5 py-0.5 font-medium">
                          {inc.category}
                        </span>
                      )}
                      <span className="text-[11px] text-[#9CA3AF]">연결 광고 {inc.issue_count}건</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected incident detail */}
          <div className="flex-1 bg-white rounded-xl border border-[#E5E7EB] p-5">
            {detailLoading || !detail ? (
              <p className="text-[13px] text-[#9CA3AF]">
                {detailLoading ? "상세 불러오는 중…" : "사건을 선택하세요"}
              </p>
            ) : (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0" />
                      <span className="text-[16px] font-bold text-[#111]">{detail.title}</span>
                      {detail.category && (
                        <span className="text-[10px] bg-[#F3F4F6] text-[#6B7280] rounded px-1.5 py-0.5 font-medium">
                          {detail.category}
                        </span>
                      )}
                      {detail.year && <span className="text-[12px] text-[#9CA3AF]">{detail.year}</span>}
                    </div>
                    <p className="text-[13px] text-[#6B7280] leading-relaxed">{detail.description}</p>
                  </div>
                </div>

                <p className="text-[11px] font-semibold text-[#9CA3AF] mb-3 uppercase tracking-wider">
                  연결된 논란 광고 · {detail.issues.length}건
                </p>

                {detail.issues.length === 0 ? (
                  <p className="text-[13px] text-[#9CA3AF] py-4 text-center">연결된 논란 광고가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.issues.map((ad) => (
                      <div
                        key={ad.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-[#F3F4F6] bg-[#FAFAFA]"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#E5E7EB] shrink-0 flex items-center justify-center text-[11px] font-bold text-[#6B7280]">
                          {ad.brand.split(" ")[0]?.slice(0, 2) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-semibold text-[#111] truncate">{ad.brand}</span>
                            {ad.campaign && <span className="text-[11px] text-[#9CA3AF]">{ad.campaign}</span>}
                            {ad.year && <span className="text-[11px] text-[#9CA3AF]">{ad.year}</span>}
                          </div>
                          <p className="text-[12px] text-[#6B7280] truncate">{ad.copy}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {ad.level && (
                            <span
                              className="text-[11px] font-bold px-2 py-0.5 rounded"
                              style={{ color: levelColor(ad.level), background: levelColor(ad.level) + "18" }}
                            >
                              {ad.level}
                            </span>
                          )}
                          {ad.result && <span className="text-[11px] text-[#9CA3AF]">{ad.result}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
