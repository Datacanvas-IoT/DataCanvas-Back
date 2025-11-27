CREATE DATABASE "iot-on-earth" WITH OWNER = "datacanvasAdmin" ENCODING = 'UTF8' LC_COLLATE = 'en_US.utf8' LC_CTYPE = 'en_US.utf8' LOCALE_PROVIDER = 'libc' TABLESPACE = pg_default CONNECTION
LIMIT = -1 IS_TEMPLATE = False;


CREATE SCHEMA IF NOT EXISTS "public"
AUTHORIZATION azure_pg_admin;

COMMENT ON SCHEMA "public" IS 'standard public schema';


CREATE TABLE IF NOT EXISTS "public".users ( user_id integer NOT NULL DEFAULT nextval('"public".users_user_id_seq'::regclass),
                                                                                          email character varying(50) COLLATE pg_catalog."default" NOT NULL,
                                                                                                                                                   user_name character varying(50) COLLATE pg_catalog."default" NOT NULL,
                                                                                                                                                                                                                created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                                                                                                               updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                                                                                                                                                              CONSTRAINT users_pkey PRIMARY KEY (user_id))
CREATE TABLE IF NOT EXISTS "public".projects
    ( project_id integer NOT NULL DEFAULT nextval('"public".projects_project_id_seq'::regclass),
                                          project_name character varying(50) COLLATE pg_catalog."default" NOT NULL,
                                                                                                          description character varying(200) COLLATE pg_catalog."default",
                                                                                                                                                     user_id integer, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                                                                     updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                                                                                                                    CONSTRAINT projects_pkey PRIMARY KEY (project_id), CONSTRAINT projects_user_id_fkey
     FOREIGN KEY (user_id) REFERENCES "public".users (user_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE)
CREATE TABLE IF NOT EXISTS "public".devices
    ( device_name character varying(50) COLLATE pg_catalog."default" NOT NULL,
                                                                     description character varying(100) COLLATE pg_catalog."default",
                                                                                                                project_id integer, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                                   updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                                                                                  fingerprint character varying(32) COLLATE pg_catalog."default" NOT NULL,
                                                                                                                                                                                                                                                                                                 device_id integer NOT NULL DEFAULT nextval('"public".devices_device_id_seq'::regclass),
                                                                                                                                                                                                                                                                                                                                    CONSTRAINT devices_pkey PRIMARY KEY (device_id), CONSTRAINT devices_project_id_fkey
     FOREIGN KEY (project_id) REFERENCES "public".projects (project_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE)
CREATE TABLE IF NOT EXISTS "public".datatables
    ( tbl_id integer NOT NULL DEFAULT nextval('"public".datatables_tbl_id_seq'::regclass),
                                      tbl_name character varying(25) COLLATE pg_catalog."default" NOT NULL,
                                                                                                  project_id integer, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                     updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                                                                    CONSTRAINT datatables_pkey PRIMARY KEY (tbl_id), CONSTRAINT datatables_project_id_fkey
     FOREIGN KEY (project_id) REFERENCES "public".projects (project_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE)
CREATE TABLE IF NOT EXISTS "public".datatypes ( type_id integer NOT NULL DEFAULT nextval('"public".columndatatypes_type_id_seq'::regclass),
                                                                                              type_name character varying(10) COLLATE pg_catalog."default" NOT NULL,
                                                                                                                                                           CONSTRAINT columndatatypes_pkey PRIMARY KEY (type_id))
CREATE TABLE IF NOT EXISTS "public"."constraint" ( constraint_id integer NOT NULL DEFAULT nextval('"public".columnconstraints_constraint_id_seq'::regclass),
                                                                                                       constraint_name character varying(15) COLLATE pg_catalog."default" NOT NULL,
                                                                                                                                                                          CONSTRAINT columnconstraints_pkey PRIMARY KEY (constraint_id))
CREATE TABLE IF NOT EXISTS "public".columns
    ( clm_id integer NOT NULL DEFAULT nextval('"public".columns_clm_id_seq'::regclass),
                                      clm_name character varying(20) COLLATE pg_catalog."default" NOT NULL,
                                                                                                  data_type integer, tbl_id integer, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                                    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                                                                                   default_value character varying(255) COLLATE pg_catalog."default",
                                                                                                                                                                                                                                                                                max_length integer, CONSTRAINT columns_pkey PRIMARY KEY (clm_id), CONSTRAINT columns_data_type_fkey
     FOREIGN KEY (data_type) REFERENCES "public".datatypes (type_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
                                                                                                                           CONSTRAINT columns_tbl_id_fkey
     FOREIGN KEY (tbl_id) REFERENCES "public".datatables (tbl_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE)
CREATE TABLE IF NOT EXISTS "public".columnconstraint
    ( id integer NOT NULL DEFAULT nextval('"public".constraintsofcolumn_id_seq'::regclass),
                                  clm_id integer, constraint_id integer, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                                                                                        updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                       CONSTRAINT constraintsofcolumn_pkey PRIMARY KEY (id), CONSTRAINT columnconstraint_clm_id_fkey
     FOREIGN KEY (clm_id) REFERENCES "public".columns (clm_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE,
                                                                                                                     CONSTRAINT constraintsofcolumn_constraint_id_fkey
     FOREIGN KEY (constraint_id) REFERENCES "public"."constraint" (constraint_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT)
CREATE TABLE IF NOT EXISTS "public".widgets
    ( id integer NOT NULL DEFAULT nextval('"public".widgets_widget_id_seq'::regclass),
                                  dataset integer NOT NULL,
                                                  widget_name character varying(50) COLLATE pg_catalog."default" NOT NULL,
                                                                                                                 widget_type integer NOT NULL,
                                                                                                                                     project_id integer NOT NULL,
                                                                                                                                                        CONSTRAINT widgets_pkey PRIMARY KEY (id), CONSTRAINT widgets_dataset_fkey
     FOREIGN KEY (dataset) REFERENCES "public".datatables (tbl_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE,
                                                                                                                         CONSTRAINT widgets_project_id_fkey
     FOREIGN KEY (project_id) REFERENCES "public".projects (project_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE NOT VALID)
CREATE TABLE IF NOT EXISTS "public".charts
    ( id integer NOT NULL DEFAULT nextval('"public".variations_id_seq'::regclass),
                                  widget_id integer NOT NULL,
                                                    x_axis integer, chart_type integer NOT NULL,
                                                                                       CONSTRAINT charts_pkey PRIMARY KEY (id), CONSTRAINT charts_widget_fkey
     FOREIGN KEY (widget_id) REFERENCES "public".widgets (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE,
                                                                                                                    CONSTRAINT charts_x_axis_fkey
     FOREIGN KEY (x_axis) REFERENCES "public".columns (clm_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE)
CREATE TABLE IF NOT EXISTS "public".chartseries
    ( id integer NOT NULL DEFAULT nextval('"public".variationseries_id_seq'::regclass),
                                  chart_id integer NOT NULL,
                                                   clm_id integer, device_id integer, series_name character varying(50) COLLATE pg_catalog."default" NOT NULL,
                                                                                                                                                     CONSTRAINT chartseries_pkey PRIMARY KEY (id), CONSTRAINT chartseries_chart_id_fkey
     FOREIGN KEY (chart_id) REFERENCES "public".charts (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE,
                                                                                                                  CONSTRAINT chartseries_clm_id_fkey
     FOREIGN KEY (clm_id) REFERENCES "public".columns (clm_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE,
                                                                                                                     CONSTRAINT chartseries_device_id_fkey
     FOREIGN KEY (device_id) REFERENCES "public".devices (device_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE NOT VALID)
CREATE TABLE IF NOT EXISTS "public".parametertables
    ( id integer NOT NULL DEFAULT nextval('"public".parametertables_id_seq'::regclass),
                                  widget_id integer NOT NULL,
                                                    clm_id integer NOT NULL,
                                                                   device_id integer, CONSTRAINT parametertables_pkey PRIMARY KEY (id), CONSTRAINT parametertables_clm_id_fkey
     FOREIGN KEY (clm_id) REFERENCES "public".columns (clm_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE,
                                                                                                                     CONSTRAINT parametertables_device_id_fkey
     FOREIGN KEY (device_id) REFERENCES "public".devices (device_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID,
                                                                                                                                           CONSTRAINT parametertables_widget_id_fkey
     FOREIGN KEY (widget_id) REFERENCES "public".widgets (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE)
CREATE TABLE IF NOT EXISTS "public".toggles
    ( id integer NOT NULL DEFAULT nextval('"public".toggles_id_seq'::regclass),
                                  widget_id integer NOT NULL,
                                                    clm_id integer NOT NULL,
                                                                   write_enabled boolean NOT NULL DEFAULT false,
                                                                                                          device_id integer, CONSTRAINT toggles_pkey PRIMARY KEY (id), CONSTRAINT toggles_clm_id_fkey
     FOREIGN KEY (clm_id) REFERENCES "public".columns (clm_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE,
                                                                                                                     CONSTRAINT toggles_device_id_fkey
     FOREIGN KEY (device_id) REFERENCES "public".devices (device_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE NOT VALID,
                                                                                                                                       CONSTRAINT toggles_widget_id_fkey
     FOREIGN KEY (widget_id) REFERENCES "public".widgets (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE)
CREATE TABLE IF NOT EXISTS "public".gauges
    ( id integer NOT NULL DEFAULT nextval('"public".gauges_id_seq'::regclass),
                                  widget_id integer NOT NULL,
                                                    clm_id integer NOT NULL,
                                                                   max_value double precision NOT NULL,
                                                                                              gauge_type integer NOT NULL,
                                                                                                                 device_id integer, min_value double precision NOT NULL,
                                                                                                                                                               CONSTRAINT gauges_pkey PRIMARY KEY (id), CONSTRAINT gauges_clm_id_fkey
     FOREIGN KEY (clm_id) REFERENCES "public".columns (clm_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE,
                                                                                                                     CONSTRAINT gauges_device_id_fkey
     FOREIGN KEY (device_id) REFERENCES "public".devices (device_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE NOT VALID,
                                                                                                                                       CONSTRAINT gauges_widget_id_fkey
     FOREIGN KEY (widget_id) REFERENCES "public".widgets (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE)