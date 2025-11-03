import React, { useState } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { parseDocxFile, validateResume } from "@/services/resumeParser";
import { ResumeData } from "@/types";

interface ResumeUploadProps {
  onUploadSuccess: (resume: ResumeData) => void;
  isLoading?: boolean;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  onUploadSuccess,
  isLoading = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".docx")) {
      setError("Please upload a .docx file");
      return;
    }

    try {
      setError(null);
      const resume = await parseDocxFile(file);
      const validation = validateResume(resume);

      if (!validation.isValid) {
        setError(`Resume issues: ${validation.errors.join(", ")}`);
        return;
      }

      onUploadSuccess(resume);
    } catch (err) {
      setError("Failed to parse resume. Please try another file.");
      console.error("Resume parsing error:", err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        onChange={handleChange}
        className="hidden"
        disabled={isLoading}
      />

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative w-full rounded-lg border-2 border-dashed p-8
          transition-all duration-200 cursor-pointer
          ${
            dragActive
              ? "border-primary bg-primary/5 scale-105"
              : "border-muted hover:border-primary/50"
          }
          ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg">
              {isLoading ? "Parsing Resume..." : "Upload Your Master Resume"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Drag and drop your resume or click to browse (DOCX format)
            </p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Processing...</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 flex gap-3 rounded-lg bg-destructive/10 p-3 border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">{error}</p>
            <p className="text-xs text-destructive/80 mt-1">
              Please ensure your resume contains contact info, skills, experience, and education.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
