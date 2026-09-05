import { request } from "@/lib/api/request";

export const uploadApi = {
  uploadFile: async (file: File, folder = "general"): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ url: string }>(`/api/v1/upload?folder=${encodeURIComponent(folder)}`, {
      method: "POST",
      body: formData,
    });
  },
};
