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
  precedents: Array<{
    issue_id: string;
    region: string;
    title: string;
    description: string;
    topic_id: string;
  }>;
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
};

export type GenerateCandidate = {
  text: string;
  score: number;
  safety_label: string;
  note: string;
  review_id?: string;
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
