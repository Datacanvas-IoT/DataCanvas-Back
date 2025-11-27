ALTER TABLE "public".columnconstraint
DROP CONSTRAINT IF EXISTS columnconstraint_clm_id_fkey,
ADD CONSTRAINT columnconstraint_clm_id_fkey
FOREIGN KEY (clm_id) REFERENCES "public".columns(clm_id) ON DELETE CASCADE ON UPDATE CASCADE;
