


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."complete_payout"("p_transfer_id" "text", "p_result" "text", "p_error" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  p payout%ROWTYPE;   -- the payout being completed
  new_entry uuid;     -- id of the new ledger row
BEGIN
  -- 1. Find the payout by its transfer id, only if it is still 'sent'
  SELECT * INTO p FROM payout
  WHERE payout_transfer_id = p_transfer_id AND status = 'sent'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'Nothing to do: no sent payout for ' || p_transfer_id;
  END IF;

  IF p_result = 'paid' THEN
    -- 2. Add the transfer out to the ledger (negative amount)
    INSERT INTO ledger (artist_id, account_category, month, amount_units, amount_dollars, entry_type)
    VALUES (p.artist_id, 'artist', p.month,
            -p.payout_value_cents * 10000,
            '$' || to_char(-p.payout_value_cents / 100.0, 'FM999,990.00'),
            'transfer')
    RETURNING entry_id INTO new_entry;

    -- 3. Mark the payout paid and link it to the new ledger row (one update)
    UPDATE payout
    SET status = 'paid', ledger_entry_id = new_entry
    WHERE payout_id = p.payout_id;

    RETURN 'Paid ' || p.payout_id;

  ELSE
    -- Failed: no ledger row, so the balance stays for the next run
    UPDATE payout
    SET status = 'failed', error = p_error
    WHERE payout_id = p.payout_id;

    RETURN 'Failed ' || p.payout_id;
  END IF;
END $_$;


ALTER FUNCTION "public"."complete_payout"("p_transfer_id" "text", "p_result" "text", "p_error" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."monthly_run"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  m text;
  s text;        -- start month from run_config (kept up to date by update_config)
  n int;         -- months since the start month (0 = the start month itself)
  every int;     -- annual payout every this many months (12 unless run_config says otherwise)
BEGIN
  -- 1. pick the month to post: the month after the latest ledger month (or start_month if the ledger is empty)
  SELECT COALESCE(to_char(to_date(max(month), 'YYYY-MM') + interval '1 month', 'YYYY-MM'),
                  (SELECT value FROM run_config WHERE key = 'start_month'))
  INTO m FROM ledger;
  IF m >= COALESCE((SELECT value FROM run_config WHERE key = 'test_current_month'),
                   to_char(now() AT TIME ZONE 'Australia/Perth', 'YYYY-MM')) THEN
    RETURN 'Nothing posted: ' || m || ' has not ended';
  END IF;

  -- 2. post the month to the ledger
  INSERT INTO ledger (artist_id, account_category, month, amount_units, amount_dollars, public_name)
  SELECT x.artist_id, x.account_category, x.month, x.amount_units::bigint,
         '$' || to_char(x.amount_units / 1000000.0, 'FM999,990.00'),
         ap.public_name   -- NULL for industry, licence and operations rows (no artist)
  FROM (
    SELECT p.month, 'artist' AS account_category, p.artist_id, SUM(p.song_payment) AS amount_units
    FROM payment_calc p
    WHERE p.month = m GROUP BY p.month, p.artist_id
    UNION ALL
    SELECT month, 'industry',   NULL::uuid, SUM(industry_cents)   * 10000 FROM payer_split WHERE month = m GROUP BY month
    UNION ALL
    SELECT month, 'licence',    NULL::uuid, SUM(licence_cents)    * 10000 FROM payer_split WHERE month = m GROUP BY month
    UNION ALL
    SELECT month, 'operations', NULL::uuid, SUM(operations_cents) * 10000 FROM payer_split WHERE month = m GROUP BY month
  ) x
  LEFT JOIN artist_profile ap ON ap.artist_id = x.artist_id;

  -- 3. create pending payouts for artists at or over the threshold who have a payment account
  INSERT INTO payout (public_name, artist_id, month, payout_type, status, payout_value_cents, ledger_entry_id)
  SELECT ap.public_name, l.artist_id, m, 'threshold', 'pending', floor(SUM(l.amount_units) / 10000)::bigint,
         (SELECT d.entry_id FROM ledger d WHERE d.artist_id = l.artist_id AND d.entry_type = 'distribution'
          ORDER BY d.month DESC LIMIT 1)
  FROM ledger l
  JOIN artist_payment_account a ON a.artist_id = l.artist_id
  JOIN artist_profile ap ON a.artist_id = ap.artist_id
  WHERE l.account_category = 'artist'
    AND NOT EXISTS (SELECT 1 FROM payout p WHERE p.artist_id = l.artist_id AND p.status IN ('pending', 'sent'))
  GROUP BY l.artist_id, ap.public_name
  HAVING SUM(l.amount_units) >= (SELECT value::bigint FROM run_config WHERE key = 'threshold_cents');

  -- 4. annual payout: every 12 months from start_month, pay artists with at least 1 cent who had NO payout in the last 12 months
  s := (SELECT value FROM run_config WHERE key = 'start_month');
  every := COALESCE((SELECT value::int FROM run_config WHERE key = 'annual_months'), 12);   -- optional row, only needed for testing
  n := (substr(m, 1, 4)::int - substr(s, 1, 4)::int) * 12 + (substr(m, 6, 2)::int - substr(s, 6, 2)::int);
  IF n % every = every - 1 THEN     -- start 2025-09 and every = 12 gives 2026-08 (the 12th month posted)
    INSERT INTO payout (public_name, artist_id, month, payout_type, status, payout_value_cents, ledger_entry_id)
    SELECT ap.public_name, l.artist_id, m, 'annual', 'pending', floor(SUM(l.amount_units) / 10000)::bigint,
           (SELECT d.entry_id FROM ledger d WHERE d.artist_id = l.artist_id AND d.entry_type = 'distribution'
            ORDER BY d.month DESC LIMIT 1)
    FROM ledger l
    JOIN artist_payment_account a ON a.artist_id = l.artist_id
    JOIN artist_profile ap ON ap.artist_id = l.artist_id
    WHERE l.account_category = 'artist'
      AND NOT EXISTS (SELECT 1 FROM payout p
                      WHERE p.artist_id = l.artist_id
                        AND p.status IN ('pending', 'sent', 'paid')
                        AND p.month > to_char(to_date(m, 'YYYY-MM') - interval '12 months', 'YYYY-MM'))
    GROUP BY l.artist_id, ap.public_name
    HAVING SUM(l.amount_units) >= 10000;
  END IF;

  RETURN 'Posted ' || m;
END $_$;


ALTER FUNCTION "public"."monthly_run"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
  tbl name;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        SELECT c.relname INTO tbl FROM pg_catalog.pg_class c WHERE c.oid = cmd.objid;
        EXECUTE format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."artist_profile" (
    "user_id" "uuid" NOT NULL,
    "artist_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "public_name" "text" NOT NULL,
    "private_name" "text" NOT NULL,
    "region" "text" NOT NULL,
    "bio" "text" NOT NULL,
    "cohort_label" "text",
    "stripe_account_id" "text"
);


ALTER TABLE "public"."artist_profile" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ledger" (
    "entry_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "artist_id" "uuid",
    "account_category" "text",
    "month" "text" NOT NULL,
    "amount_units" bigint NOT NULL,
    "amount_dollars" "text" NOT NULL,
    "entry_type" "text" DEFAULT 'distribution'::"text" NOT NULL,
    "public_name" "text",
    CONSTRAINT "ledger_entry_type_check" CHECK (("entry_type" = ANY (ARRAY['distribution'::"text", 'transfer'::"text", 'refund'::"text"])))
);


ALTER TABLE "public"."ledger" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."run_config" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL
);


