"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { getHistoryList, getHistoryStats, type HistoryItem, type StatCard } from "@/lib/api";

function scoreColor(s: number) {
  if (s >= 67) return "#EF4444";
  if (s >= 34) return "#F59E0B";
  return "#22C55E";
}

function formatDate(dateStr: string) {
  return dateStr.slice(0, 10).replace(/-/g, ".");
}

function srcLabel(src: string) {
  if (src === "generate") return "생성";
  if (src === "image") return "이미지";
  return "텍스트";
}

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getHistoryList(20, 0), getHistoryStats()])
      .then(([history, statsData]) => {
        setItems(history.items);
        setStats(statsData.cards);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "불러오기에 실패했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <h1 className="text-[26px] font-black text-[#111] mb-6">검토 히스토리</h1>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-4 animate-pulse h-[90px]" />
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-${Math.max(stats.length, 1)} gap-3 mb-6`}>
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <p className="text-[12px] text-[#6B7280] font-medium mb-2">{s.label}</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-[30px] font-black leading-none text-[#111]">{s.value}</span>
                <span className="text-[13px] text-[#9CA3AF] ml-0.5">{s.unit}</span>
              </div>
              <p className="text-[11px] text-[#9CA3AF] mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#EF4444]">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F3F4F6]">
              {["DATE", "문구", "출처", "위험도"].map((h) => (
                <th key={h}
                  className={clsx(
                    "text-left px-5 py-3 text-[11px] font-semibold text-[#9CA3AF] tracking-wider uppercase",
                    h === "위험도" && "text-right"
                  )}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#F9FAFB]">
                  {Array.from({ length: 4 }).map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-[#F3F4F6] rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-[13px] text-[#9CA3AF]">
                  검토 기록이 없습니다. 문구를 검토해보세요.
                </td>
              </tr>
            ) : (
              items.map((row) => {
                const color = scoreColor(row.score);
                return (
                  <tr key={row.id}
                    className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFAFA] cursor-pointer transition-colors"
                    onClick={() => router.push(`/review/${row.id}`)}>
                    <td className="px-5 py-4 text-[12px] text-[#9CA3AF] whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[14px] font-semibold text-[#111]">{row.title}</p>
                      <p className="text-[12px] text-[#9CA3AF] mt-0.5">{row.snippet}</p>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[#6B7280] whitespace-nowrap">
                      {srcLabel(row.src)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center justify-center min-w-[40px] h-[32px] rounded-lg border-2 text-[15px] font-black px-2"
                        style={{ borderColor: color, color }}>
                        {row.score}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
