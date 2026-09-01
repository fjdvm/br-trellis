"use client";

import { useState, useEffect } from "react";
import { careersApi } from "@/lib/api/careers-api";
import type { JobPosting } from "@/types/careers";
import { JobPostingCard } from "./JobPostingCard";
import { JobApplicationDialog } from "./JobApplicationDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CareersList() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchJobs = () => {
    setLoading(true);
    setError(null);
    careersApi.getJobs()
      .then((data) => {
        setJobs(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to load open positions.";
        setError(message);
        setLoading(false);
      });
  };

  useEffect(() => {
    careersApi.getJobs()
      .then((data) => {
        setJobs(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to load open positions.";
        setError(message);
        setLoading(false);
      });
  }, []);

  const departments = ["All", ...Array.from(new Set(jobs.map((job) => job.Department || job.department)))];

  const filteredJobs = selectedDept === "All"
    ? jobs
    : jobs.filter((job) => (job.Department || job.department) === selectedDept);

  const handleApplyClick = (job: JobPosting) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Department Tabs */}
      {!loading && !error && jobs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-surface-container-low border border-outline-variant/30 w-fit">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                selectedDept === dept
                  ? "bg-primary text-white shadow-xs"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      )}

      {/* Main List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="border border-outline-variant/30 p-6 space-y-4 bg-surface-container-lowest">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 bg-surface-container" />
                <Skeleton className="h-6 w-3/4 bg-surface-container" />
              </div>
              <Skeleton className="h-12 w-full bg-surface-container" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-4 w-24 bg-surface-container" />
                <Skeleton className="h-8 w-28 bg-surface-container" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-outline-variant/30 bg-surface-container-lowest">
          <div className="w-12 h-12 bg-error-container/40 text-error flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <p className="font-sans text-sm font-semibold text-on-surface">
            {error}
          </p>
          <Button onClick={fetchJobs} variant="outline" className="mt-4 rounded-full text-xs font-semibold border-outline-variant/40 hover:bg-surface-container">
            Try Again
          </Button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-outline-variant/30 bg-surface-container-lowest">
          <Building2 className="w-12 h-12 text-outline mb-4" />
          <p className="font-serif font-bold text-lg text-on-surface">
            No open positions found.
          </p>
          <p className="font-sans text-xs text-on-surface-variant mt-1">
            Check back later or follow us for updates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <JobPostingCard
              key={job.id || job.Id}
              job={job}
              onApply={handleApplyClick}
            />
          ))}
        </div>
      )}

      <JobApplicationDialog
        job={selectedJob}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
}