ALTER TABLE "public"."run_config" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."artist_balance" WITH ("security_invoker"='on') AS
 SELECT "l"."artist_id",
    "a"."public_name",
    "sum"("l"."amount_units") AS "balance_units",
    ('$'::"text" || "to_char"(("sum"("l"."amount_units") / 1000000.0), 'FM999,990.00'::"text")) AS "balance_dollars",
    ("sum"("l"."amount_units") >= (( SELECT ("run_config"."value")::bigint AS "value"
           FROM "public"."run_config"
          WHERE ("run_config"."key" = 'threshold_cents'::"text")))::numeric) AS "payable",
    ( SELECT "max"("ledger"."month") AS "max"
           FROM "public"."ledger") AS "last_update_month"
   FROM ("public"."ledger" "l"
     JOIN "public"."artist_profile" "a" ON (("a"."artist_id" = "l"."artist_id")))
  WHERE ("l"."account_category" = 'artist'::"text")
  GROUP BY "l"."artist_id", "a"."public_name";


ALTER VIEW "public"."artist_balance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artist_payment_account" (
    "artist_id" "uuid" NOT NULL,
    "account_name" "text" NOT NULL,
    "account_id" "text" NOT NULL
);


ALTER TABLE "public"."artist_payment_account" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_and_site" (
    "business_id" "uuid" NOT NULL,
    "site_id" "uuid" NOT NULL,
    "address" "text" NOT NULL,
    "region" "text" NOT NULL,
    "notional_fee_cents" bigint NOT NULL,
    "stripe_id" "text",
    "site_name" "text" NOT NULL
);


