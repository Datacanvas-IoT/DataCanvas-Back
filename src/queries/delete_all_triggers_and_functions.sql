DROP TRIGGER IF EXISTS after_delete_toggle ON "public".toggles;


DROP TRIGGER IF EXISTS after_delete_gauge ON "public".gauges;


DROP TRIGGER IF EXISTS after_delete_chart ON "public".charts;


DROP TRIGGER IF EXISTS after_delete_chartseries ON "public".chartseries;


DROP TRIGGER IF EXISTS after_delete_parametertable_column ON "public".parametertables;


DROP FUNCTION IF EXISTS "public".delete_from_widget() CASCADE;


DROP FUNCTION IF EXISTS "public".check_and_delete_chart() CASCADE;


DROP FUNCTION IF EXISTS "public".check_and_delete_widget() CASCADE;