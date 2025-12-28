/*
  # Hotel Prospecting Dashboard Database Schema

  This migration creates the complete database structure for a hotel prospecting application.

  ## New Tables

  ### 1. `prospects`
  Stores hotel leads extracted from search operations
  - `id` (uuid, primary key) - Unique identifier
  - `place_id` (text, unique) - Google Maps Place ID for deduplication
  - `name` (text) - Hotel/business name
  - `address` (text) - Full address
  - `city` (text) - City location
  - `region` (text) - State/region for geographic analysis
  - `business_type` (text) - Hotel, Hostel, Tour Operator, etc.
  - `phone` (text) - Phone number
  - `phone_type` (text) - MOBILE or FIXED_LINE classification
  - `website` (text) - Business website URL
  - `rating` (numeric) - Google rating (1-5)
  - `reviews_count` (integer) - Number of reviews
  - `status` (text) - Lead status: New, Contacted, Qualified, Unqualified, Converted
  - `tier` (text) - Data tier: Essentials or Pro
  - `synced_to_airtable` (boolean) - Sync status
  - `last_synced_at` (timestamptz) - Last sync timestamp
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last update time

  ### 2. `sync_logs`
  Tracks Airtable synchronization operations
  - `id` (uuid, primary key) - Unique identifier
  - `batch_number` (integer) - Batch identifier
  - `records_count` (integer) - Number of records in batch
  - `status` (text) - Success, Failed, In Progress
  - `error_message` (text) - Error details if failed
  - `started_at` (timestamptz) - Sync start time
  - `completed_at` (timestamptz) - Sync completion time
  - `created_at` (timestamptz) - Record creation time

  ### 3. `api_usage`
  Tracks API quota usage for Google Maps and Airtable
  - `id` (uuid, primary key) - Unique identifier
  - `api_name` (text) - API identifier: google_maps or airtable
  - `operation_type` (text) - Operation: search, details, sync
  - `quota_used` (integer) - Quota consumed
  - `date` (date) - Usage date for daily tracking
  - `created_at` (timestamptz) - Record creation time

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated access
*/

-- Create prospects table
CREATE TABLE IF NOT EXISTS prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text UNIQUE NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  region text NOT NULL,
  business_type text NOT NULL DEFAULT 'Hotel',
  phone text,
  phone_type text,
  website text,
  rating numeric(2,1),
  reviews_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'New',
  tier text NOT NULL DEFAULT 'Essentials',
  synced_to_airtable boolean DEFAULT false,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number integer NOT NULL,
  records_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'In Progress',
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create api_usage table
CREATE TABLE IF NOT EXISTS api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name text NOT NULL,
  operation_type text NOT NULL,
  quota_used integer NOT NULL DEFAULT 1,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prospects_city ON prospects(city);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_business_type ON prospects(business_type);
CREATE INDEX IF NOT EXISTS idx_prospects_phone_type ON prospects(phone_type);
CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage(date, api_name);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);

-- Enable Row Level Security
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (modify based on auth requirements)
CREATE POLICY "Allow public read access to prospects"
  ON prospects FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to prospects"
  ON prospects FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to prospects"
  ON prospects FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to sync_logs"
  ON sync_logs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to sync_logs"
  ON sync_logs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read access to api_usage"
  ON api_usage FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to api_usage"
  ON api_usage FOR INSERT
  TO anon
  WITH CHECK (true);