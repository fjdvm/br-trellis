"use client";

import type { JobPosting } from "@/types/careers";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, ChevronRight } from "lucide-react";

interface JobPostingCardProps {
  job: JobPosting;
  onApply: (job: JobPosting) => void;
}

export function JobPostingCard({ job, onApply }: JobPostingCardProps) {
  return (
    <Card className="group relative border border-slate-100 bg-white/80 backdrop-blur-md rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-1 hover:border-violet-200">
      <CardHeader className="p-0 mb-4 flex flex-row items-start justify-between gap-4">
        <div>
          <Badge className="mb-2 bg-violet-50 text-violet-700 border-none hover:bg-violet-100 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
            {job.Department || job.department}
          </Badge>
          <h3 className="text-lg font-extrabold text-slate-800 tracking-tight group-hover:text-violet-600 transition-colors duration-300">
            {job.Title || job.title}
          </h3>
        </div>
      </CardHeader>

      <CardContent className="p-0 mb-6 space-y-3.5">
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {job.Description || job.description}
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-slate-400 text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{job.Location || job.location}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span>{job.Type || job.type}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-0 border-t border-slate-50 pt-4 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-semibold">
          Posted {new Date(job.CreatedAt || job.createdAt).toLocaleDateString()}
        </span>
        <Button
          onClick={() => onApply(job)}
          className="rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-violet-600 transition-colors duration-300 px-4 py-1.5 shadow-sm flex items-center gap-1"
        >
          View Details <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
