const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type Severity = "high" | "needs_review" | "low";

export type Highlight = {
  phrase: string;
  start: number | null;
  end: number | null;
  severity: Severity;
  tag: string;
  category: string;
  date: string;
  reason: string;
  basis: string;
  confidence: number;
  alt?: string;
};

// RelatedItem 은 임베딩 테이블(sensitive_issues / slang_terms / mim_terms)에서
// 벡터 유사도로 검색된 연관 사례 한 건입니다. source 가 출처 테이블을 가리킵니다.
export type RelatedItem = {
  source: string;
  id: string;
  title: string;
  category?: string;
  snippet?: string;
  similarity: number;
};

export type ReviewResult = {
  id: string;
  input: string;
  verdict: {
    risky: boolean;
    risk_level: "none" | "low" | "medium" | "high";
    score: number;
    reasons: string[];
    advice: string;
  };
  highlights: Highlight[];
  rewrite: { before: string; after: string };
  related_topics: Array<{
    id: string;
    title: string;
    category: string;
    event_date: string;
    description: string;
    similarity: number;
  }>;
  related_issues: RelatedItem[];
  related_slang: RelatedItem[];
  related_trends: RelatedItem[];
};

export type HistoryItem = {
  id: string;
  date: string;
  title: string;
  snippet: string;
  src: "text" | "generate";
  status: "reviewed" | "needs_review";
  score: number;
};

export type StatCard = {
  label: string;
  value: string;
  unit: string;
  sub: string;
};

export type TrendItem = {
  tag: string;
  category: string;
  up: number;
  rank: number;
  delta: number;
};

export type GenerateCandidate = {
  text: string;
  score: number;
  safety_label: string;
  note: string;
  review_id?: string;
};

// 민감 사건 목록 한 행 (GET /events)
export type EventListItem = {
  id: string;
  title: string;
  category: string;
  year: string; // event_date 가 기념일(MM-DD)이라 비어 있을 수 있음
  issue_count: number;
};

// 사건에 연결된 논란 전례 한 건. campaign/level/result 는 운영 DB에 원천이 없어 빈 값일 수 있음.
export type EventIssue = {
  id: string;
  brand: string;
  campaign: string;
  year: string;
  level: string;
  copy: string;
  result: string;
};

// 민감 사건 상세 (GET /events/:id)
export type EventDetail = {
  id: string;
  title: string;
  year: string;
  category: string;
  description: string;
  issues: EventIssue[];
};

export async function postReview(text: string): Promise<ReviewResult> {
  const res = await fetch(`${BASE}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json();
}

export async function getHistoryList(
  limit = 20,
  offset = 0
): Promise<{ items: HistoryItem[]; total: number }> {
  const res = await fetch(`${BASE}/history?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function getHistoryStats(): Promise<{ cards: StatCard[] }> {
  const res = await fetch(`${BASE}/history/stats`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function getHistoryDetail(id: string): Promise<ReviewResult> {
  const res = await fetch(`${BASE}/history/${id}`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function getTrends(
  limit = 12
): Promise<{ trends: TrendItem[] }> {
  const res = await fetch(`${BASE}/trends?limit=${limit}`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function postGenerate(
  product: string,
  tone: string,
  trends: string[]
): Promise<{ candidates: GenerateCandidate[] }> {
  const res = await fetch(`${BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product, tone, trends }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json();
}

export async function getEvents(
  limit = 20,
  offset = 0
): Promise<{ events: EventListItem[]; total: number }> {
  const res = await fetch(`${BASE}/events?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function getEventDetail(id: string): Promise<EventDetail> {
  const res = await fetch(`${BASE}/events/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

// 이미지 업로드(OCR) 응답. BE 가 CLOVA OCR 을 즉시 호출해 ocr_text 를 함께 반환한다.
export type UploadImageResult = {
  id: string;
  file_name: string;
  content_type: string;
  file_size_bytes: number;
  ocr_provider: string;
  ocr_status: string; // done | failed | pending 등
  ocr_text?: string;
  created_at: string;
};

// uploadImage 는 이미지를 멀티파트로 업로드하고 OCR 추출 결과를 받는다.
// (FormData 사용 시 Content-Type 헤더를 직접 지정하면 boundary 가 깨지므로 설정하지 않는다.)
export async function uploadImage(file: File): Promise<UploadImageResult> {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${BASE}/upload-image`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json();
}
