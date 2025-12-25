-- Migration: Add shared_dashboards table for public dashboard sharing feature
-- Date: 2025-12-25

-- Create the shared_dashboards table
CREATE TABLE IF NOT EXISTS public.shared_dashboards (
    share_id SERIAL PRIMARY KEY,
    share_token VARCHAR(64) NOT NULL UNIQUE,
    project_id INTEGER NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
    share_name VARCHAR(255),
    allowed_widget_ids INTEGER[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on share_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_shared_dashboards_share_token ON public.shared_dashboards(share_token);

-- Create index on project_id for fast lookups by project
CREATE INDEX IF NOT EXISTS idx_shared_dashboards_project_id ON public.shared_dashboards(project_id);

-- Create index on is_active for filtering active shares
CREATE INDEX IF NOT EXISTS idx_shared_dashboards_is_active ON public.shared_dashboards(is_active);

COMMENT ON TABLE public.shared_dashboards IS 'Stores public share links for dashboards with configurable widget visibility';
COMMENT ON COLUMN public.shared_dashboards.share_token IS 'Unique 64-character hex token for public access';
COMMENT ON COLUMN public.shared_dashboards.allowed_widget_ids IS 'Array of widget IDs that are visible in this share';
COMMENT ON COLUMN public.shared_dashboards.is_active IS 'Whether this share link is currently active';
COMMENT ON COLUMN public.shared_dashboards.expires_at IS 'Optional expiration timestamp for the share link';
