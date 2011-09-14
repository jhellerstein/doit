-- Tables/Views/UDFs used for MDL name resolution

-- Housekeeping
DROP VIEW IF EXISTS local_mdl_dictionaries CASCADE;
DROP TABLE IF EXISTS global_mdl_dictionaries CASCADE;
DROP VIEW IF EXISTS mdl_dict_card_by_len_vw CASCADE;
DROP TABLE IF EXISTS mdl_dict_card_by_len CASCADE;
DROP VIEW IF EXISTS mdl_input_stats CASCADE;

CREATE OR REPLACE FUNCTION mdl_clean () RETURNS void AS
$$
BEGIN
  DELETE FROM global_mdl_dictionaries;
  DELETE FROM mdl_dict_card_by_len;
END
$$ LANGUAGE plpgsql;

-- Preprocessed dictionary data (NOTE: Not really preprocessed yet :)
CREATE VIEW local_mdl_dictionaries AS
     SELECT field_id, value
       FROM local_data
   GROUP BY field_id, value;

CREATE VIEW global_mdl_dictionaries_vw AS
     SELECT a.global_id AS "att_id", d.value, LEAST(1.0, SUM(a.affinity)) AS "affinity"
       FROM local_mdl_dictionaries d, attribute_affinities a, training_threshold_affinity t
      WHERE d.field_id = a.local_id
        AND a.affinity >= t.threshold_affinity
   GROUP BY a.global_id, d.value;

CREATE TABLE global_mdl_dictionaries (
       att_id INTEGER,
       value TEXT,
       affinity FLOAT
);


-- Tables/views for computing description length
-- In general DL = plogm + avgValLen*(log(alphabetSize)) 
--               + fplog maxValLen + (f/n)sum_n(sum_p(log (# vals ok /# vals possible)))
-- In our case, p = 1, m = const, alphabetSize = 128, so we get
-- DL = avgValLen*8 + f*log maxValLen + (f/n) sum_n[log(#vals ok) - log(#vals possible)]
-- Where n is size of input dict, f is fraction of values accepted,
-- and (#vals ok/#vals possible) is length specific.

-- Note on affinities and MDL: elements are now considered to only fractionally
-- belong to global dictionaries, with fraction = affinity(local_dict(element), global_dict)

CREATE VIEW mdl_dict_card_by_len_vw AS
     SELECT att_id, length(value) l, SUM(affinity) card
       FROM global_mdl_dictionaries
   GROUP BY att_id, l;

CREATE TABLE mdl_dict_card_by_len (
       att_id INTEGER,
       l INTEGER,
       card INTEGER
);

CREATE VIEW mdl_input_stats AS
     SELECT field_id, COUNT(*) n,
            AVG(length(value)) AS "avglen", MAX(length(value)) AS "maxlen"
       FROM local_data
   GROUP BY field_id;

CREATE VIEW mdl_matches AS
     SELECT i.field_id, d.att_id, i.value, d.affinity
       FROM local_data i, global_mdl_dictionaries d
      WHERE i.value = d.value;

CREATE VIEW mdl_match_counts_by_len AS
     SELECT field_id, att_id, length(value) l, SUM(affinity) card
       FROM mdl_matches
   GROUP BY field_id, att_id, l;

-- Unencoded (generic string) description length
CREATE VIEW mdl_base_dl AS
     SELECT field_id, 'STRING'::text domain_name, (1.0 * avglen * ln(255)) dl
       FROM mdl_input_stats;

-- Note: Match fraction f = SUM(card) / (COUNT(*) * n)
CREATE VIEW mdl_description_length AS
     SELECT i.field_id, i.att_id,
   	    (SUM(i.card) / COUNT(*) /s.n) * ln(s.maxlen) term1,
	    (1.0 - (SUM(i.card) / COUNT(*) / s.n)) * s.avglen * ln(255) term2,
	    ((SUM(i.card) / COUNT(*) / s.n) / s.n) * SUM(ln(i.card::float / l.card)) term3
       FROM mdl_match_counts_by_len i, mdl_input_stats s, mdl_dict_card_by_len l
      WHERE i.field_id = s.field_id
	AND i.att_id = l.att_id
   GROUP BY i.field_id, i.att_id, s.avglen, s.maxlen, s.n;


CREATE OR REPLACE FUNCTION mdl_preprocess_global () RETURNS VOID AS
$$
BEGIN
  DROP INDEX IF EXISTS idx_global_mdl_dictionaries_value;

  INSERT INTO global_mdl_dictionaries
       SELECT *
         FROM global_mdl_dictionaries_vw;

  CREATE INDEX idx_global_mdl_dictionaries_value ON global_mdl_dictionaries USING hash (value);

  TRUNCATE mdl_dict_card_by_len;
  INSERT INTO mdl_dict_card_by_len
       SELECT *
         FROM mdl_dict_card_by_len_vw;
END
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION mdl_results_for_source (INTEGER) RETURNS VOID AS
$$
DECLARE
  test_source ALIAS FOR $1;
BEGIN
  PERFORM mdl_results_for_field(id) FROM local_fields WHERE source_id = test_source;
END
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION mdl_results_for_field (INTEGER) RETURNS VOID AS
$$
DECLARE
  test_field ALIAS FOR $1;
BEGIN
  -- Description length normalized by base (generic string) DL, then subtracted from 1
  INSERT INTO nr_raw_results (field_id, method_name, match_id, score)
  SELECT a.field_id, 'mdl', a.att_id, GREATEST(0, 1.0 - (a.term1+a.term2+a.term3) / b.dl)
    FROM mdl_description_length a, mdl_base_dl b
   WHERE a.field_id = b.field_id
     AND a.field_id = test_field;
END
$$ LANGUAGE plpgsql;

