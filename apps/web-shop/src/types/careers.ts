export interface JobPosting {
  id: string;
  Id?: string;
  title: string;
  Title?: string;
  description: string;
  Description?: string;
  requirements: string;
  Requirements?: string;
  location: string;
  Location?: string;
  department: string;
  Department?: string;
  type: string;
  Type?: string;
  isActive: boolean;
  IsActive?: boolean;
  createdAt: string;
  CreatedAt?: string;
  updatedAt: string;
  UpdatedAt?: string;
}

export interface JobApplicationResponse {
  id: string;
  jobPostingId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  coverLetter: string;
  resumeUrl: string;
  submittedAt: string;
}
