export interface CompanyListItem {
  id: string;
  name: string;
  buyerType: string;
  memberCount: number;
  createdAt: string;
}

export interface CompanyContact {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  lifetimeValue: number;
}

export interface CompanyDetail {
  id: string;
  name: string;
  buyerType: string;
  primaryContactId: string | null;
  primaryContact: CompanyContact | null;
  createdAt: string;
  deletedAt: string | null;
  contacts: CompanyContact[];
}

export interface CreateCompanyInput {
  name: string;
  buyerType: string;
  primaryContactId?: string | null;
}

export interface UpdateCompanyInput {
  name?: string;
  buyerType?: string;
  primaryContactId?: string | null;
}