ALTER TABLE "public"."business_and_site" OWNER TO "postgres";


COMMENT ON TABLE "public"."business_and_site" IS 'Table has business (linked to some other table) and the site name - businesses pay for each individual site.';



CREATE TABLE IF NOT EXISTS "public"."listeners_profile" (
    "user_id" "uuid" NOT NULL,
    "listener_id" "uuid" NOT NULL,
    "listener_name" "text" NOT NULL,
    "listener_stripe_id" "text"
);


ALTER TABLE "public"."listeners_profile" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payer" (
    "payer_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payer_type" "text" NOT NULL,
    "fee" bigint NOT NULL
);


ALTER TABLE "public"."payer" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."play_event" (
    "event_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "played_date" timestamp with time zone NOT NULL,
    "track_id" "uuid" NOT NULL,
    "duration_played" numeric(8,3) NOT NULL,
    "playlist" "uuid",
    "payer_id" "uuid" NOT NULL
);


ALTER TABLE "public"."play_event" OWNER TO "postgres";


COMMENT ON TABLE "public"."play_event" IS 'Registers information about each play of each song.';



CREATE TABLE IF NOT EXISTS "public"."track" (
    "track_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "release" "uuid",
    "title" "text" NOT NULL,
    "artist_id" "uuid" NOT NULL,
    "duration_seconds" numeric(8,3)
);


ALTER TABLE "public"."track" OWNER TO "postgres";


COMMENT ON TABLE "public"."track" IS 'Contains individual tracks. Later tracks will belong to another table with the release (e.g. album, EP)';



COMMENT ON COLUMN "public"."track"."duration_seconds" IS 'Song length in seconds';



CREATE TABLE IF NOT EXISTS "public"."track_artists" (
    "track_id" "uuid" NOT NULL,
    "artist_id" "uuid" NOT NULL,
    "split_pct" numeric
);


ALTER TABLE "public"."track_artists" OWNER TO "postgres";


COMMENT ON TABLE "public"."track_artists" IS 'Contains info about the artists who contribute to a track, and their split';



