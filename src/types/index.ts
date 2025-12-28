export type BusinessType = 'Hotel' | 'Hostel' | 'Resort' | 'Tour Operator' | 'Travel Agency';
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Converted';
export type PhoneType = 'MOBILE' | 'FIXED_LINE' | 'UNKNOWN';
export type DataTier = 'Essentials' | 'Pro';
export type SyncStatus = 'In Progress' | 'Success' | 'Failed';

export interface Prospect {
  id: string;
  place_id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  business_type: BusinessType;
  phone?: string;
  phone_type?: PhoneType;
  website?: string;
  rating?: number;
  reviews_count: number;
  status: LeadStatus;
  tier: DataTier;
  synced_to_airtable: boolean;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  batch_number: number;
  records_count: number;
  status: SyncStatus;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface ApiUsage {
  id: string;
  api_name: 'google_maps' | 'airtable';
  operation_type: string;
  quota_used: number;
  date: string;
  created_at: string;
}

export interface PlacesSearchResult {
  place_id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  business_type: BusinessType;
  tier: DataTier;
  phone?: string;
  website?: string;
  rating?: number;
  reviews_count?: number;
}

export interface ApiQuota {
  api_name: string;
  daily_limit: number;
  used: number;
  remaining: number;
  percentage: number;
}

export interface AnalyticsData {
  qualificationRate: {
    mobile: number;
    fixedLine: number;
    unknown: number;
  };
  geographicDensity: Array<{
    region: string;
    count: number;
  }>;
  leadsByType: Array<{
    type: string;
    count: number;
  }>;
}
