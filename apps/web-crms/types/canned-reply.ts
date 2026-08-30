export interface CannedReplyCategoryListItem {
  id: string;
  name: string;
  replyCount: number;
  createdAt: string;
  deletedAt: string | null;
}

export interface CannedReplyCategoryDetail {
  id: string;
  name: string;
  createdAt: string;
  deletedAt: string | null;
  replyCount: number;
}

export interface CreateCannedReplyCategoryInput {
  name: string;
}

export interface UpdateCannedReplyCategoryInput {
  name?: string;
}

export interface CannedReplyListItem {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  body: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface CannedReplyDetail {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  body: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface CreateCannedReplyInput {
  categoryId: string;
  name: string;
  body: string;
}

export interface UpdateCannedReplyInput {
  categoryId?: string;
  name?: string;
  body?: string;
}
