-- FUNCTIONS

CREATE OR REPLACE FUNCTION "public".delete_from_widget() RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM "public".widgets WHERE id = OLD.widget_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION "public".check_and_delete_chart() RETURNS TRIGGER AS $$
DECLARE
    series_count INT;
BEGIN
    -- Get the count of rows from chartseries table that matches the condition
    SELECT COUNT(*) INTO series_count
    FROM "public".chartseries
    WHERE chart_id = OLD.chart_id;

    -- If count is 0, delete rows from chart table where id=OLD.chart_id
    IF series_count = 0 THEN
        DELETE FROM "public".charts
        WHERE id = OLD.chart_id;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION "public".check_and_delete_widget() RETURNS TRIGGER AS $$
DECLARE
    column_count INT;
BEGIN
    -- Get the count of rows from chartseries table that matches the condition
    SELECT COUNT(*) INTO column_count
    FROM "public".parametertables
    WHERE widget_id = OLD.widget_id;

    -- If count is 0, delete rows from chart table where id=OLD.chart_id
    IF column_count = 0 THEN
        DELETE FROM "public".widgets
        WHERE id = OLD.widget_id;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS

CREATE OR REPLACE TRIGGER after_delete_toggle AFTER
DELETE ON "public".toggles
FOR EACH ROW EXECUTE FUNCTION "public".delete_from_widget();


CREATE OR REPLACE TRIGGER after_delete_gauge AFTER
DELETE ON "public".gauges
FOR EACH ROW EXECUTE FUNCTION "public".delete_from_widget();


CREATE OR REPLACE TRIGGER after_delete_chart AFTER
DELETE ON "public".charts
FOR EACH ROW EXECUTE FUNCTION "public".delete_from_widget();


CREATE OR REPLACE TRIGGER after_delete_chartseries AFTER
DELETE ON "public".chartseries
FOR EACH ROW EXECUTE FUNCTION "public".check_and_delete_chart();


CREATE OR REPLACE TRIGGER after_delete_parametertable_column AFTER
DELETE ON "public".parametertables
FOR EACH ROW EXECUTE FUNCTION "public".check_and_delete_widget();

