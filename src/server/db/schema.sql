-- ==============================================================================
-- PostgreSQL Schema for MPI Container Compliance Agent
-- The Warehouse Group (TWG) - Transitional Facility 297 (NIDC Wiri, Auckland)
--
-- This schema models all container arrivals, BACC history, clearances,
-- WMS checkouts, and automated compliance agent run audits.
-- ==============================================================================

-- 1. Create Enums
CREATE TYPE mpi_flag_type AS ENUM (
  'DO_NOT_OPEN',
  'SITE',
  'INCOMPLETE',
  'AP_CHECK',
  'CLEARED'
);

CREATE TYPE bacc_type AS ENUM (
  'INSPECTION',
  'AP CHECK',
  'RELEASE',
  'TREATMENT'
);

CREATE TYPE run_trigger_type AS ENUM (
  'Mailbox poll',
  'WMS check-out',
  'Gatehouse arrival'
);

CREATE TYPE event_kind_type AS ENUM (
  'CHECK_OUT',
  'SUPERSEDED',
  'GATE_IN'
);

-- 2. Transitional Facility Sites
CREATE TABLE IF NOT EXISTS transitional_facility_sites (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Containers currently on site (Yard)
CREATE TABLE IF NOT EXISTS yard_containers (
  container_number VARCHAR(32) PRIMARY KEY,
  gate_in_time TIMESTAMPTZ NOT NULL,
  current_bacc_id VARCHAR(64) NOT NULL,
  tsw_number VARCHAR(64) NOT NULL,
  bacc_type bacc_type NOT NULL,
  compliance_flag mpi_flag_type NOT NULL,
  flag_label VARCHAR(128) NOT NULL,
  authority_condition TEXT NOT NULL,
  action_instruction TEXT NOT NULL,
  vessel_name VARCHAR(128),
  voyage_number VARCHAR(64),
  country_of_origin VARCHAR(64),
  cargo_description VARCHAR(255),
  supplier_name VARCHAR(255),
  package_count INTEGER DEFAULT 0,
  authorised_site_id VARCHAR(64),
  authorised_site_name TEXT NOT NULL,
  inspecting_officer VARCHAR(128),
  is_source_doc_verified BOOLEAN DEFAULT FALSE,
  is_reefer BOOLEAN DEFAULT FALSE,
  status VARCHAR(32) DEFAULT 'YARD', -- 'YARD', 'CHECKED_OUT'
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_yard_containers_flag ON yard_containers (compliance_flag);
CREATE INDEX IF NOT EXISTS idx_yard_containers_gate ON yard_containers (gate_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_yard_containers_bacc ON yard_containers (current_bacc_id);
CREATE INDEX IF NOT EXISTS idx_yard_containers_tsw ON yard_containers (tsw_number);
CREATE INDEX IF NOT EXISTS idx_yard_containers_supplier ON yard_containers (supplier_name);

-- 4. BACC (Biosecurity Authority Clearance Certificate) History
CREATE TABLE IF NOT EXISTS bacc_history (
  id BIGSERIAL PRIMARY KEY,
  container_number VARCHAR(32) NOT NULL REFERENCES yard_containers(container_number) ON DELETE CASCADE,
  bacc_number VARCHAR(64) NOT NULL,
  received_time TIMESTAMPTZ NOT NULL,
  bacc_type bacc_type NOT NULL,
  authority_condition TEXT NOT NULL,
  is_superseded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bacc_history_container ON bacc_history (container_number, received_time DESC);

-- 5. Checked Out Containers (Archival / WMS return records)
CREATE TABLE IF NOT EXISTS checked_out_containers (
  id BIGSERIAL PRIMARY KEY,
  container_number VARCHAR(32) NOT NULL,
  gate_in_time TIMESTAMPTZ NOT NULL,
  checked_out_time TIMESTAMPTZ NOT NULL,
  final_mpi_answer VARCHAR(128) NOT NULL,
  latest_bacc_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_checked_out_cnum ON checked_out_containers (container_number);
CREATE INDEX IF NOT EXISTS idx_checked_out_time ON checked_out_containers (checked_out_time DESC);

-- 6. Compliance Agent Automated Run Audit Log
CREATE TABLE IF NOT EXISTS agent_runs (
  id BIGSERIAL PRIMARY KEY,
  run_time TIMESTAMPTZ NOT NULL,
  trigger_type run_trigger_type NOT NULL,
  items_processed INTEGER NOT NULL DEFAULT 0,
  result_message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_time ON agent_runs (run_time DESC);

-- 7. Agent Operational Events
CREATE TABLE IF NOT EXISTS agent_events (
  id BIGSERIAL PRIMARY KEY,
  event_time TIMESTAMPTZ NOT NULL,
  kind event_kind_type NOT NULL,
  container_number VARCHAR(32) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_events_time ON agent_events (event_time DESC);
