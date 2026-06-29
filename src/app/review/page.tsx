"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileImage, X } from "lucide-react";
import { postReview, uploadImage } from "@/lib/api";

type InputTab = "text" | "ocr";

export default function ReviewPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputTab, setInputTab] = useState<InputTab>("text");
  const [text, setText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (file: File) => {
    // BE /upload-image 는 image/* 만 허용한다(PDF 미지원).
    if (file.type.startsWith("image/")) {
      setUploadedFile(file);
      setError(null);
    } else {
      setError("이미지 파일(PNG, JPG)만 업로드할 수 있습니다.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const canSubmit = inputTab === "text" ? text.trim().length > 0 : uploadedFile !== null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setIsLoading(true);
    try {
      let reviewText = text;
      // OCR 탭: 이미지를 업로드해 CLOVA OCR 로 텍스트를 추출한 뒤 그 텍스트로 검토한다.
      if (inputTab === "ocr" && uploadedFile) {
        const uploaded = await uploadImage(uploadedFile);
        const extracted = (uploaded.ocr_text ?? "").trim();
        if (!extracted) {
          setError("이미지에서 텍스트를 추출하지 못했습니다. 다른 이미지를 시도해 주세요.");
          setIsLoading(false);
          return;
        }
        reviewText = extracted;
      }
      const result = await postReview(reviewText);
      router.push(`/review/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "검토 요청에 실패했습니다.");
      setIsLoading(false);
    }
  };

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
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center gap-3">
              <FileImage size={20} className="text-[#2F6BFF]" />
              <div className="flex-1">
                <p className="text-[13px] font-medium text-[#111]">{uploadedFile.name}</p>
                <p className="text-[11px] text-[#9CA3AF]">
                  {(uploadedFile.size / 1024).toFixed(0)} KB · OCR 추출 후 검토
                </p>
              </div>
              <button
                onClick={() => setUploadedFile(null)}
                className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
              >
                <X size={16} />
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
              <p className="text-[11px] text-[#9CA3AF] mt-2">업로드하면 CLOVA OCR로 텍스트를 추출해 검토합니다</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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
        disabled={!canSubmit || isLoading}
        className="w-full bg-[#2F6BFF] text-white py-3.5 rounded-lg text-[15px] font-semibold
          hover:bg-[#1a56e8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {inputTab === "ocr" ? "OCR 추출 후 분석 중..." : "분석 중..."}
          </>
        ) : (
          "리스크 검토 시작 →"
        )}
      </button>

      <p className="text-[12px] text-[#9CA3AF] text-center mt-4">
        검토 결과는 약 3–5초 내에 제공됩니다. 최종 판단은 사람이 확인하세요.
      </p>
    </div>
  );
}
