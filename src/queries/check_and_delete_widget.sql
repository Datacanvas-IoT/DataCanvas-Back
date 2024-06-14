/*
    * THIS IS A FUNCTION THAT DELETES A ROW FROM WIDGET TABLE
    * THIS IS TRIGGERED WHEN A ROW IS DELETED FROM PARAMETERTABLES TABLE
    * THIS FUNCTION WILL CHECK IF THERE ARE ANY ROWS IN PARAMETERTABLES TABLE THAT MATCHES THE CONDITION
    * IF THERE ARE NO ROWS, THEN DELETE THE ROW FROM WIDGET TABLE
    * THIS IS TO OVERCOME THE FOLLOWING ISSUE
        * WHEN A COLUMN IS DELETED FROM THE COLUMNS TABLE,
            * GAUGES
            * TOGGLES
            * RELEVANT ROWS FROM PARAMTER TABLES
            * RELEVANT ROWS FROM CHART SERIES TABLE
            * CHARTS
            WILL BE DELETED
        * WHEN ANY OF THE ABOVE
            * DELETED, IT WILL MANIPULATE CREATED WIDGETS EXCEPT
                * WHEN THERE ARE MORE COLUMNS FOR PARAMETER TABLES
                * WHEN THERE ARE MORE CHART SERIES FOR CHARTS
            * SO, WHEN A TOGGLE OR GAUGE IS DELETED, THE WIDGET WILL BE DELETED AUTOMATICALLY
*/
CREATE OR REPLACE FUNCTION "iot-on-earth-public".check_and_delete_widget() RETURNS TRIGGER AS $$
DECLARE
    column_count INT;
BEGIN
    -- Get the count of rows from chartseries table that matches the condition
    SELECT COUNT(*) INTO column_count
    FROM "iot-on-earth-public".parametertables
    WHERE widget_id = OLD.widget_id;

    -- If count is 0, delete rows from chart table where id=OLD.chart_id
    IF column_count = 0 THEN
        DELETE FROM "iot-on-earth-public".widgets
        WHERE id = OLD.widget_id;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

