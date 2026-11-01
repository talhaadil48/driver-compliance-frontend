export interface StaffUser {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "staff" | "viewer";
  is_active: boolean;
  created_at?: string;
}

export interface DocumentType {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  requires_expiry: boolean;
  requires_issue_date: boolean;
  is_mandatory: boolean;
  is_custom: boolean;
  created_at?: string;
}

export interface DocumentFile {
  id: number;
  file_name: string;
  file_size: number;
  mime_type: string;
  page_number: number;
  uploaded_at: string;
}

export interface DocumentSlotSummary {
  document_type_id: number;
  code: string;
  name: string;
  is_mandatory: boolean;
  is_uploaded: boolean;
  files: DocumentFile[];
}

export interface FieldEvaluation {
  id?: number;
  key: string;
  name: string;
  date: string | null;
  is_required: boolean;
  is_custom: boolean;
  status: "EXPIRED" | "EXPIRING_SOON" | "VALID" | "MISSING" | "NOT_APPLICABLE";
  color: "red" | "yellow" | "green" | "gray";
  label: string;
  days_remaining: number | null;
  is_urgent: boolean;
}

export interface DriverCompliance {
  overall_status: "COMPLIANT" | "EXPIRING_SOON" | "EXPIRED" | "INCOMPLETE";
  overall_color: "green" | "yellow" | "red";
  overall_badge: string;
  has_expired: boolean;
  has_missing_field: boolean;
  has_missing_doc: boolean;
  has_expiring_soon: boolean;
  fields_evaluation: FieldEvaluation[];
  missing_required_docs: Array<{
    document_type_id: number;
    document_name: string;
    code: string;
  }>;
  documents_summary: DocumentSlotSummary[];
}

export interface Driver {
  id: number;
  full_name: string;
  type?: string;
  callsign?: string | null;
  dob?: string | null;
  national_insurance_number?: string | null;
  dbs_certificate_number?: string | null;
  dbs_update_service_reference?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active: boolean;
  
  // Expiry Dates
  dbs_update_service_expiry?: string | null;
  safeguarding_expiry?: string | null;
  first_aid_expiry?: string | null;
  autism_awareness_expiry?: string | null;
  autism_awareness_expiry_enabled: boolean;

  created_at?: string;
  updated_at?: string;
  
  documents?: any[];
  compliance?: DriverCompliance;
}

export interface DriverListItem {
  id: number;
  full_name: string;
  type?: string;
  callsign?: string | null;
  phone?: string | null;
  dob?: string | null;
  national_insurance_number?: string | null;
  is_active: boolean;
  created_at?: string;
  overall_status: "COMPLIANT" | "EXPIRING_SOON" | "EXPIRED" | "INCOMPLETE";
  overall_color: "green" | "yellow" | "red";
  overall_badge: string;
  has_expired: boolean;
  has_missing_field: boolean;
  has_missing_doc: boolean;
  has_expiring_soon: boolean;
  documents_count: number;
}

export interface DashboardStats {
  total_drivers: number;
  compliant_drivers: number;
  expiring_soon_drivers: number;
  expired_drivers: number;
  incomplete_drivers: number;
  total_documents_uploaded: number;
  missing_documents_count: number;
}

export interface ExpiryAlertItem {
  driver_id: number;
  driver_name: string;
  driver_type?: string;
  driver_callsign?: string | null;
  field_key: string;
  field_name: string;
  date: string | null;
  days_remaining: number | null;
  status: "EXPIRED" | "EXPIRING_SOON" | "MISSING" | "VALID" | "NOT_APPLICABLE";
  color: "red" | "yellow" | "green" | "gray";
  label: string;
  is_required: boolean;
}

export interface MissingDocumentItem {
  driver_id: number;
  driver_name: string;
  driver_type?: string;
  driver_callsign?: string | null;
  document_type_id: number;
  document_name: string;
  code: string;
}

export interface DashboardOverview {
  stats: DashboardStats;
  expiries: ExpiryAlertItem[];
  missing_documents: MissingDocumentItem[];
}

export interface DriverAuditLog {
  id: number;
  driver_id: number;
  staff_id?: number | null;
  staff_name: string;
  action_type: "FIELD_UPDATE" | "DOCUMENT_UPLOAD" | "DOCUMENT_REPLACE" | "DOCUMENT_DELETE" | "DRIVER_CREATED";
  field_name: string;
  old_value?: string | null;
  new_value?: string | null;
  notes?: string | null;
  created_at: string;
}