CREATE OR REPLACE VIEW "public"."payment_calc" WITH ("security_invoker"='on') AS
 WITH "config" AS (
         SELECT "run_config"."value" AS "seed"
           FROM "public"."run_config"
          WHERE ("run_config"."key" = 'tiebreak_seed'::"text")
        ), "setup" AS (
         SELECT "to_char"(("e"."played_date" AT TIME ZONE 'Australia/Perth'::"text"), 'YYYY-MM'::"text") AS "month",
            "e"."track_id",
            "e"."payer_id" AS "played_by",
            (COALESCE("sum"((LEAST("e"."duration_played", "t"."duration_seconds") * (1000)::numeric)) FILTER (WHERE ("e"."duration_played" >= (30)::numeric)), (0)::numeric))::bigint AS "eligible_duration_ms",
            NULLIF(("sum"("sum"((LEAST("e"."duration_played", "t"."duration_seconds") * (1000)::numeric)) FILTER (WHERE ("e"."duration_played" >= (30)::numeric))) OVER (PARTITION BY "e"."payer_id", ("to_char"(("e"."played_date" AT TIME ZONE 'Australia/Perth'::"text"), 'YYYY-MM'::"text"))))::bigint, 0) AS "payer_total_duration_ms",
            ((("p"."fee")::numeric - "round"(((("p"."fee")::numeric * 0.0165) + (30)::numeric))))::bigint AS "net_revenue_cents"
           FROM (("public"."play_event" "e"
             LEFT JOIN "public"."payer" "p" ON (("e"."payer_id" = "p"."payer_id")))
             JOIN "public"."track" "t" ON (("e"."track_id" = "t"."track_id")))
          GROUP BY "e"."payer_id", "e"."track_id", "p"."fee", ("to_char"(("e"."played_date" AT TIME ZONE 'Australia/Perth'::"text"), 'YYYY-MM'::"text"))
        ), "payer_months" AS (
         SELECT DISTINCT "setup"."month",
            "setup"."played_by",
            "setup"."net_revenue_cents",
            ("setup"."payer_total_duration_ms" IS NOT NULL) AS "has_streams"
           FROM "setup"
        ), "split_shares" AS (
         SELECT "pm"."month",
            "pm"."played_by",
            "pm"."net_revenue_cents",
            "pm"."has_streams",
            "b"."bucket",
            (("pm"."net_revenue_cents" * "b"."pct") / 100) AS "floor_cents",
            (("pm"."net_revenue_cents" * "b"."pct") % (100)::bigint) AS "remainder",
            "b"."ord"
           FROM ("payer_months" "pm"
             JOIN ( VALUES ('artists'::"text",70,1,true), ('industry'::"text",15,2,true), ('licence'::"text",2,3,true), ('operations'::"text",13,4,true), ('artists'::"text",0,1,false), ('industry'::"text",85,2,false), ('licence'::"text",2,3,false), ('operations'::"text",13,4,false)) "b"("bucket", "pct", "ord", "has_streams") ON (("b"."has_streams" = "pm"."has_streams")))
        ), "split_ranked" AS (
         SELECT "split_shares"."month",
            "split_shares"."played_by",
            "split_shares"."net_revenue_cents",
            "split_shares"."has_streams",
            "split_shares"."bucket",
            "split_shares"."floor_cents",
            "split_shares"."remainder",
            "split_shares"."ord",
            (("split_shares"."net_revenue_cents")::numeric - "sum"("split_shares"."floor_cents") OVER (PARTITION BY "split_shares"."played_by", "split_shares"."month")) AS "leftover_cents",
            "row_number"() OVER (PARTITION BY "split_shares"."played_by", "split_shares"."month" ORDER BY "split_shares"."remainder" DESC, ("md5"((((( SELECT "config"."seed"
                   FROM "config") || ("split_shares"."played_by")::"text") || "split_shares"."month") || "split_shares"."bucket")))) AS "rank"
           FROM "split_shares"
        ), "splits" AS (
         SELECT "split_ranked"."month",
            "split_ranked"."played_by",
            ("sum"(("split_ranked"."floor_cents" +
                CASE
                    WHEN (("split_ranked"."rank")::numeric <= "split_ranked"."leftover_cents") THEN 1
                    ELSE 0
                END)) FILTER (WHERE ("split_ranked"."bucket" = 'artists'::"text")))::bigint AS "artists_cents",
            ("sum"(("split_ranked"."floor_cents" +
                CASE
                    WHEN (("split_ranked"."rank")::numeric <= "split_ranked"."leftover_cents") THEN 1
                    ELSE 0
                END)) FILTER (WHERE ("split_ranked"."bucket" = 'industry'::"text")))::bigint AS "industry_cents",
            ("sum"(("split_ranked"."floor_cents" +
                CASE
                    WHEN (("split_ranked"."rank")::numeric <= "split_ranked"."leftover_cents") THEN 1
                    ELSE 0
                END)) FILTER (WHERE ("split_ranked"."bucket" = 'licence'::"text")))::bigint AS "licence_cents",
            ("sum"(("split_ranked"."floor_cents" +
                CASE
                    WHEN (("split_ranked"."rank")::numeric <= "split_ranked"."leftover_cents") THEN 1
                    ELSE 0
                END)) FILTER (WHERE ("split_ranked"."bucket" = 'operations'::"text")))::bigint AS "operations_cents"
           FROM "split_ranked"
          GROUP BY "split_ranked"."month", "split_ranked"."played_by"
        ), "pools" AS (
         SELECT "splits"."month",
            "splits"."played_by",
            ("splits"."artists_cents" * 10000) AS "pool_cents"
           FROM "splits"
        ), "shares" AS (
         SELECT "s"."month",
            "s"."track_id",
            "s"."played_by",
            "s"."eligible_duration_ms",
            "s"."payer_total_duration_ms",
            "s"."net_revenue_cents",
            "p"."pool_cents",
            (("p"."pool_cents" * "s"."eligible_duration_ms") / "s"."payer_total_duration_ms") AS "floor_cents",
            (("p"."pool_cents" * "s"."eligible_duration_ms") % "s"."payer_total_duration_ms") AS "remainder"
           FROM ("setup" "s"
             JOIN "pools" "p" ON ((("p"."month" = "s"."month") AND ("p"."played_by" = "s"."played_by"))))
        ), "ranked" AS (
         SELECT "shares"."month",
            "shares"."track_id",
            "shares"."played_by",
            "shares"."eligible_duration_ms",
            "shares"."payer_total_duration_ms",
            "shares"."net_revenue_cents",
            "shares"."pool_cents",
            "shares"."floor_cents",
            "shares"."remainder",
            (("shares"."pool_cents")::numeric - "sum"("shares"."floor_cents") OVER (PARTITION BY "shares"."played_by", "shares"."month")) AS "leftover_cents",
            "row_number"() OVER (PARTITION BY "shares"."played_by", "shares"."month" ORDER BY "shares"."remainder" DESC, ("md5"((((( SELECT "config"."seed"
                   FROM "config") || ("shares"."played_by")::"text") || "shares"."month") || ("shares"."track_id")::"text")))) AS "rank"
           FROM "shares"
        ), "song_pay" AS (
         SELECT "r"."month",
            "r"."track_id",
            "r"."played_by",
            "r"."eligible_duration_ms",
            "r"."payer_total_duration_ms",
            COALESCE(("r"."floor_cents" +
                CASE
                    WHEN (("r"."rank")::numeric <= "r"."leftover_cents") THEN 1
                    ELSE 0
                END), (0)::bigint) AS "song_payment",
            "r"."net_revenue_cents",
            "sp"."artists_cents",
            "sp"."industry_cents",
            "sp"."licence_cents",
            "sp"."operations_cents"
           FROM ("ranked" "r"
             JOIN "splits" "sp" ON ((("sp"."month" = "r"."month") AND ("sp"."played_by" = "r"."played_by"))))
        ), "artist_w" AS (
         SELECT "s"."month",
            "s"."track_id",
            "s"."played_by",
            "s"."eligible_duration_ms",
            "s"."payer_total_duration_ms",
            "s"."song_payment",
            "s"."net_revenue_cents",
            "s"."artists_cents",
            "s"."industry_cents",
            "s"."licence_cents",
            "s"."operations_cents",
            "ta"."artist_id",
                CASE
                    WHEN ("bool_and"(("ta"."split_pct" IS NOT NULL)) OVER (PARTITION BY "s"."month", "s"."played_by", "s"."track_id") AND ("sum"("ta"."split_pct") OVER (PARTITION BY "s"."month", "s"."played_by", "s"."track_id") > (0)::numeric)) THEN "ta"."split_pct"
                    ELSE (1)::numeric
                END AS "wt"
           FROM ("song_pay" "s"
             JOIN "public"."track_artists" "ta" ON (("ta"."track_id" = "s"."track_id")))
        ), "artist_raw" AS (
         SELECT "artist_w"."month",
            "artist_w"."track_id",
            "artist_w"."played_by",
            "artist_w"."eligible_duration_ms",
            "artist_w"."payer_total_duration_ms",
            "artist_w"."song_payment",
            "artist_w"."net_revenue_cents",
            "artist_w"."artists_cents",
            "artist_w"."industry_cents",
            "artist_w"."licence_cents",
            "artist_w"."operations_cents",
            "artist_w"."artist_id",
            "artist_w"."wt",
            ((("artist_w"."song_payment")::numeric * "artist_w"."wt") / "sum"("artist_w"."wt") OVER (PARTITION BY "artist_w"."month", "artist_w"."played_by", "artist_w"."track_id")) AS "exact"
           FROM "artist_w"
        ), "artist_ranked" AS (
         SELECT "artist_raw"."month",
            "artist_raw"."track_id",
            "artist_raw"."played_by",
            "artist_raw"."eligible_duration_ms",
            "artist_raw"."payer_total_duration_ms",
            "artist_raw"."song_payment",
            "artist_raw"."net_revenue_cents",
            "artist_raw"."artists_cents",
            "artist_raw"."industry_cents",
            "artist_raw"."licence_cents",
            "artist_raw"."operations_cents",
            "artist_raw"."artist_id",
            "artist_raw"."wt",
            "artist_raw"."exact",
            ("floor"("artist_raw"."exact"))::bigint AS "base",
            "row_number"() OVER (PARTITION BY "artist_raw"."month", "artist_raw"."played_by", "artist_raw"."track_id" ORDER BY ("artist_raw"."exact" - "floor"("artist_raw"."exact")) DESC, ("md5"(((((( SELECT "config"."seed"
                   FROM "config") || ("artist_raw"."played_by")::"text") || "artist_raw"."month") || ("artist_raw"."track_id")::"text") || ("artist_raw"."artist_id")::"text")))) AS "rk",
            (("artist_raw"."song_payment")::numeric - "sum"(("floor"("artist_raw"."exact"))::bigint) OVER (PARTITION BY "artist_raw"."month", "artist_raw"."played_by", "artist_raw"."track_id")) AS "extra"
           FROM "artist_raw"
        )
 SELECT "month",
    "track_id",
    "played_by",
    "eligible_duration_ms",
    "payer_total_duration_ms",
    ("base" +
        CASE
            WHEN (("rk")::numeric <= "extra") THEN 1
            ELSE 0
        END) AS "song_payment",
    "net_revenue_cents",
    "artists_cents",
    "industry_cents",
    "licence_cents",
    "operations_cents",
    "artist_id"
   FROM "artist_ranked";


