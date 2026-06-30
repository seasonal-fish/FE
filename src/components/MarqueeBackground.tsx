// Hero 배경에 광고 문구가 사선으로 흐르는 데코레이션 레이어.
// 키프레임을 컴포넌트에 직접 포함(<style>)해 dev 서버 CSS 상태와 무관하게 항상 동작한다.
// 장식 요소이므로 aria-hidden + pointer-events-none 으로 접근성/클릭을 막는다.

type Row = { text: string; dir: "left" | "right"; dur: number; color?: string };

const ROWS: Row[] = [
  { text: "단 하나의 카피가 브랜드를 바꾼다 · 지금 바로 시작하세요 · 역대급 혜택 · ", dir: "left", dur: 64 },
  { text: "느낌 아니까 · 갓성비 끝판왕 · 오늘만 이 가격 · 한 끗 차이의 디테일 · ", dir: "right", dur: 80, color: "#2F6BFF" },
  { text: "광고가 나가기 전에 · 리스크 제로 · 민감 표현 자동 감지 · ", dir: "left", dur: 72 },
  { text: "사람이 놓친 한 단어 · 결재 라인이 놓친 빈틈 · 브랜드를 지키는 검토 · ", dir: "right", dur: 92 },
  { text: "트렌드를 입히다 · 안전한 카피 · 위험 표현 OUT · 지금 검토하세요 · ", dir: "left", dur: 76, color: "#2F6BFF" },
];

const KEYFRAMES = `
@keyframes mqx-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes mqx-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
@media (prefers-reduced-motion: reduce) {
  .mq-row { animation: none !important; }
}
`;

export default function MarqueeBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <div className="absolute left-1/2 top-1/2 flex w-[170vw] h-[170vh] -translate-x-1/2 -translate-y-1/2 -rotate-12 flex-col justify-center gap-[1.2vw] opacity-[0.06]">
        {ROWS.map((row, i) => {
          const chunk = row.text.repeat(3);
          return (
            <div
              key={i}
              className="mq-row flex w-max whitespace-nowrap text-[5.5vw] font-black leading-[1.25] tracking-tight"
              style={{
                color: row.color ?? "#111111",
                willChange: "transform",
                animation: `mqx-${row.dir} ${row.dur}s linear infinite`,
              }}
            >
              <span className="shrink-0">{chunk}</span>
              <span className="shrink-0">{chunk}</span>
            </div>
          );
        })}
      </div>
      {/* 중앙(히어로 텍스트 영역)을 부드럽게 가려 작은 문구 가독성 확보 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at center, rgba(247,247,248,0.92) 0%, rgba(247,247,248,0.55) 38%, rgba(247,247,248,0) 72%)",
        }}
      />
    </div>
  );
}
