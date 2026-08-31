import { apiClient } from "./api-client";
import type { JobPosting, JobApplicationResponse } from "@/types/careers";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";

export const careersApi = {
  getJobs: () => apiClient.get<JobPosting[]>("/jobs"),
  getJob: (id: string) => apiClient.get<JobPosting>(`/jobs/${id}`),
  submitApplication: async (formData: FormData): Promise<JobApplicationResponse> => {
    const url = `${BASE_URL}/applications`;
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }
      throw new Error(errorData?.detail || errorData?.title || "Application submission failed.");
    }

    return response.json();
  }
};
