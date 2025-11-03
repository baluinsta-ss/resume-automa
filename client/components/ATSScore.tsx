import React from "react";
import { CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { ATSScore } from "@/types";

interface ATSScoreProps {
  score: ATSScore;
  isLoading?: boolean;
}

export const ATSScoreDisplay: React.FC<ATSScoreProps> = ({
  score,
  isLoading = false,
}) => {
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-orange-600";
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-100 dark:bg-green-900/20";
    if (percentage >= 60) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-orange-100 dark:bg-orange-900/20";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Circle */}
      <div className="flex items-center justify-center">
        <div className="relative h-40 w-40">
          <svg className="h-full w-full transform -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${(score.matchPercentage / 100) * 440} 440`}
              className={`transition-all duration-500 ${getScoreColor(
                score.matchPercentage
              )}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-4xl font-bold ${getScoreColor(score.matchPercentage)}`}>
              {score.matchPercentage}%
            </div>
            <div className="text-sm text-muted-foreground">ATS Match</div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3">
        <div className={`rounded-lg p-4 ${getScoreBgColor(score.matchPercentage)}`}>
          <p className="text-sm font-medium text-foreground mb-2">ATS Score: {score.score}/100</p>
          <div className="w-full bg-black/10 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${
                score.score >= 80
                  ? "bg-green-600"
                  : score.score >= 60
                  ? "bg-yellow-600"
                  : "bg-orange-600"
              }`}
              style={{ width: `${score.score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Matched Keywords */}
      {score.keywordMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-sm">Matched Keywords</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {score.keywordMatches.slice(0, 8).map((keyword) => (
              <span
                key={keyword}
                className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium"
              >
                {keyword}
              </span>
            ))}
            {score.keywordMatches.length > 8 && (
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                +{score.keywordMatches.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Missing Keywords */}
      {score.missingKeywords.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-sm">Missing Keywords</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {score.missingKeywords.slice(0, 8).map((keyword) => (
              <span
                key={keyword}
                className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium"
              >
                {keyword}
              </span>
            ))}
            {score.missingKeywords.length > 8 && (
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                +{score.missingKeywords.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Improvements */}
      {score.improvements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">Recommended Improvements</h3>
          </div>
          <ul className="space-y-2">
            {score.improvements.slice(0, 5).map((improvement, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-primary font-bold">•</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