ALTER VIEW "public"."payment_calc" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."payer_split" WITH ("security_invoker"='on') AS
 SELECT DISTINCT "month",
    "played_by",
    "net_revenue_cents",
    "artists_cents",
    "industry_cents",
    "licence_cents",
    "operations_cents",
    ("net_revenue_cents" - ((("artists_cents" + "industry_cents") + "licence_cents") + "operations_cents")) AS "unallocated_cents"
   FROM "public"."payment_calc";


ALTER VIEW "public"."payer_split" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payout" (
    "payout_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "month" "text",
    "artist_id" "uuid" NOT NULL,
    "payout_type" "text" NOT NULL,
    "status" "text",
    "ledger_entry_id" "uuid" NOT NULL,
    "payout_value_cents" bigint NOT NULL,
    "public_name" "text",
    "payout_transfer_id" "text",
    "error" "text"
);


ALTER TABLE "public"."payout" OWNER TO "postgres";


ALTER TABLE ONLY "public"."artist_payment_account"
    ADD CONSTRAINT "artist_bank_account_pkey" PRIMARY KEY ("artist_id");



ALTER TABLE ONLY "public"."artist_profile"
    ADD CONSTRAINT "artist_profile_pkey" PRIMARY KEY ("artist_id");



ALTER TABLE ONLY "public"."business_and_site"
    ADD CONSTRAINT "business_and_site_pkey" PRIMARY KEY ("site_id");



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_pkey" PRIMARY KEY ("entry_id");



