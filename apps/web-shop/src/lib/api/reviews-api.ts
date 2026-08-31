import { apiClient } from "@/lib/api/api-client";

export interface ReviewResponse {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  comment: string;
}

export const reviewsApi = {
  async getByProduct(productId: string): Promise<ReviewResponse[]> {
    return await apiClient.get<ReviewResponse[]>(`/reviews?productId=${productId}`);
  },

  async createReview(data: CreateReviewRequest, token: string): Promise<ReviewResponse> {
    return await apiClient.post<ReviewResponse>("/reviews", data, { token });
  },
};
