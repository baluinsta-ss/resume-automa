import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { ResumeUpload } from "@/components/ResumeUpload";
import { ResumeData } from "@/types";
import { setMasterResume, setUserId } from "@/utils/storage";
import { saveResume } from "@/services/mongodb";

export const UploadResume: React.FC = () => {
  const navigate = useNavigate();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadSuccess = async (uploadedResume: ResumeData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate a unique user ID if not exists
      const userId = `user_${Date.now()}`;
      await setUserId(userId);

      // Save to local storage
      await setMasterResume(uploadedResume);

      // Save resume data
      try {
        await saveResume(uploadedResume);
      } catch (e) {
        console.warn("Could not save resume:", e);
        // Continue anyway, data is in local storage
      }

      setResume(uploadedResume);
    } catch (err) {
      setError("Failed to save resume. Please try again.");
      console.error("Error saving resume:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (resume) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <div className="text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
              Resume Successfully Uploaded!
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              Your master resume has been saved and is ready to be tailored for
              job applications.
            </p>

            <div className="bg-card border border-border rounded-lg p-6 mb-8 text-left space-y-6 max-h-[600px] overflow-y-auto">
              {/* Contact Info */}
              <div>
                <h3 className="font-semibold text-base mb-2">
                  {resume.contact.name}
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  {resume.contact.email && <p>📧 {resume.contact.email}</p>}
                  {resume.contact.phone && <p>📞 {resume.contact.phone}</p>}
                  {resume.contact.location && (
                    <p>📍 {resume.contact.location}</p>
                  )}
                </div>
              </div>

              {/* Summary */}
              {resume.summary && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">
                    Professional Summary
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {resume.summary}
                  </p>
                </div>
              )}

              {/* Skills */}
              {resume.skills.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Skills ({resume.skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map((skill, i) => (
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
              {resume.experience.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Experience ({resume.experience.length})
                  </h4>
                  <div className="space-y-2">
                    {resume.experience.map((exp, i) => (
                      <div
                        key={i}
                        className="text-sm border-l-2 border-primary pl-3"
                      >
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
              {resume.education.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Education ({resume.education.length})
                  </h4>
                  <div className="space-y-2">
                    {resume.education.map((edu, i) => (
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
              {resume.certifications && resume.certifications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Certifications ({resume.certifications.length})
                  </h4>
                  <ul className="space-y-1">
                    {resume.certifications.map((cert, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        ✓ {cert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Achievements */}
              {resume.achievements && resume.achievements.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Achievements ({resume.achievements.length})
                  </h4>
                  <ul className="space-y-1">
                    {resume.achievements.map((achievement, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        🏆 {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Publications */}
              {resume.publications && resume.publications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Publications ({resume.publications.length})
                  </h4>
                  <ul className="space-y-1">
                    {resume.publications.map((publication, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        📄 {publication}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hobbies */}
              {resume.hobbies && resume.hobbies.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Hobbies & Interests
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {resume.hobbies.map((hobby, i) => (
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

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 rounded-lg bg-background border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  setResume(null);
                }}
                className="px-6 py-3 rounded-lg bg-gradient-primary text-primary-foreground font-semibold hover:shadow-glow transition-all"
              >
                Upload Another Resume
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
            Upload Your Master Resume
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload your professional resume as a DOCX file. We'll parse it and
            use it to tailor resumes for job applications.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 mb-8">
          <ResumeUpload
            onUploadSuccess={handleUploadSuccess}
            isLoading={isLoading}
          />

          {error && (
            <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-semibold mb-3">Resume Requirements</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ DOCX format (.docx file)</li>
              <li>✓ Contact information</li>
              <li>✓ Professional summary or objective</li>
              <li>✓ Skills section</li>
              <li>✓ Work experience</li>
              <li>✓ Education</li>
            </ul>
          </div>

          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-semibold mb-3">Tips for Best Results</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Use clear section headers</li>
              <li>• Include quantifiable achievements</li>
              <li>• List relevant technical skills</li>
              <li>• Keep formatting simple</li>
              <li>• Proofread for typos</li>
              <li>• Update with recent experience</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