ALTER TABLE ONLY "public"."listeners_profile"
    ADD CONSTRAINT "listeners_pkey" PRIMARY KEY ("listener_id");



ALTER TABLE ONLY "public"."payer"
    ADD CONSTRAINT "payer_id_pkey" PRIMARY KEY ("payer_id");



ALTER TABLE ONLY "public"."payout"
    ADD CONSTRAINT "payout_one_per_artist_month_type" UNIQUE ("artist_id", "month", "payout_type");



ALTER TABLE ONLY "public"."payout"
    ADD CONSTRAINT "payout_pkey" PRIMARY KEY ("payout_id");



ALTER TABLE ONLY "public"."play_event"
    ADD CONSTRAINT "play_event_pkey" PRIMARY KEY ("event_id");



ALTER TABLE ONLY "public"."run_config"
    ADD CONSTRAINT "run_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."track_artists"
    ADD CONSTRAINT "track_artists_pkey" PRIMARY KEY ("track_id", "artist_id");



ALTER TABLE ONLY "public"."track"
    ADD CONSTRAINT "track_pkey" PRIMARY KEY ("track_id");



CREATE UNIQUE INDEX "ledger_one_per_account_month" ON "public"."ledger" USING "btree" ("account_category", COALESCE("artist_id", '00000000-0000-0000-0000-000000000000'::"uuid"), "month") WHERE ("entry_type" = 'distribution'::"text");



ALTER TABLE ONLY "public"."artist_payment_account"
    ADD CONSTRAINT "artist_bank_account_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artist_profile"("artist_id");



