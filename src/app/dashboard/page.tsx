"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getEvents,
  getEventDetail,
  getTrends,
  type EventListItem,
  type EventDetail,
  type EventIssue,
  type TrendItem,
} from "@/lib/api";

// 라인차트 색상 팔레트(활성도 상위 신조어에 순서대로 매핑).
const LINE_PALETTE = ["#2F6BFF", "#F59E0B", "#22C55E", "#EF4444"];

// 라인차트에 표시할 신조어 개수(활성도 상위 N).
const TOP_LINES = 4;

// toWeekly 는 90일 일별 검색비율 배열을 주 단위 평균(반올림)으로 다운샘플한다.
// 배열의 끝이 최신일이며, 결과의 끝이 이번 주가 된다.
function toWeekly(ratios: number[]): number[] {
  const weeks: number[] = [];
  for (let i = 0; i < ratios.length; i += 7) {
    const chunk = ratios.slice(i, i + 7);
    if (chunk.length === 0) break;
    const sum = chunk.reduce((s, v) => s + v, 0);
    weeks.push(Math.round(sum / chunk.length));
  }
  return weeks;
}

const RANK_BAR_COLORS = ["#F59E0B", "#2F6BFF", "#22C55E", "#A78BFA", "#6B7280", "#6B7280", "#6B7280", "#6B7280"];

// 전례의 위험도(level) 한국어 값 → 색상. 운영 DB에 level 원천이 없어 비어 있을 수 있다.
function levelColor(level: string): string {
  if (level.includes("위험")) return "#EF4444";
  if (level.includes("주의")) return "#F59E0B";
  return "#9CA3AF";
}

// delta(최근 7일 평균 vs 직전 7일 평균 검색비율 변화) 표기. 0이면 "–".
function deltaLabel(delta: number): { text: string; color: string } {
  if (delta > 0) return { text: `▲${delta}`, color: "#22C55E" };
  if (delta < 0) return { text: `▼${Math.abs(delta)}`, color: "#EF4444" };
  return { text: "–", color: "#9CA3AF" };
}

