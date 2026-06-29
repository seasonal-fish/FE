"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileImage, X } from "lucide-react";
import { postReview, uploadImage } from "@/lib/api";

type InputTab = "text" | "ocr";

const STEPS = [
  "문구 정규화 & 토큰화",
  "의미 임베딩 생성",
  "지식베이스 RAG 검색",
  "민감 이슈 / 신조어 매칭",
  "LLM 리스크 추론",
  "리포트 생성",
];

export default function ReviewPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [inputTab, setInputTab] = useState<InputTab>("text");
  const [text, setText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, []);

  const handleFileChange = (file: File) => {
    if (file.type.startsWith("image/") || file.type === "application/pdf") {
      setUploadedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const canSubmit = text.trim().length > 0;

  const handleOcrExtract = async () => {
    if (!uploadedFile) return;
    setOcrError(null);
    setIsOcrLoading(true);
    try {
      const result = await uploadImage(uploadedFile);
      if (result.ocr_text) {
        setText(result.ocr_text);
        setInputTab("text");
        setUploadedFile(null);
      } else {
        setOcrError("텍스트를 추출하지 못했습니다. 이미지가 명확한지 확인해주세요.");
      }
    } catch (e) {
      setOcrError(e instanceof Error ? e.message : "OCR 요청에 실패했습니다.");
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setIsLoading(true);
    setCurrentStep(0);

    let step = 0;
    stepTimerRef.current = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step >= 5) {
        clearInterval(stepTimerRef.current!);
        stepTimerRef.current = null;
      }
    }, 600);

    try {
      const result = await postReview(text);
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
        stepTimerRef.current = null;
      }
      router.push(`/review/${result.id}`);
    } catch (e) {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
        stepTimerRef.current = null;
      }
      setError(e instanceof Error ? e.message : "검토 요청에 실패했습니다.");
      setIsLoading(false);
      setCurrentStep(0);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-10 py-12">
        <div className="text-center">
          <div className="w-14 h-14 border-[3px] border-[#E5E7EB] border-t-[#6B7280] rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-[22px] font-black text-[#111]">리스크를 분석하는 중...</h2>
          <p className="text-[13px] text-[#9CA3AF] font-mono mt-1.5">knowledge-base RAG pipeline</p>
        </div>
        <div className="w-[480px] space-y-2">
          {STEPS.map((stepLabel, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all ${
                i === currentStep && currentStep < 6
                  ? "bg-white border border-[#E5E7EB] shadow-sm"
                  : ""
              }`}
            >
              {i < currentStep ? (
                <span className="w-7 h-7 rounded-full bg-[#22C55E] flex items-center justify-center shrink-0">
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                    <path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              ) : i === currentStep ? (
                <span className="w-7 h-7 rounded-full bg-[#111] flex items-center justify-center shrink-0 text-white text-[12px] font-bold">
                  {i + 1}
                </span>
              ) : (
                <span className="w-7 h-7 rounded-full border-2 border-[#E5E7EB] flex items-center justify-center shrink-0 text-[#C0C0C0] text-[12px] font-bold">
                  {i + 1}
                </span>
              )}
              <span
                className={`text-[14px] font-medium ${
                  i < currentStep ? "text-[#374151]" : i === currentStep ? "text-[#111]" : "text-[#C0C0C0]"
                }`}
              >
                {stepLabel}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto px-6 py-10">
      {/* Header */}
      <p className="text-[11px] text-[#9CA3AF] font-semibold tracking-widest mb-1 uppercase">
        Review · 광고 문구 검토
      </p>
      <h1 className="text-[26px] font-black text-[#111] mb-1">광고 문구 리스크 검토</h1>
      <p className="text-[14px] text-[#6B7280] mb-8">
        문구를 입력하거나 포스터를 업로드하면 리스크를 자동 진단합니다.
      </p>

      {/* Tabs */}
      <div className="flex gap-0 mb-5 border-b border-[#E5E7EB]">
        {([
          { id: "text", label: "문구 입력" },
          { id: "ocr", label: "OCR 업로드" },
        ] as { id: InputTab; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setInputTab(tab.id)}
            className={`px-5 py-2.5 text-[14px] font-semibold border-b-2 -mb-px transition-colors ${
              inputTab === tab.id
                ? "border-[#2F6BFF] text-[#2F6BFF]"
                : "border-transparent text-[#9CA3AF] hover:text-[#6B7280]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: 문구 입력 */}
      {inputTab === "text" && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 mb-6">
          <label className="text-[12px] text-[#6B7280] font-semibold mb-2 block">
            광고 문구 입력
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="광고 카피, 슬로건, 헤드라인 등을 입력하세요..."
            className="w-full h-40 resize-none text-[15px] text-[#111] placeholder:text-[#C0C0C0] outline-none leading-relaxed"
          />
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#F3F4F6]">
            <span className="text-[12px] text-[#C0C0C0]">{text.length}자</span>
            <span className="text-[12px] text-[#9CA3AF]">최대 2,000자</span>
          </div>
        </div>
      )}

      {/* Tab: OCR 업로드 */}
      {inputTab === "ocr" && (
        <div className="mb-6">
          {uploadedFile ? (
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center gap-3">
                <FileImage size={20} className="text-[#2F6BFF]" />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-[#111]">{uploadedFile.name}</p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    {(uploadedFile.size / 1024).toFixed(0)} KB · CLOVA OCR
                  </p>
                </div>
                <button
                  onClick={() => { setUploadedFile(null); setOcrError(null); }}
                  className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              {ocrError && (
                <div className="px-4 py-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#EF4444]">
                  {ocrError}
                </div>
              )}
              <button
                onClick={handleOcrExtract}
                disabled={isOcrLoading}
                className="w-full bg-[#111] text-white py-3 rounded-lg text-[14px] font-semibold
                  hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {isOcrLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    텍스트 추출 중...
                  </>
                ) : (
                  "OCR 텍스트 추출 →"
                )}
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-[#2F6BFF] bg-[#EEF3FF]"
                  : "border-[#E5E7EB] hover:border-[#2F6BFF] hover:bg-[#F7F9FF]"
              }`}
            >
              <Upload size={32} className="mx-auto text-[#9CA3AF] mb-3" />
              <p className="text-[14px] font-medium text-[#6B7280]">
                포스터 이미지를 드래그하거나 클릭해서 업로드
              </p>
              <p className="text-[12px] text-[#9CA3AF] mt-1">PNG, JPG · 최대 5MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileChange(file);
            }}
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#EF4444]">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || inputTab === "ocr"}
        className="w-full bg-[#2F6BFF] text-white py-3.5 rounded-lg text-[15px] font-semibold
          hover:bg-[#1a56e8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center gap-2"
      >
        {inputTab === "ocr" ? "이미지에서 텍스트를 먼저 추출해주세요" : "리스크 검토 시작 →"}
      </button>

      <p className="text-[12px] text-[#9CA3AF] text-center mt-4">
        검토 결과는 약 3–5초 내에 제공됩니다. 최종 판단은 사람이 확인하세요.
      </p>
    </div>
  );
}
