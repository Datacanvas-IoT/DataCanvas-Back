/*
    * FILE: db-structure/db_2025-12-15.sql
    * CREATED ON: 2025-12-15
    * AUTHOR: Sankha Ambeypitiya
    * REPLACED: db-structure/db_2025-11-23.sql
    * CHANGES MADE:
    ** Added 'is_system_column' to columns table to identify system columns such as id, device, created_at, and updated_at.
    ** Added insert statements for 'datatypes' and 'constraint' tables to include necessary data types and constraints used in the database.
*/

-- 1. Create the main database
CREATE DATABASE "datacanvas" WITH OWNER = "datacanvasAdmin" ENCODING = 'UTF8' LC_COLLATE = 'en_US.utf8' LC_CTYPE = 'en_US.utf8' LOCALE_PROVIDER = 'libc' TABLESPACE = pg_default CONNECTION
LIMIT = -1 IS_TEMPLATE = False;

-- 2. Create the public schema
CREATE SCHEMA IF NOT EXISTS "public"
AUTHORIZATION azure_pg_admin;

COMMENT ON SCHEMA "public" IS 'standard public schema';

-- 3. Create users table
CREATE TABLE IF NOT EXISTS public.users
(
    user_id SERIAL PRIMARY KEY,
    email character varying(50) NOT NULL,
    user_name character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create projects table (dependent on users)
CREATE TABLE IF NOT EXISTS public.projects
(
    project_id SERIAL PRIMARY KEY,
    project_name character varying(50) NOT NULL,
    description character varying(200),
    user_id integer,
    real_time_enabled boolean DEFAULT false,
    mqtt_key character varying(32),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (user_id)
        MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- 5. Create devices table (dependent on projects)
CREATE TABLE IF NOT EXISTS public.devices
(
    -- SERIAL creates the sequence automatically
    device_id SERIAL PRIMARY KEY, 
    device_name character varying(50) NOT NULL,
    description character varying(100),
    project_id integer,
    fingerprint character varying(32) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT devices_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES public.projects (project_id)
        MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- 6. Create datatypes table (independent helper table)
CREATE TABLE IF NOT EXISTS public.datatypes
(
    type_id SERIAL PRIMARY KEY,
    type_name character varying(10) NOT NULL
);

-- 7. Create constraint table (independent helper table)
-- Note: "constraint" is a reserved word, so it MUST be double-quoted
CREATE TABLE IF NOT EXISTS public."constraint"
(
    constraint_id SERIAL PRIMARY KEY,
    constraint_name character varying(15) NOT NULL
);

-- 8. Create datatables table (dependent on projects)
CREATE TABLE IF NOT EXISTS public.datatables
(
    tbl_id SERIAL PRIMARY KEY,
    tbl_name character varying(25) NOT NULL,
    project_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT datatables_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES public.projects (project_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- 9. Create columns table (dependent on datatypes and datatables)
CREATE TABLE IF NOT EXISTS public.columns
(
    clm_id SERIAL PRIMARY KEY,
    clm_name character varying(20) NOT NULL,
    data_type integer,
    tbl_id integer,
    default_value character varying(255),
    max_length integer,
    is_system_column boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT columns_data_type_fkey FOREIGN KEY (data_type)
        REFERENCES public.datatypes (type_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT columns_tbl_id_fkey FOREIGN KEY (tbl_id)
        REFERENCES public.datatables (tbl_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- 10. Create columnconstraint table (dependent on columns and constraint)
CREATE TABLE IF NOT EXISTS public.columnconstraint
(
    id SERIAL PRIMARY KEY,
    clm_id integer,
    constraint_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT columnconstraint_clm_id_fkey FOREIGN KEY (clm_id)
        REFERENCES public.columns (clm_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT columnconstraint_constraint_id_fkey FOREIGN KEY (constraint_id)
        REFERENCES public."constraint" (constraint_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 11. Create widgets table (dependent on datatables and projects)
CREATE TABLE IF NOT EXISTS public.widgets
(
    id SERIAL PRIMARY KEY,
    dataset integer NOT NULL,
    widget_name character varying(50) NOT NULL,
    widget_type integer NOT NULL,
    project_id integer NOT NULL,

    CONSTRAINT widgets_dataset_fkey FOREIGN KEY (dataset)
        REFERENCES public.datatables (tbl_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT widgets_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES public.projects (project_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- 12. Create charts table (dependent on widgets and columns)
CREATE TABLE IF NOT EXISTS public.charts
(
    id SERIAL PRIMARY KEY,
    widget_id integer NOT NULL,
    x_axis integer,
    chart_type integer NOT NULL,

    CONSTRAINT charts_widget_fkey FOREIGN KEY (widget_id)
        REFERENCES public.widgets (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT charts_x_axis_fkey FOREIGN KEY (x_axis)
        REFERENCES public.columns (clm_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- 13. Create chartseries table (dependent on charts, columns, and devices)
CREATE TABLE IF NOT EXISTS public.chartseries
(
    id SERIAL PRIMARY KEY,
    chart_id integer NOT NULL,
    clm_id integer,
    device_id integer,
    series_name character varying(50) NOT NULL,

    CONSTRAINT chartseries_chart_id_fkey FOREIGN KEY (chart_id)
        REFERENCES public.charts (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chartseries_clm_id_fkey FOREIGN KEY (clm_id)
        REFERENCES public.columns (clm_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chartseries_device_id_fkey FOREIGN KEY (device_id)
        REFERENCES public.devices (device_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- 14. Create parametertables table (dependent on widgets, columns, and devices)
CREATE TABLE IF NOT EXISTS public.parametertables
(
    id SERIAL PRIMARY KEY,
    widget_id integer NOT NULL,
    clm_id integer NOT NULL,
    device_id integer,

    CONSTRAINT parametertables_clm_id_fkey FOREIGN KEY (clm_id)
        REFERENCES public.columns (clm_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT parametertables_device_id_fkey FOREIGN KEY (device_id)
        REFERENCES public.devices (device_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT parametertables_widget_id_fkey FOREIGN KEY (widget_id)
        REFERENCES public.widgets (id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- 15. Create toggles table (dependent on widgets, columns, and devices)
CREATE TABLE IF NOT EXISTS public.toggles
(
    id SERIAL PRIMARY KEY,
    widget_id integer NOT NULL,
    clm_id integer NOT NULL,
    write_enabled boolean NOT NULL DEFAULT false,
    device_id integer,

    CONSTRAINT toggles_clm_id_fkey FOREIGN KEY (clm_id)
        REFERENCES public.columns (clm_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT toggles_device_id_fkey FOREIGN KEY (device_id)
        REFERENCES public.devices (device_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT toggles_widget_id_fkey FOREIGN KEY (widget_id)
        REFERENCES public.widgets (id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- 16. Create gauges table (dependent on widgets, columns, and devices)
CREATE TABLE IF NOT EXISTS public.gauges
(
    id SERIAL PRIMARY KEY,
    widget_id integer NOT NULL,
    clm_id integer NOT NULL,
    max_value double precision NOT NULL,
    gauge_type integer NOT NULL,
    device_id integer,
    min_value double precision NOT NULL,

    CONSTRAINT gauges_clm_id_fkey FOREIGN KEY (clm_id)
        REFERENCES public.columns (clm_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT gauges_device_id_fkey FOREIGN KEY (device_id)
        REFERENCES public.devices (device_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT gauges_widget_id_fkey FOREIGN KEY (widget_id)
        REFERENCES public.widgets (id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- 16.1 Create metrics table (dependent on widgets, columns, and devices)
CREATE TABLE IF NOT EXISTS public.metrics
(
    id SERIAL PRIMARY KEY,
    widget_id integer NOT NULL,
    clm_id integer NOT NULL,
    device_id integer,
    measuring_unit character varying(4) NOT NULL,

    CONSTRAINT metrics_widget_id_fkey FOREIGN KEY (widget_id)
        REFERENCES public.widgets (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT metrics_clm_id_fkey FOREIGN KEY (clm_id)
        REFERENCES public.columns (clm_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT metrics_device_id_fkey FOREIGN KEY (device_id)
        REFERENCES public.devices (device_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- 17. Create analyticwidgets table (dependent on datatables, columns, devices, and projects)
CREATE TABLE IF NOT EXISTS public.analyticwidgets
(
    id SERIAL PRIMARY KEY,
    widget_name character varying(50) NOT NULL,
    widget_type integer NOT NULL,
    dataset integer NOT NULL,
    parameter integer NOT NULL,
    device integer NOT NULL,
    project integer NOT NULL,
    latest_value numeric DEFAULT 0,
    latest_value_timestamp timestamp without time zone,

    CONSTRAINT analyticwidget_columns_fkey FOREIGN KEY (parameter)
        REFERENCES public.columns (clm_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT analyticwidget_datatable_fkey FOREIGN KEY (dataset)
        REFERENCES public.datatables (tbl_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT analyticwidget_device_fkey FOREIGN KEY (device)
        REFERENCES public.devices (device_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT analyticwidget_project_fkey FOREIGN KEY (project)
        REFERENCES public.projects (project_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- 18. Create accesskeys table (dependent on projects)
CREATE TABLE IF NOT EXISTS public.accesskeys
(
    access_key_id SERIAL PRIMARY KEY,
    access_key_name character varying(255) NOT NULL,
    project_id integer,
    secret_access_key character varying(255) NOT NULL,
    client_access_key character varying(255) NOT NULL,
    expiration_date date,
    access_key_last_use_time timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT accesskeys_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES public.projects (project_id)
        MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- 19. Create accesskeydomains table (dependent on accesskeys)
CREATE TABLE IF NOT EXISTS public.accesskeydomains
(
    access_key_domain_id SERIAL PRIMARY KEY,
    access_key_domain_name character varying(255) NOT NULL,
    access_key_id integer,

    CONSTRAINT accesskeydomains_access_key_id_fkey FOREIGN KEY (access_key_id)
        REFERENCES public.accesskeys (access_key_id)
        MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- 20. Create accesskeydevices table (dependent on devices and accesskeys)
CREATE TABLE IF NOT EXISTS public.accesskeydevices
(
    access_key_device_id SERIAL PRIMARY KEY,
    device_id integer,
    access_key_id integer,

    CONSTRAINT accesskeydevices_device_id_fkey FOREIGN KEY (device_id)
        REFERENCES public.devices (device_id)
        MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT accesskeydevices_access_key_id_fkey FOREIGN KEY (access_key_id)
        REFERENCES public.accesskeys (access_key_id)
        MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- 21. Create shared_dashboards table to store public share links with configurable widget visibility

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


-- Insert data into datatypes table
INSERT INTO public.datatypes (type_id, type_name) VALUES
(1, 'int'),
(2, 'real'),
(3, 'varchar'),
(4, 'boolean'),
(5, 'date');

-- Insert data into constraint table
INSERT INTO public."constraint" (constraint_id, constraint_name) VALUES
(1, 'SERIAL'),
(2, 'NOT NULL'),
(3, 'UNIQUE');