export default function DashboardPage() {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [eventTotal, setEventTotal] = useState(0);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<EventIssue | null>(null);

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

  // 라인차트용: 활성도 상위 TOP_LINES 개를 주 단위 시계열로 변환.
  const topTrends = trends.slice(0, TOP_LINES);
  const lineWords = topTrends.map((t) => t.tag.replace(/^#/, ""));
  const weeklySeries = topTrends.map((t) => toWeekly(t.ratios ?? []));
  const weekCount = weeklySeries.reduce((m, w) => Math.max(m, w.length), 0);
  const chartData = Array.from({ length: weekCount }, (_, i) => {
    const weeksAgo = weekCount - 1 - i;
    const point: Record<string, number | string> = {
      week: weeksAgo === 0 ? "이번주" : `${weeksAgo}주 전`,
    };
    lineWords.forEach((w, idx) => {
      point[w] = weeklySeries[idx][i] ?? 0;
    });
    return point;
  });

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <p className="text-[11px] text-[#9CA3AF] font-semibold tracking-widest mb-1 uppercase">
        Dashboard · 리스크 모니터링
      </p>

      {/* Title row */}
      <div className="mb-6">
        <h1 className="text-[26px] font-black text-[#111]">광고 리스크 한눈에 보기</h1>
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
            <p className="text-[12px] text-[#9CA3AF]">검색 트렌드 기반 활성도 추이 · 최근 90일(주 단위)</p>
          </div>
          <div className="flex gap-4 text-[12px] text-[#6B7280] flex-wrap justify-end">
            {lineWords.map((name, idx) => (
              <span key={name} className="flex items-center gap-1.5">
                <span
                  className="w-4 h-0.5 inline-block rounded-full"
                  style={{ backgroundColor: LINE_PALETTE[idx % LINE_PALETTE.length] }}
                />
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Line chart — mim_terms.search_ratios_90d (주 단위) */}
          <div className="flex-1 h-[200px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-[12px] text-[#9CA3AF]">
                불러오는 중…
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[12px] text-[#9CA3AF]">
                데이터 없음
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
                  <CartesianGrid vertical={false} stroke="#F3F4F6" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={20}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #E5E7EB",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  />
                  {lineWords.map((name, idx) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={LINE_PALETTE[idx % LINE_PALETTE.length]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
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
                    <div
                      key={t.tag}
                      className="group relative flex items-center gap-2 cursor-help"
                    >
                      <span className="text-[11px] text-[#9CA3AF] w-3 shrink-0">{t.rank || i + 1}</span>
                      <span className="text-[12px] font-medium text-[#111] w-12 shrink-0 truncate">{term}</span>
                      <div className="flex-1 h-[6px] bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(0, Math.min(100, Math.round((t.up / maxUp) * 100)))}%`,
                            backgroundColor: RANK_BAR_COLORS[i] ?? "#6B7280",
                          }}
                        />
                      </div>
                      <span className="text-[12px] font-bold text-[#111] w-8 text-right shrink-0">{t.up.toFixed(1)}</span>
                      <span
                        className="text-[11px] font-semibold w-8 text-right shrink-0"
                        style={{ color: d.color }}
                      >
                        {d.text}
                      </span>
                      {t.definition && (
                        <div className="pointer-events-none absolute right-0 bottom-full z-20 mb-1.5 hidden w-[240px] rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[11px] leading-[1.6] text-[#6B7280] shadow-lg group-hover:block">
                          <span className="block font-bold text-[#111] mb-0.5">{term}</span>
                          {t.definition}
                        </div>
                      )}
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
          <div className="w-[260px] shrink-0 self-start bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
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
          <div className="flex-1 min-w-0 bg-white rounded-xl border border-[#E5E7EB] p-5">
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
                    <p
                      className="text-[13px] text-[#6B7280] leading-[1.85]"
                      style={{ wordBreak: "keep-all", textWrap: "pretty" }}
                    >
                      {detail.description}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] font-semibold text-[#9CA3AF] mb-3 uppercase tracking-wider">
                  연결된 논란 광고 · {detail.issues.length}건
                </p>

                {detail.issues.length === 0 ? (
                  <p className="text-[13px] text-[#9CA3AF] py-4 text-center">연결된 논란 광고가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.issues.map((ad, i) => (
                      <button
                        key={ad.id}
                        onClick={() => setSelectedIssue(ad)}
                        className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-[#F3F4F6] bg-[#FAFAFA] hover:bg-[#F0F5FF] hover:border-[#D6E4FF] transition-colors cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-full bg-white border border-[#E5E7EB] shrink-0 flex items-center justify-center text-[11px] font-bold text-[#9CA3AF]">
                          {i + 1}
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
                          <span className="text-[#D1D5DB] text-[15px] leading-none">›</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 논란 광고 사례 전문 모달 */}
      {selectedIssue && (
        <div
          onClick={() => setSelectedIssue(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl max-w-[640px] w-full max-h-[85vh] overflow-y-auto p-7"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0" />
                {selectedIssue.year && (
                  <span className="text-[12px] font-bold text-[#6B7280]">{selectedIssue.year}</span>
                )}
                {selectedIssue.level && (
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded"
                    style={{ color: levelColor(selectedIssue.level), background: levelColor(selectedIssue.level) + "18" }}
                  >
                    {selectedIssue.level}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-[#9CA3AF] hover:text-[#111] text-[20px] leading-none shrink-0"
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <h3
              className="text-[18px] font-black text-[#111] mb-3 leading-snug"
              style={{ wordBreak: "keep-all", textWrap: "balance" }}
            >
              {selectedIssue.brand}
            </h3>
            {(selectedIssue.campaign || selectedIssue.result) && (
              <p className="text-[12px] text-[#9CA3AF] mb-3">
                {[selectedIssue.campaign, selectedIssue.result].filter(Boolean).join(" · ")}
              </p>
            )}
            {selectedIssue.copy ? (
              <p
                className="text-[14px] text-[#374151] leading-[1.9] whitespace-pre-wrap border-t border-[#F3F4F6] pt-4"
                style={{ wordBreak: "keep-all", textWrap: "pretty" }}
              >
                {selectedIssue.copy}
              </p>
            ) : (
              <p className="text-[13px] text-[#9CA3AF] border-t border-[#F3F4F6] pt-4">상세 설명이 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
