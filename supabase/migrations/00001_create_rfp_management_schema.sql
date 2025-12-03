/*
# Create RFP Management System Schema

## Overview
This migration creates the complete database schema for the AI-Powered RFP Management System,
including tables for RFPs, suppliers, proposals, and their relationships.

## 1. New Tables

### `rfps` Table
Stores Request for Proposal documents with structured information.
- `id` (uuid, primary key) - Unique identifier
- `title` (text, not null) - RFP title
- `description` (text) - Detailed description
- `raw_input` (text) - Original natural language input
- `budget` (numeric) - Total budget amount
- `delivery_timeline` (text) - Delivery requirements
- `requirements` (jsonb) - Structured requirements data
- `status` (text, default 'draft') - RFP status (draft, sent, closed)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### `suppliers` Table
Maintains supplier master data and contact information.
- `id` (uuid, primary key) - Unique identifier
- `name` (text, not null) - Supplier company name
- `email` (text, not null, unique) - Primary email contact
- `contact_person` (text) - Contact person name
- `phone` (text) - Phone number
- `notes` (text) - Additional notes
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### `proposals` Table
Stores supplier proposals with AI-generated analysis.
- `id` (uuid, primary key) - Unique identifier
- `rfp_id` (uuid, foreign key) - References rfps table
- `supplier_id` (uuid, foreign key) - References suppliers table
- `content` (text) - Proposal content
- `raw_email` (text) - Original email content
- `pricing` (jsonb) - Structured pricing information
- `terms` (text) - Terms and conditions
- `status` (text, default 'received') - Proposal status
- `ai_score` (numeric) - AI-generated score (0-100)
- `ai_summary` (text) - AI-generated summary
- `ai_evaluation` (jsonb) - Detailed AI evaluation
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### `rfp_suppliers` Junction Table
Tracks which suppliers were invited for each RFP and email status.
- `id` (uuid, primary key) - Unique identifier
- `rfp_id` (uuid, foreign key) - References rfps table
- `supplier_id` (uuid, foreign key) - References suppliers table
- `sent_at` (timestamptz) - When RFP was sent
- `email_status` (text, default 'pending') - Email delivery status
- `created_at` (timestamptz, default now())

## 2. Security
- No RLS enabled (single-user system per requirements)
- All tables are publicly accessible for read/write operations

## 3. Indexes
- Foreign key indexes for performance
- Email lookup index on suppliers table

## 4. Notes
- Using JSONB for flexible structured data (requirements, pricing, AI evaluation)
- Timestamps for audit trail
- Status fields for workflow management
*/

-- Create RFPs table
CREATE TABLE IF NOT EXISTS rfps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  raw_input text,
  budget numeric,
  delivery_timeline text,
  requirements jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  contact_person text,
  phone text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id uuid NOT NULL REFERENCES rfps(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  content text,
  raw_email text,
  pricing jsonb,
  terms text,
  status text DEFAULT 'received' CHECK (status IN ('received', 'reviewed', 'accepted', 'rejected')),
  ai_score numeric CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_summary text,
  ai_evaluation jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create RFP-Suppliers junction table
CREATE TABLE IF NOT EXISTS rfp_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id uuid NOT NULL REFERENCES rfps(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  sent_at timestamptz,
  email_status text DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(rfp_id, supplier_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_proposals_rfp_id ON proposals(rfp_id);
CREATE INDEX IF NOT EXISTS idx_proposals_supplier_id ON proposals(supplier_id);
CREATE INDEX IF NOT EXISTS idx_rfp_suppliers_rfp_id ON rfp_suppliers(rfp_id);
CREATE INDEX IF NOT EXISTS idx_rfp_suppliers_supplier_id ON rfp_suppliers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_rfps_updated_at BEFORE UPDATE ON rfps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