ALTER TABLE ONLY "public"."business_and_site"
    ADD CONSTRAINT "business_and_site_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."payer"("payer_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artist_profile"("artist_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."listeners_profile"
    ADD CONSTRAINT "listeners_profile_listener_id_fkey" FOREIGN KEY ("listener_id") REFERENCES "public"."payer"("payer_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payout"
    ADD CONSTRAINT "payout_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artist_profile"("artist_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payout"
    ADD CONSTRAINT "payout_ledger_entry_id_fkey" FOREIGN KEY ("ledger_entry_id") REFERENCES "public"."ledger"("entry_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."play_event"
    ADD CONSTRAINT "play_event_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("payer_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."play_event"
    ADD CONSTRAINT "play_event_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."track"("track_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."track"
    ADD CONSTRAINT "track_artist_id_temp_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artist_profile"("artist_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."track_artists"
    ADD CONSTRAINT "track_artists_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artist_profile"("artist_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."track_artists"
    ADD CONSTRAINT "track_artists_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."track"("track_id") ON UPDATE CASCADE ON DELETE RESTRICT;



CREATE POLICY "artist reads own profile" ON "public"."artist_profile" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."artist_payment_account" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artist_profile" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_and_site" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ledger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listeners_profile" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payer" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payout" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."play_event" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."run_config" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "signed-in read" ON "public"."business_and_site" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "signed-in read" ON "public"."payer" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "signed-in read" ON "public"."play_event" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "signed-in read" ON "public"."track" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."track" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."track_artists" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."complete_payout"("p_transfer_id" "text", "p_result" "text", "p_error" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."complete_payout"("p_transfer_id" "text", "p_result" "text", "p_error" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."monthly_run"() TO "anon";
GRANT ALL ON FUNCTION "public"."monthly_run"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."monthly_run"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON TABLE "public"."artist_profile" TO "anon";
GRANT ALL ON TABLE "public"."artist_profile" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_profile" TO "service_role";



GRANT ALL ON TABLE "public"."ledger" TO "anon";
GRANT ALL ON TABLE "public"."ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."ledger" TO "service_role";



GRANT ALL ON TABLE "public"."run_config" TO "anon";
GRANT ALL ON TABLE "public"."run_config" TO "authenticated";
GRANT ALL ON TABLE "public"."run_config" TO "service_role";



GRANT ALL ON TABLE "public"."artist_balance" TO "anon";
GRANT ALL ON TABLE "public"."artist_balance" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_balance" TO "service_role";



GRANT ALL ON TABLE "public"."artist_payment_account" TO "anon";
GRANT ALL ON TABLE "public"."artist_payment_account" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_payment_account" TO "service_role";



GRANT ALL ON TABLE "public"."business_and_site" TO "anon";
GRANT ALL ON TABLE "public"."business_and_site" TO "authenticated";
GRANT ALL ON TABLE "public"."business_and_site" TO "service_role";



GRANT ALL ON TABLE "public"."listeners_profile" TO "anon";
GRANT ALL ON TABLE "public"."listeners_profile" TO "authenticated";
GRANT ALL ON TABLE "public"."listeners_profile" TO "service_role";



GRANT ALL ON TABLE "public"."payer" TO "anon";
GRANT ALL ON TABLE "public"."payer" TO "authenticated";
GRANT ALL ON TABLE "public"."payer" TO "service_role";



GRANT ALL ON TABLE "public"."play_event" TO "anon";
GRANT ALL ON TABLE "public"."play_event" TO "authenticated";
GRANT ALL ON TABLE "public"."play_event" TO "service_role";



GRANT ALL ON TABLE "public"."track" TO "anon";
GRANT ALL ON TABLE "public"."track" TO "authenticated";
GRANT ALL ON TABLE "public"."track" TO "service_role";



GRANT ALL ON TABLE "public"."track_artists" TO "anon";
GRANT ALL ON TABLE "public"."track_artists" TO "authenticated";
GRANT ALL ON TABLE "public"."track_artists" TO "service_role";



GRANT ALL ON TABLE "public"."payment_calc" TO "anon";
GRANT ALL ON TABLE "public"."payment_calc" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_calc" TO "service_role";



GRANT ALL ON TABLE "public"."payer_split" TO "anon";
GRANT ALL ON TABLE "public"."payer_split" TO "authenticated";
GRANT ALL ON TABLE "public"."payer_split" TO "service_role";



GRANT ALL ON TABLE "public"."payout" TO "anon";
GRANT ALL ON TABLE "public"."payout" TO "authenticated";
GRANT ALL ON TABLE "public"."payout" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";








-- The remote database has this revoked; local default privileges would grant it.
REVOKE ALL ON FUNCTION "public"."complete_payout"("p_transfer_id" "text", "p_result" "text", "p_error" "text") FROM "anon", "authenticated";
