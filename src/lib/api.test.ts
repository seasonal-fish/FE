import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEvents, getEventDetail, postReview, uploadImage } from "./api";

const BASE = "http://localhost:8080";

function mockFetch(impl: (...args: Parameters<typeof fetch>) => Response | Promise<Response>) {
  const spy = vi.fn(impl);
  vi.stubGlobal("fetch", spy);
  return spy;
}

function jsonResponse(body: unknown, init?: { ok?: boolean; statusText?: string }): Response {
  return {
    ok: init?.ok ?? true,
    statusText: init?.statusText ?? "OK",
    json: async () => body,
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getEvents", () => {
  it("기본 limit/offset(20/0)으로 /events 를 조회하고 본문을 반환한다", async () => {
    const payload = { events: [{ id: "e1", title: "사건", category: "음식", year: "", issue_count: 2 }], total: 1 };
    const spy = mockFetch(() => jsonResponse(payload));

    const result = await getEvents();

    expect(spy).toHaveBeenCalledWith(`${BASE}/events?limit=20&offset=0`);
    expect(result).toEqual(payload);
  });

  it("전달한 limit/offset 을 쿼리스트링에 반영한다", async () => {
    const spy = mockFetch(() => jsonResponse({ events: [], total: 0 }));

    await getEvents(5, 10);

    expect(spy).toHaveBeenCalledWith(`${BASE}/events?limit=5&offset=10`);
  });

  it("응답이 ok 가 아니면 statusText 로 throw 한다", async () => {
    mockFetch(() => jsonResponse(null, { ok: false, statusText: "Internal Server Error" }));

    await expect(getEvents()).rejects.toThrow("Internal Server Error");
  });
});

describe("getEventDetail", () => {
  it("id 를 encodeURIComponent 로 인코딩해 상세를 조회한다", async () => {
    const detail = { id: "a b", title: "t", year: "2020", category: "c", description: "d", issues: [] };
    const spy = mockFetch(() => jsonResponse(detail));

    const result = await getEventDetail("a b");

    expect(spy).toHaveBeenCalledWith(`${BASE}/events/a%20b`);
    expect(result).toEqual(detail);
  });

  it("응답이 ok 가 아니면 statusText 로 throw 한다", async () => {
    mockFetch(() => jsonResponse(null, { ok: false, statusText: "Not Found" }));

    await expect(getEventDetail("missing")).rejects.toThrow("Not Found");
  });
});

describe("uploadImage", () => {
  const file = new File(["data"], "ad.png", { type: "image/png" });

  it("이미지를 multipart 로 POST 하고 OCR 결과를 반환한다", async () => {
    const payload = {
      id: "u1",
      file_name: "ad.png",
      content_type: "image/png",
      file_size_bytes: 4,
      ocr_provider: "clova",
      ocr_status: "done",
      ocr_text: "추출 텍스트",
      created_at: "2026-06-30T00:00:00Z",
    };
    const spy = mockFetch(() => jsonResponse(payload));

    const result = await uploadImage(file);

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe(`${BASE}/upload-image`);
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeInstanceOf(FormData);
    // boundary 가 깨지지 않도록 Content-Type 을 직접 지정하지 않는다
    expect(init?.headers).toBeUndefined();
    expect((init?.body as FormData).get("image")).toBe(file);
    expect(result).toEqual(payload);
  });

  it("실패 응답의 error 메시지를 추출해 throw 한다", async () => {
    mockFetch(() => jsonResponse({ error: "파일이 너무 큽니다" }, { ok: false, statusText: "Payload Too Large" }));

    await expect(uploadImage(file)).rejects.toThrow("파일이 너무 큽니다");
  });

  it("실패 응답 본문이 JSON 이 아니면 statusText 로 fallback 한다", async () => {
    mockFetch(
      () =>
        ({
          ok: false,
          statusText: "Bad Gateway",
          json: async () => {
            throw new Error("invalid json");
          },
        }) as unknown as Response
    );

    await expect(uploadImage(file)).rejects.toThrow("Bad Gateway");
  });
});

describe("postReview", () => {
  const review = { id: "r1", input: "문구" };

  function parseBody(spy: ReturnType<typeof mockFetch>) {
    const init = spy.mock.calls[0][1];
    return JSON.parse(init?.body as string);
  }

  it("source 없이 호출하면 body 에 text 만 담아 /review 로 POST 한다", async () => {
    const spy = mockFetch(() => jsonResponse(review));

    const result = await postReview("문구");

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe(`${BASE}/review`);
    expect(init?.method).toBe("POST");
    expect(parseBody(spy)).toEqual({ text: "문구" });
    expect(result).toEqual(review);
  });

  it("source='image' 를 전달하면 body 에 text 와 source 를 함께 담는다", async () => {
    const spy = mockFetch(() => jsonResponse(review));

    await postReview("문구", "image");

    expect(parseBody(spy)).toEqual({ text: "문구", source: "image" });
  });

  it("실패 응답의 error 메시지를 추출해 throw 한다", async () => {
    mockFetch(() => jsonResponse({ error: "검토 실패" }, { ok: false, statusText: "Bad Request" }));

    await expect(postReview("문구")).rejects.toThrow("검토 실패");
  });

  it("실패 응답 본문이 JSON 이 아니면 statusText 로 fallback 한다", async () => {
    mockFetch(
      () =>
        ({
          ok: false,
          statusText: "Service Unavailable",
          json: async () => {
            throw new Error("invalid json");
          },
        }) as unknown as Response
    );

    await expect(postReview("문구")).rejects.toThrow("Service Unavailable");
  });
});
