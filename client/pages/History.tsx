import React, { useState, useEffect } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ApplicationList } from "@/components/ApplicationList";
import { ApplicationRecord } from "@/types";
import {
  getApplicationHistory,
  updateApplicationStatus,
} from "@/services/mongodb";
import { getUserId } from "@/utils/storage";

export const History: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    ApplicationRecord[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "all" | ApplicationRecord["status"]
  >("all");

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const apps = await getApplicationHistory();
        setApplications(apps);
        filterApplications(apps, "all");
      } finally {
        setIsLoading(false);
      }
    };

    loadApplications();
  }, []);

  const filterApplications = (
    apps: ApplicationRecord[],
    status: typeof statusFilter,
  ) => {
    if (status === "all") {
      setFilteredApplications(apps);
    } else {
      setFilteredApplications(apps.filter((app) => app.status === status));
    }
  };

  const handleStatusChange = async (
    appId: string,
    newStatus: ApplicationRecord["status"],
  ) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      const updated = applications.map((app) =>
        (app.id === appId || app._id === appId) ? { ...app, status: newStatus } : app,
      );
      setApplications(updated);
      filterApplications(updated, statusFilter);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleFilterChange = (status: typeof statusFilter) => {
    setStatusFilter(status);
    filterApplications(applications, status);
  };

  const handleExportCSV = () => {
    const headers = [
      "Job Title",
      "Company",
      "Status",
      "Match Score",
      "Applied Date",
    ];
    const rows = applications.map((app) => [
      app.jobTitle,
      app.company,
      app.status,
      `${app.atsScore || app.matchPercentage || 0}%`,
      new Date(app.appliedDate).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-5xl mx-auto px-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-2">
            Application History
          </h1>
          <p className="text-muted-foreground">
            Track all your tailored resumes and application outcomes
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {(
                ["all", "applied", "interview", "offer", "rejected"] as const
              ).map((status) => (
                <button
                  key={status}
                  onClick={() => handleFilterChange(status)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    statusFilter === status
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {status === "all"
                    ? "All"
                    : status.charAt(0).toUpperCase() + status.slice(1)}{" "}
                  (
                  {status === "all"
                    ? applications.length
                    : applications.filter((a) => a.status === status).length}
                  )
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              disabled={applications.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>

          <ApplicationList
            applications={filteredApplications}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        </div>

        {applications.length > 0 && (
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {applications.length}
              </div>
              <p className="text-sm text-muted-foreground">
                Total Applications
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {applications.filter((a) => a.status === "offer").length}
              </div>
              <p className="text-sm text-muted-foreground">Offers</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {applications.filter((a) => a.status === "interview").length}
              </div>
              <p className="text-sm text-muted-foreground">Interviews</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {applications.length > 0
                  ? Math.round(
                      applications.reduce(
                        (sum, a) =>
                          sum + (a.atsScore || a.matchPercentage || 0),
                        0,
                      ) / applications.length,
                    )
                  : 0}
                %
              </div>
              <p className="text-sm text-muted-foreground">Avg Match Score</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
