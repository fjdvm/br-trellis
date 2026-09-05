export interface SegmentCondition {
  field: string;
  operator: string;
  value: string;
}

export interface SegmentRule {
  matchMode: string;
  conditions: SegmentCondition[];
}

export interface SegmentListItem {
  id: string;
  name: string;
  type: string;
  isSystemDefined: boolean;
  rule: SegmentRule | null;
  memberCount: number;
}

export interface SegmentMember {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  lifetimeValue: number;
}
