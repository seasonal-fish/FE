"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";

const HISTORY = [
  {
    id: "demo",
    date: "2026.06.22",
    title: "여름 워터파크 프로모션 헤드라인",
    preview: "…책상을 탁 치고 떠나는 시원한…",
    source: "OCR · 포스터",
    status: "검토 완료",
    score: 78,
  },
  {
    id: "demo",
    date: "2026.06.21",
    title: "신상 음료 SNS 카피 A/B",
    preview: "한 입에 시원하게 갓생 중진",
    source: "텍스트",
    status: "needs_review",
    score: 34,
  },
  {
    id: "demo",
    date: "2026.06.20",
    title: "브랜드 캠페인 슬로건",
    preview: "다시의 한 끼를 나눠요",
    source: "텍스트",
    status: "검토 완료",
    score: 8,
  },
  {
    id: "demo",
    date: "2026.06.19",
    title: "여름 시즌 배너 문구",
    preview: "이번 여름은 갓성비로 즐겨요",
    source: "텍스트",
    status: "검토 완료",
    score: 15,
  },
  {
    id: "demo",
    date: "2026.06.18",
    title: "신규 멤버십 혜택 안내",
    preview: "멤버십으로 700하세요",
    source: "OCR · 포스터",
    status: "고위험 차단",
    score: 91,
  },
];

const STATUS_STYLE = {
  "검토 완료":   "bg-[#F3F4F6] text-[#6B7280]",
  "needs_review": "bg-[#FEF3C7] text-[#92400E]",
  "고위험 차단":  "bg-[#FEE2E2] text-[#991B1B]",
} as const;

function scoreColor(s: number) {
  if (s >= 67) return "#EF4444";
  if (s >= 34) return "#F59E0B";
  return "#22C55E";
}

export default function HistoryPage() {
  const router = useRouter();

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <h1 className="text-[26px] font-black text-[#111] mb-6">검토 히스토리</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "이번 달 검토", value: "124", unit: "건",    sub: "+18% vs 지난달",  color: "#111" },
          { label: "평균 위험도",   value: "32",  unit: "/100", sub: "안전 구간",        color: "#111" },
          { label: "needs_review", value: "7",   unit: "건",    sub: "사람 확인 대기",   color: "#111" },
          { label: "고위험 차단",   value: "9",   unit: "건",    sub: "배포 전 차단",     color: "#111" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <p className="text-[12px] text-[#6B7280] font-medium mb-2">{s.label}</p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[30px] font-black leading-none" style={{ color: s.color }}>
                {s.value}
              </span>
              <span className="text-[13px] text-[#9CA3AF] ml-0.5">{s.unit}</span>
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F3F4F6]">
              {["DATE", "문구", "출처", "상태", "위험도"].map((h) => (
                <th
                  key={h}
                  className={clsx(
                    "text-left px-5 py-3 text-[11px] font-semibold text-[#9CA3AF] tracking-wider uppercase",
                    h === "위험도" && "text-right"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HISTORY.map((row, i) => {
              const color = scoreColor(row.score);
              return (
                <tr
                  key={i}
                  className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFAFA] cursor-pointer transition-colors"
                  onClick={() => router.push(`/review/${row.id}`)}
                >
                  <td className="px-5 py-4 text-[12px] text-[#9CA3AF] whitespace-nowrap">
                    {row.date}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[14px] font-semibold text-[#111]">{row.title}</p>
                    <p className="text-[12px] text-[#9CA3AF] mt-0.5">{row.preview}</p>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[#6B7280] whitespace-nowrap">
                    {row.source}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={clsx(
                        "text-[12px] font-semibold px-2.5 py-1 rounded-full",
                        STATUS_STYLE[row.status as keyof typeof STATUS_STYLE]
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {/* Score badge — bordered box */}
                    <span
                      className="inline-flex items-center justify-center min-w-[40px] h-[32px] rounded-lg border-2 text-[15px] font-black px-2"
                      style={{ borderColor: color, color }}
                    >
                      {row.score}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
