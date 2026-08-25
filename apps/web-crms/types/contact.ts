export interface ContactSourceReference {
  sourceSystem: string;
  sourceId: string;
}

export interface ContactListItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  sourceReferences: ContactSourceReference[];
}

export interface ContactCompany {
  id: string;
  name: string;
}

export interface ContactCustomFieldOption {
  id: string;
  label: string;
}

export interface ContactCustomFieldValue {
  definitionId: string;
  name: string;
  fieldType: string;
  textValue: string | null;
  numberValue: number | null;
  dateValue: string | null;
  boolValue: boolean | null;
  selectedOption: ContactCustomFieldOption | null;
}

export interface ContactTimelineEntry {
  id: string;
  sourceModule: string;
  entryType: string;
  summary: string;
  occurredAt: string;
}

export interface ContactDetail {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  sentimentScore: number | null;
  company: ContactCompany | null;
  sourceReferences: ContactSourceReference[];
  customFields: ContactCustomFieldValue[];
  timelineEntries: ContactTimelineEntry[];
}

export interface PendingReviewContactDetails {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface PendingReviewContactCandidate {
  contact: PendingReviewContactDetails;
  confidenceScore: number;
}

export interface PendingReviewContact {
  contact: PendingReviewContactDetails;
  candidates: PendingReviewContactCandidate[];
}
