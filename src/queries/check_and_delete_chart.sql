/*
    * THIS FUNCTION WILL BE TRIGGERED WHEN A ROW IS DELETED FROM CHARTSERIES TABLE
    * IT WILL CHECK IF THERE ARE ANY ROWS IN CHARTSERIES TABLE THAT MATCHES THE CONDITION
        * IF THERE ARE NO ROWS, IT WILL DELETE THE ROW FROM CHARTS TABLE
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
    * BEFORE CREATING THIS FUNCTION, CREATE THE FUNCTION delete_from_widget
*/
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