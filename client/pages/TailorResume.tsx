import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { ResumeData, JobDescription } from "@/types";
import { getMasterResume } from "@/utils/storage";
import {
  tailorResumeForJob,
  calculateATSScore,
  extractJobRequirements,
} from "@/services/gemini";
import { generateResumeDocx } from "@/services/resumeGenerator";
import { saveApplication } from "@/services/mongodb";

export const TailorResume: React.FC = () => {
  const navigate = useNavigate();
  const [masterResume, setMasterResume] = useState<ResumeData | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [showResume, setShowResume] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [tailorState, setTailorState] = useState<{
    tailored: ResumeData | null;
    atsScore: number;
    jobData: JobDescription | null;
  }>({
    tailored: null,
    atsScore: 0,
    jobData: null,
  });

  useEffect(() => {
    const loadResume = async () => {
      setIsLoading(true);
      try {
        const resume = await getMasterResume();
        if (!resume) {
          setError("No master resume found. Please upload one first.");
          setTimeout(() => navigate("/upload"), 2000);
          return;
        }
        setMasterResume(resume);
      } catch (err) {
        setError("Failed to load master resume.");
      } finally {
        setIsLoading(false);
      }
    };

    loadResume();
  }, [navigate]);

  const handleTailor = async () => {
    if (!masterResume || !jobDescription.trim()) {
      setError("Please enter a job description");
      return;
    }

    setIsTailoring(true);
    setError(null);
    setSuccess(null);

    try {
      // Extract job requirements from JD
      const extracted = await extractJobRequirements(jobDescription);

      // Tailor the resume
      const tailored = await tailorResumeForJob(masterResume, extracted);

      // Calculate ATS score
      const atsData = await calculateATSScore(tailored, extracted);

      setTailorState({
        tailored,
        atsScore: atsData.score,
        jobData: extracted,
      });

      setSuccess(`✓ Resume tailored! ATS Score: ${atsData.score}%`);
    } catch (err) {
      setError(
        `Failed to tailor resume: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsTailoring(false);
    }
  };

  const handleDownload = async () => {
    if (!tailorState.tailored || !tailorState.jobData) return;

    try {
      const blob = await generateResumeDocx(
        tailorState.tailored,
        tailorState.jobData.company,
        tailorState.jobData.title,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `Resume_${tailorState.jobData.company}_${tailorState.jobData.title}_${today}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess("✓ Resume downloaded successfully!");
    } catch (err) {
      setError(
        `Download failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleSaveApplication = async () => {
    if (!tailorState.tailored || !tailorState.jobData || !masterResume) return;

    try {
      await saveApplication({
        userId: "current-user",
        jobTitle: tailorState.jobData.title,
        company: tailorState.jobData.company,
        jobDescription: tailorState.jobData,
        originalResume: masterResume,
        tailoredResume: tailorState.tailored,
        atsScore: tailorState.atsScore,
        matchPercentage: tailorState.atsScore,
        appliedDate: new Date(),
        status: "applied",
      });
      setSuccess(
        "✓ Application saved to history! View it in the History page.",
      );
    } catch (err) {
      setError(
        `Failed to save application: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your resume...</p>
        </div>
      </div>
    );
  }

  if (!masterResume) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-lg text-red-600 mb-4">{error}</p>
            <p className="text-muted-foreground">
              Redirecting to upload page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-2">
            Tailor Your Resume
          </h1>
          <p className="text-muted-foreground">
            View your master resume and tailor it for any job
          </p>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-600/10 border border-green-600/20">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Master Resume Preview */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your Master Resume</h2>
              <button
                onClick={() => setShowResume(!showResume)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                {showResume ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
            </div>

            {showResume && (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {/* Contact Info */}
                <div>
                  <h3 className="font-semibold text-base mb-2">
                    {masterResume.contact.name}
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {masterResume.contact.email && (
                      <p>{masterResume.contact.email}</p>
                    )}
                    {masterResume.contact.phone && (
                      <p>{masterResume.contact.phone}</p>
                    )}
                    {masterResume.contact.location && (
                      <p>{masterResume.contact.location}</p>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {masterResume.summary && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      {masterResume.summary}
                    </p>
                  </div>
                )}

                {/* Skills */}
                {masterResume.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {masterResume.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {masterResume.experience.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Experience</h4>
                    <div className="space-y-2">
                      {masterResume.experience.map((exp, i) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium">{exp.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {exp.company} • {exp.startDate}
                            {exp.endDate && ` - ${exp.endDate}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {masterResume.education.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Education</h4>
                    <div className="space-y-2">
                      {masterResume.education.map((edu, i) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium">
                            {edu.degree} in {edu.field}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {edu.institution}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {masterResume.certifications &&
                  masterResume.certifications.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Certifications
                      </h4>
                      <ul className="space-y-1">
                        {masterResume.certifications.map((cert, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            ✓ {cert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Achievements */}
                {masterResume.achievements &&
                  masterResume.achievements.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Achievements
                      </h4>
                      <ul className="space-y-1">
                        {masterResume.achievements.map((achievement, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            🏆 {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Publications */}
                {masterResume.publications &&
                  masterResume.publications.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Publications
                      </h4>
                      <ul className="space-y-1">
                        {masterResume.publications.map((publication, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            📄 {publication}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Hobbies */}
                {masterResume.hobbies && masterResume.hobbies.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">
                      Hobbies & Interests
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {masterResume.hobbies.map((hobby, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full"
                        >
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!showResume && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Resume details hidden</p>
                <button
                  onClick={() => setShowResume(true)}
                  className="text-primary hover:underline mt-2"
                >
                  Show resume
                </button>
              </div>
            )}
          </div>

          {/* Right: Job Description Input and Tailoring */}
          <div className="space-y-6">
            {/* Job Description Input */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Job Description</h2>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full h-[300px] p-3 border border-border rounded-lg bg-background text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <button
                onClick={handleTailor}
                disabled={isTailoring || !jobDescription.trim()}
                className="w-full mt-4 px-6 py-3 rounded-lg bg-gradient-primary text-primary-foreground font-semibold hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isTailoring ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Tailoring...
                  </>
                ) : (
                  <>⚡ Tailor Resume</>
                )}
              </button>
            </div>

            {/* Results */}
            {tailorState.tailored && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Results</h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ATS Score</p>
                    <p className="text-3xl font-bold text-primary">
                      {tailorState.atsScore}%
                    </p>
                  </div>

                  {tailorState.jobData && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Job Details
                      </p>
                      <p className="font-semibold">
                        {tailorState.jobData.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tailorState.jobData.company}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
                    >
                      ⬇️ Download
                    </button>
                    <button
                      onClick={handleSaveApplication}
                      className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:shadow-glow transition-all font-medium"
                    >
                      💾 Save to History
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setTailorState({
                        tailored: null,
                        atsScore: 0,
                        jobData: null,
                      });
                      setJobDescription("");
                      setSuccess(null);
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
                  >
                    ⚡ Tailor Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
