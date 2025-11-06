import React, { useState } from "react";
import {
  Download,
  ExternalLink,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { ApplicationRecord } from "@/types";
import { format } from "date-fns";

interface ApplicationListProps {
  applications: ApplicationRecord[];
  onStatusChange?: (appId: string, status: ApplicationRecord["status"]) => void;
  isLoading?: boolean;
}

export const ApplicationList: React.FC<ApplicationListProps> = ({
  applications,
  onStatusChange,
  isLoading = false,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getStatusIcon = (status: ApplicationRecord["status"]) => {
    switch (status) {
      case "interview":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "offer":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ApplicationRecord["status"]) => {
    switch (status) {
      case "interview":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400";
      case "offer":
        return "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400";
      case "rejected":
        return "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📋</div>
        <h3 className="font-semibold text-lg mb-1">No applications yet</h3>
        <p className="text-sm text-muted-foreground">
          Upload your resume and find job postings to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <div
          key={app.id || app._id}
          className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div>
                  <h3 className="font-semibold text-base">{app.jobTitle}</h3>
                  <p className="text-sm text-muted-foreground">{app.company}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(app.status)}`}
                >
                  {getStatusIcon(app.status)}
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </div>

                <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {app.atsScore || app.matchPercentage}% Match
                </div>

                <span className="text-xs text-muted-foreground">
                  {format(new Date(app.appliedDate), "MMM d, yyyy")}
                </span>
              </div>

              {app.jobUrl && (
                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 w-fit"
                >
                  View job posting <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="flex gap-2 ml-4">
              <button
                onClick={() =>
                  setExpandedId(expandedId === (app.id || app._id) ? null : (app.id || app._id))
                }
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          {expandedId === (app.id || app._id) && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              {onStatusChange && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Change Status
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {(
                      ["applied", "interview", "offer", "rejected"] as const
                    ).map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          onStatusChange(app.id || app._id || "", status);
                          setExpandedId(null);
                        }}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          app.status === status
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm text-foreground line-clamp-3">
                  {app.jobDescription?.description ||
                    "No description available"}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
