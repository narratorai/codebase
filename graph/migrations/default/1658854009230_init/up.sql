SET check_function_bodies = false;
CREATE SCHEMA audit;
COMMENT ON SCHEMA audit IS 'Out-of-table audit/history logging tables and trigger functions';
CREATE FUNCTION audit.audit_table(target_table regclass) RETURNS void
    LANGUAGE sql
    AS $_$
SELECT audit.audit_table($1, BOOLEAN 't', BOOLEAN 't');
$_$;
COMMENT ON FUNCTION audit.audit_table(target_table regclass) IS '
Add auditing support to the given table. Row-level changes will be logged with full client query text. No cols are ignored.
';
CREATE FUNCTION audit.audit_table(target_table regclass, audit_rows boolean, audit_query_text boolean) RETURNS void
    LANGUAGE sql
    AS $_$
SELECT audit.audit_table($1, $2, $3, ARRAY[]::text[]);
$_$;
CREATE FUNCTION audit.audit_table(target_table regclass, audit_rows boolean, audit_query_text boolean, ignored_cols text[]) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  stm_targets text = 'INSERT OR UPDATE OR DELETE OR TRUNCATE';
  _q_txt text;
  _ignored_cols_snip text = '';
BEGIN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_row ON ' || target_table;
    EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_stm ON ' || target_table;
    IF audit_rows THEN
        IF array_length(ignored_cols,1) > 0 THEN
            _ignored_cols_snip = ', ' || quote_literal(ignored_cols);
        END IF;
        _q_txt = 'CREATE TRIGGER audit_trigger_row AFTER INSERT OR UPDATE OR DELETE ON ' ||
                 target_table ||
                 ' FOR EACH ROW EXECUTE PROCEDURE audit.if_modified_func(' ||
                 quote_literal(audit_query_text) || _ignored_cols_snip || ');';
        RAISE NOTICE '%',_q_txt;
        EXECUTE _q_txt;
        stm_targets = 'TRUNCATE';
    ELSE
    END IF;
    _q_txt = 'CREATE TRIGGER audit_trigger_stm AFTER ' || stm_targets || ' ON ' ||
             target_table ||
             ' FOR EACH STATEMENT EXECUTE PROCEDURE audit.if_modified_func('||
             quote_literal(audit_query_text) || ');';
    RAISE NOTICE '%',_q_txt;
    EXECUTE _q_txt;
END;
$$;
COMMENT ON FUNCTION audit.audit_table(target_table regclass, audit_rows boolean, audit_query_text boolean, ignored_cols text[]) IS '
Add auditing support to a table.
Arguments:
   target_table:     Table name, schema qualified if not on search_path
   audit_rows:       Record each row change, or only audit at a statement level
   audit_query_text: Record the text of the client query that triggered the audit event?
   ignored_cols:     Columns to exclude from update diffs, ignore updates that change only ignored cols.
';
CREATE FUNCTION audit.if_modified_func() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
DECLARE
    audit_row audit.logged_actions;
    excluded_cols text[] = ARRAY[]::text[];
    new_r jsonb;
    old_r jsonb;
BEGIN
    IF TG_WHEN <> 'AFTER' THEN
        RAISE EXCEPTION 'audit.if_modified_func() may only run as an AFTER trigger';
    END IF;
    audit_row = ROW(
        nextval('audit.logged_actions_event_id_seq'), -- event_id
        TG_TABLE_SCHEMA::text,                        -- schema_name
        TG_TABLE_NAME::text,                          -- table_name
        TG_RELID,                                     -- relation OID for much quicker searches
        session_user::text,                           -- session_user_name
        current_setting('hasura.user', 't')::jsonb,   -- user information from hasura graphql engine
        current_timestamp,                            -- action_tstamp_tx
        statement_timestamp(),                        -- action_tstamp_stm
        clock_timestamp(),                            -- action_tstamp_clk
        txid_current(),                               -- transaction ID
        current_setting('application_name'),          -- client application
        inet_client_addr(),                           -- client_addr
        inet_client_port(),                           -- client_port
        current_query(),                              -- top-level query or queries (if multistatement) from client
        substring(TG_OP,1,1),                         -- action
        NULL, NULL,                                   -- row_data, changed_fields
        'f'                                           -- statement_only
        );
    IF NOT TG_ARGV[0]::boolean IS DISTINCT FROM 'f'::boolean THEN
        audit_row.client_query = NULL;
    END IF;
    IF TG_ARGV[1] IS NOT NULL THEN
        excluded_cols = TG_ARGV[1]::text[];
    END IF;
    IF (TG_OP = 'UPDATE' AND TG_LEVEL = 'ROW') THEN
        old_r = to_jsonb(OLD);
        new_r = to_jsonb(NEW);
        audit_row.row_data = old_r - excluded_cols;
        SELECT
          jsonb_object_agg(new_t.key, new_t.value) - excluded_cols
        INTO
          audit_row.changed_fields
        FROM jsonb_each(old_r) as old_t
        JOIN jsonb_each(new_r) as new_t
          ON (old_t.key = new_t.key AND old_t.value <> new_t.value);
    ELSIF (TG_OP = 'DELETE' AND TG_LEVEL = 'ROW') THEN
        audit_row.row_data = to_jsonb(OLD) - excluded_cols;
    ELSIF (TG_OP = 'INSERT' AND TG_LEVEL = 'ROW') THEN
        audit_row.row_data = to_jsonb(NEW) - excluded_cols;
    ELSIF (TG_LEVEL = 'STATEMENT' AND TG_OP IN ('INSERT','UPDATE','DELETE','TRUNCATE')) THEN
        audit_row.statement_only = 't';
    ELSE
        RAISE EXCEPTION '[audit.if_modified_func] - Trigger func added as trigger for unhandled case: %, %',TG_OP, TG_LEVEL;
        RETURN NULL;
    END IF;
    INSERT INTO audit.logged_actions VALUES (audit_row.*);
    RETURN NULL;
END;
$$;
COMMENT ON FUNCTION audit.if_modified_func() IS '
Track changes to a table at the statement and/or row level.
Optional parameters to trigger in CREATE TRIGGER call:
param 0: boolean, whether to log the query text. Default ''t''.
param 1: text[], columns to ignore in updates. Default [].
         Updates to ignored cols are omitted from changed_fields.
         Updates with only ignored cols changed are not inserted
         into the audit log.
         Almost all the processing work is still done for updates
         that ignored. If you need to save the load, you need to use
         WHEN clause on the trigger instead.
         No warning or error is issued if ignored_cols contains columns
         that do not exist in the target table. This lets you specify
         a standard set of ignored columns.
There is no parameter to disable logging of values. Add this trigger as
a ''FOR EACH STATEMENT'' rather than ''FOR EACH ROW'' trigger if you do not
want to log row values.
Note that the user name logged is the login role for the session. The audit trigger
cannot obtain the active role because it is reset by the SECURITY DEFINER invocation
of the audit trigger its self.
';
CREATE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$;
CREATE FUNCTION public.trigger_is_running_on_task_execution() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Set the is_running flag based on the presence of completed at
  IF NEW.completed_at IS NULL THEN
    NEW.is_running = True;
  ELSE
    NEW.is_running = NULL;
  END IF;
  -- Return the NEW record so that update can carry on as usual
  RETURN NEW;
END; $$;
CREATE TABLE audit.logged_actions (
    event_id bigint NOT NULL,
    schema_name text NOT NULL,
    table_name text NOT NULL,
    relid oid NOT NULL,
    session_user_name text,
    hasura_user jsonb,
    action_tstamp_tx timestamp with time zone NOT NULL,
    action_tstamp_stm timestamp with time zone NOT NULL,
    action_tstamp_clk timestamp with time zone NOT NULL,
    transaction_id bigint,
    application_name text,
    client_addr inet,
    client_port integer,
    client_query text,
    action text NOT NULL,
    row_data jsonb,
    changed_fields jsonb,
    statement_only boolean NOT NULL,
    CONSTRAINT logged_actions_action_check CHECK ((action = ANY (ARRAY['I'::text, 'D'::text, 'U'::text, 'T'::text])))
);
COMMENT ON TABLE audit.logged_actions IS 'History of auditable actions on audited tables, from audit.if_modified_func()';
COMMENT ON COLUMN audit.logged_actions.event_id IS 'Unique identifier for each auditable event';
COMMENT ON COLUMN audit.logged_actions.schema_name IS 'Database schema audited table for this event is in';
COMMENT ON COLUMN audit.logged_actions.table_name IS 'Non-schema-qualified table name of table event occured in';
COMMENT ON COLUMN audit.logged_actions.relid IS 'Table OID. Changes with drop/create. Get with ''tablename''::regclass';
COMMENT ON COLUMN audit.logged_actions.session_user_name IS 'Login / session user whose statement caused the audited event';
COMMENT ON COLUMN audit.logged_actions.action_tstamp_tx IS 'Transaction start timestamp for tx in which audited event occurred';
COMMENT ON COLUMN audit.logged_actions.action_tstamp_stm IS 'Statement start timestamp for tx in which audited event occurred';
COMMENT ON COLUMN audit.logged_actions.action_tstamp_clk IS 'Wall clock time at which audited event''s trigger call occurred';
COMMENT ON COLUMN audit.logged_actions.transaction_id IS 'Identifier of transaction that made the change. May wrap, but unique paired with action_tstamp_tx.';
COMMENT ON COLUMN audit.logged_actions.application_name IS 'Application name set when this audit event occurred. Can be changed in-session by client.';
COMMENT ON COLUMN audit.logged_actions.client_addr IS 'IP address of client that issued query. Null for unix domain socket.';
COMMENT ON COLUMN audit.logged_actions.client_port IS 'Remote peer IP port address of client that issued query. Undefined for unix socket.';
COMMENT ON COLUMN audit.logged_actions.client_query IS 'Top-level query that caused this auditable event. May be more than one statement.';
COMMENT ON COLUMN audit.logged_actions.action IS 'Action type; I = insert, D = delete, U = update, T = truncate';
COMMENT ON COLUMN audit.logged_actions.row_data IS 'Record value. Null for statement-level trigger. For INSERT this is the new tuple. For DELETE and UPDATE it is the old tuple.';
COMMENT ON COLUMN audit.logged_actions.changed_fields IS 'New values of fields changed by UPDATE. Null except for row-level UPDATE events.';
COMMENT ON COLUMN audit.logged_actions.statement_only IS '''t'' if audit event is from an FOR EACH STATEMENT trigger, ''f'' for FOR EACH ROW';
CREATE SEQUENCE audit.logged_actions_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE audit.logged_actions_event_id_seq OWNED BY audit.logged_actions.event_id;
CREATE TABLE public.activity (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    slug text NOT NULL,
    name text,
    status text DEFAULT 'live'::text NOT NULL,
    company_id uuid NOT NULL,
    description text,
    table_id uuid,
    validated boolean DEFAULT false NOT NULL,
    category text,
    last_indexed_at timestamp with time zone,
    next_index_at timestamp with time zone,
    updated_by text,
    time_plots text DEFAULT 'month'::text,
    feature_distributions text,
    sensitive_name_alternative text,
    category_id uuid,
    maintenance_started_at timestamp with time zone,
    maintenance_ended_at timestamp with time zone,
    maintainer_id uuid,
    row_count integer
);
COMMENT ON TABLE public.activity IS 'Activities. Belong to one company, and one or more scripts.';
COMMENT ON COLUMN public.activity.category IS 'TO DEPRECATE';
COMMENT ON COLUMN public.activity.updated_by IS 'Is a text not an id because different systems can also update it.';
COMMENT ON COLUMN public.activity.time_plots IS 'Testing a feature for context, so might change this structure to be an enum join';
COMMENT ON COLUMN public.activity.feature_distributions IS 'Testing a feature for context, so might change this structure to be an enum join';
CREATE TABLE public.column_renames (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    label text,
    type text NOT NULL,
    casting text,
    description text,
    related_to text NOT NULL,
    related_to_id uuid NOT NULL,
    has_data boolean DEFAULT true NOT NULL,
    sensitive_label_alternative text
);
CREATE VIEW public.activity_column_renames AS
 SELECT column_renames.id,
    column_renames.created_at,
    column_renames.updated_at,
    column_renames.name,
    column_renames.label,
    column_renames.type,
    column_renames.casting,
    column_renames.description,
    column_renames.related_to,
    column_renames.related_to_id,
    column_renames.has_data
   FROM public.column_renames
  WHERE (column_renames.related_to = 'activity'::text);
CREATE TABLE public.company_timeline (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    related_to text NOT NULL,
    related_to_id uuid NOT NULL,
    happened_at date NOT NULL,
    name text NOT NULL,
    description text
);
CREATE VIEW public.activity_company_timelines AS
 SELECT company_timeline.id,
    company_timeline.created_at,
    company_timeline.updated_at,
    company_timeline.related_to,
    company_timeline.related_to_id,
    company_timeline.happened_at,
    company_timeline.name,
    company_timeline.description
   FROM public.company_timeline
  WHERE (company_timeline.related_to = 'activity'::text);
CREATE TABLE public.activity_maintenance (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone,
    activity_id uuid NOT NULL,
    kind text NOT NULL,
    notes text
);
CREATE TABLE public.question_answer (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    question text NOT NULL,
    answer text,
    answered_by text NOT NULL,
    related_to text NOT NULL,
    related_id uuid NOT NULL,
    updated_by uuid
);
CREATE VIEW public.activity_questions AS
 SELECT s.id,
    s.created_at,
    s.updated_at,
    s.question,
    s.answer,
    s.answered_by,
    s.related_id AS activity_id
   FROM public.question_answer s
  WHERE (s.related_to = 'activity'::text);
CREATE TABLE public.activity_status (
    value text NOT NULL,
    description text
);
COMMENT ON TABLE public.activity_status IS 'Enum table for activity status';
CREATE TABLE public.tag (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tag_id uuid NOT NULL,
    related_to text NOT NULL,
    related_id uuid NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.tag IS 'this is the relationship to all the objects for tags';
CREATE VIEW public.activity_tags AS
 SELECT tag.id,
    tag.created_at,
    tag.tag_id,
    tag.related_id AS activity_id
   FROM public.tag
  WHERE (tag.related_to = 'activity'::text);
CREATE TABLE public.adhoc_execution (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid NOT NULL,
    script text NOT NULL,
    script_args text,
    details jsonb DEFAULT jsonb_build_object() NOT NULL
);
COMMENT ON TABLE public.adhoc_execution IS 'Adhoc / one-off script executions';
CREATE TABLE public.column_rename_relations (
    value text NOT NULL,
    description text
);
CREATE TABLE public.company (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    slug text NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    s3_bucket text,
    name text,
    website text,
    staging_schema text DEFAULT 'dw_stage'::text,
    production_schema text DEFAULT 'narrator'::text,
    materialize_schema text DEFAULT 'narrator_mv'::text,
    core_version text DEFAULT 'v4'::text NOT NULL,
    batch_version text DEFAULT 'v2'::text NOT NULL,
    warehouse_language text DEFAULT 'redshift'::text NOT NULL,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    cache_minutes integer DEFAULT 180 NOT NULL,
    index_warehouse_count integer DEFAULT 0 NOT NULL,
    delete_prefix text,
    refund_prefix text,
    start_data_on date,
    currency_start_date date DEFAULT to_date('2018-01-01'::text, 'YYYY-MM-DD'::text) NOT NULL,
    spend_table text,
    currency_used text,
    max_inserts integer DEFAULT 5000000 NOT NULL,
    project_id text,
    batch_halt boolean DEFAULT false NOT NULL,
    redash_api_key text,
    redash_datasource_id integer,
    redash_admin_datasource_id integer,
    use_temporary_tables boolean DEFAULT false,
    update_wlm_count integer,
    select_wlm_count integer,
    created_by uuid,
    demo_company boolean DEFAULT false,
    created_for uuid,
    removed_at timestamp with time zone,
    skip_automated_archive boolean DEFAULT false,
    logo_url text,
    branding_color text,
    fivetran_destination_id text,
    warehouse_default_schemas text,
    batch_halted_by uuid,
    batch_halted_at date,
    ignore_in_reporting boolean DEFAULT false,
    agreed_to_contract_date date,
    validation_months integer,
    plot_colors text,
    dataset_row_threshold integer,
    dataset_default_filter_months integer,
    dataset_default_filter_days integer,
    CONSTRAINT valid_branding_color CHECK (((branding_color IS NULL) OR (branding_color ~* '^#[a-f0-9]{6}$'::text))),
    CONSTRAINT valid_dataset_default_filter_days CHECK (((dataset_default_filter_days IS NULL) OR ((dataset_default_filter_days >= 0) AND (dataset_default_filter_days <= 1400)))),
    CONSTRAINT valid_dataset_row_threshold CHECK (((dataset_row_threshold IS NULL) OR ((dataset_row_threshold >= 0) AND (dataset_row_threshold < 1000)))),
    CONSTRAINT valid_logo_url CHECK (((logo_url IS NULL) OR (logo_url ~* 'https:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,255}\.[a-z]{2,9}\y([-a-zA-Z0-9@:%_\+.~#?&//=]*)$'::text))),
    CONSTRAINT valid_slug CHECK (((char_length(slug) <= 64) AND (slug ~ '^[a-z][a-z0-9-]*[a-z0-9]$'::text)))
);
COMMENT ON TABLE public.company IS 'Companies on the platform';
COMMENT ON COLUMN public.company.s3_bucket IS 'Data bucket for the company, created during onboarding. DEPRECATED moving to company_resources';
COMMENT ON COLUMN public.company.name IS 'Display name for the company';
COMMENT ON COLUMN public.company.staging_schema IS 'DEPRECATED';
COMMENT ON COLUMN public.company.redash_api_key IS 'DEPRECATED moving to company_resources';
COMMENT ON COLUMN public.company.redash_datasource_id IS 'DEPRECATED moving to company_resources';
COMMENT ON COLUMN public.company.redash_admin_datasource_id IS 'DEPRECATED moving to company_resources';
COMMENT ON COLUMN public.company.use_temporary_tables IS 'This is for how the run_transformation updates the data.  It is a flag because it uses more storage than compute';
COMMENT ON COLUMN public.company.created_by IS 'Who created the company';
COMMENT ON COLUMN public.company.created_for IS 'Used if the company was created for someone other than the created_by';
COMMENT ON COLUMN public.company.removed_at IS 'The timestamp at which the company-archiver finished removing this company''s resources and data';
COMMENT ON COLUMN public.company.skip_automated_archive IS 'While this is true, the company-archiver will skip cleaning up this company';
COMMENT ON COLUMN public.company.warehouse_default_schemas IS 'Will hide all schemas from the schema mini map that is not in here (if null then all schemas will show)';
COMMENT ON COLUMN public.company.validation_months IS 'The number of months to validate the data when pushing to prod';
COMMENT ON COLUMN public.company.dataset_row_threshold IS '# of millions of rows that when exceeded we will auto-apply filter';
COMMENT ON COLUMN public.company.dataset_default_filter_months IS 'DEPRECATING FOR the dataset_default_filter_days';
COMMENT ON COLUMN public.company.dataset_default_filter_days IS 'default number of days to filter the dataset if we expect more than the dataset row limit threshold';
CREATE TABLE public.company_categories (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    category text NOT NULL,
    company_id uuid NOT NULL,
    color text
);
CREATE TABLE public.company_config_batch_version (
    value text NOT NULL,
    description text
);
COMMENT ON TABLE public.company_config_batch_version IS 'Enum table for company_config.batch_version';
CREATE TABLE public.company_config_core_version (
    value text NOT NULL,
    description text
);
COMMENT ON TABLE public.company_config_core_version IS 'Enum table for company_config.core_versio';
CREATE TABLE public.company_config_warehouse_language (
    value text NOT NULL,
    description text
);
COMMENT ON TABLE public.company_config_warehouse_language IS 'Enum table for company_config.warehouse_language';
CREATE TABLE public.company_job (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    script text NOT NULL,
    script_args text NOT NULL,
    depends_on uuid,
    retries integer DEFAULT 0 NOT NULL,
    timeout integer DEFAULT 900 NOT NULL,
    execution_environment text DEFAULT 'batch'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    batch_vcpus integer DEFAULT 1,
    batch_memory integer DEFAULT 512,
    CONSTRAINT valid_batch_memory CHECK (((batch_memory IS NULL) OR ((batch_memory >= 256) AND (batch_memory <= 8192)))),
    CONSTRAINT valid_batch_vcpus CHECK (((batch_vcpus IS NULL) OR ((batch_vcpus > 0) AND (batch_vcpus <= 4))))
);
CREATE TABLE public.company_job_execution_environment (
    value text NOT NULL,
    description text
);
COMMENT ON TABLE public.company_job_execution_environment IS 'enum table for job execution environment';
CREATE TABLE public.company_prototypes (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid NOT NULL,
    block_slug text NOT NULL
);
COMMENT ON COLUMN public.company_prototypes.block_slug IS 'This is a string since MAVIS owns all the available blocks';
CREATE TABLE public.company_query_alert (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    query_id uuid NOT NULL,
    task_id uuid,
    alert_kind text NOT NULL,
    email text,
    updated_by uuid
);
CREATE TABLE public.company_query_alert_kinds (
    value text NOT NULL,
    description text
);
CREATE TABLE public.company_resources (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    shared_redash_url text,
    shared_redash_api_key text,
    s3_bucket text,
    kms_key text,
    read_policy text,
    write_policy text,
    company_id uuid NOT NULL,
    shared_redash_datasource_id integer,
    shared_redash_admin_datasource_id integer,
    company_role text,
    dedicated_redash_url text,
    dedicated_redash_api_key text,
    dedicated_redash_datasource_id integer,
    dedicated_redash_admin_datasource_id integer,
    dedicated_redash_image_tag_override text,
    dedicated_redash_workers_cpu_override integer,
    dedicated_redash_workers_memory_override integer,
    updated_by uuid
);
COMMENT ON TABLE public.company_resources IS 'Resources provisioned for a company, and their config. NOTE this table should _not_ be exposed to users directly.';
COMMENT ON COLUMN public.company_resources.shared_redash_url IS 'Full path to the company''s org in redash-shared';
COMMENT ON COLUMN public.company_resources.shared_redash_api_key IS 'API Key for org access in redash-shared';
COMMENT ON COLUMN public.company_resources.s3_bucket IS 'company-resources provisioned S3 bucket name';
COMMENT ON COLUMN public.company_resources.kms_key IS 'company-resources provisioned encryption key';
COMMENT ON COLUMN public.company_resources.read_policy IS 'company-resources provisioned read policy';
COMMENT ON COLUMN public.company_resources.write_policy IS 'company-resources provisioned write policy';
COMMENT ON COLUMN public.company_resources.company_role IS 'company-resources provisioned iam role for company (with read and write policies attached)';
COMMENT ON COLUMN public.company_resources.dedicated_redash_url IS 'Full path to the company''s dedicated redash';
COMMENT ON COLUMN public.company_resources.dedicated_redash_api_key IS 'API Key for access to dedicated redash';
COMMENT ON COLUMN public.company_resources.dedicated_redash_image_tag_override IS 'Override docker image tag for dedicated redash deploy';
COMMENT ON COLUMN public.company_resources.dedicated_redash_workers_cpu_override IS 'Override worker CPU for dedicated redash deploy (note cpu + memory must be a valid ECS Fargate configuration)';
COMMENT ON COLUMN public.company_resources.dedicated_redash_workers_memory_override IS 'Override worker memory for dedicated redash deploy (note cpu + memory must be a valid ECS Fargate configuration)';
CREATE TABLE public.sql_queries (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sql text NOT NULL,
    notes text,
    updated_by text NOT NULL,
    related_to text,
    related_id uuid,
    related_kind text,
    name text
);
CREATE VIEW public.company_sql_queries AS
 SELECT sql_queries.id,
    sql_queries.created_at,
    sql_queries.updated_at,
    sql_queries.sql,
    sql_queries.notes,
    sql_queries.updated_by,
    sql_queries.related_to,
    sql_queries.related_id,
    sql_queries.related_kind,
    sql_queries.name
   FROM public.sql_queries
  WHERE (sql_queries.related_to = 'company'::text);
CREATE TABLE public.company_sso (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid NOT NULL,
    org_id text NOT NULL,
    enforce_sso boolean,
    disable_sso boolean
);
COMMENT ON TABLE public.company_sso IS 'Company SSO Configuration (via WorkOS)';
COMMENT ON COLUMN public.company_sso.org_id IS 'WorkOS Organization Id';
COMMENT ON COLUMN public.company_sso.enforce_sso IS 'When true, only allow login via SSO';
CREATE TABLE public.company_status (
    value text NOT NULL,
    description text
);
COMMENT ON TABLE public.company_status IS 'Enum table for company status';
CREATE TABLE public.company_table (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    identifier text DEFAULT 'Customer'::text NOT NULL,
    activity_stream text NOT NULL,
    customer_table text,
    customer_label text,
    row_count bigint,
    index_table boolean
);
CREATE TABLE public.company_tags (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tag text NOT NULL,
    company_id uuid NOT NULL,
    color text,
    user_id uuid,
    description text
);
CREATE TABLE public.company_task (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    task_slug text NOT NULL,
    schedule text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    internal_only boolean DEFAULT true NOT NULL,
    category text
);
CREATE TABLE public.company_task_category (
    value text NOT NULL,
    description text
);
CREATE TABLE public.company_timeline_relations (
    value text NOT NULL,
    description text
);
CREATE TABLE public.company_user (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    first_name text,
    last_name text,
    phone text
);
COMMENT ON TABLE public.company_user IS 'Company user access and roles';
CREATE TABLE public.company_user_notifications (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    company_user_id uuid NOT NULL,
    template_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    template_data jsonb
);
CREATE TABLE public.company_user_preferences (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    company_user_id uuid NOT NULL,
    email_opt_out boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    profile_picture text,
    CONSTRAINT "Profile Picture HTTPS" CHECK ((profile_picture ~ '^https://'::text))
);
CREATE TABLE public.company_user_role (
    value text NOT NULL,
    description text NOT NULL
);
COMMENT ON TABLE public.company_user_role IS 'Enum table for Company User roles';
CREATE VIEW public.current_tranformation_sql_queries AS
 SELECT s.id,
    s.created_at,
    s.updated_at,
    s.sql,
    s.notes,
    s.updated_by,
    s.related_id AS transformation_id,
    s.related_kind
   FROM public.sql_queries s
  WHERE ((s.related_to = 'transformation'::text) AND (s.related_kind = 'current'::text));
CREATE TABLE public.custom_function (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    input_count integer NOT NULL,
    text_to_replace text NOT NULL,
    company_id uuid NOT NULL,
    description text
);
CREATE TABLE public.dataset (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    slug text NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    created_by uuid,
    category text,
    status text DEFAULT 'in_progress'::text NOT NULL,
    category_id uuid,
    updated_by uuid,
    last_viewed_at timestamp with time zone,
    last_config_updated_at timestamp with time zone,
    metric_id uuid,
    hide_from_index boolean
);
COMMENT ON COLUMN public.dataset.category IS 'deprecate';
COMMENT ON COLUMN public.dataset.status IS 'Flag different states for datasets';
CREATE TABLE public.dataset_activities (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    dataset_id uuid NOT NULL,
    activity_id uuid NOT NULL
);
CREATE TABLE public.dataset_materialization (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    type text NOT NULL,
    group_slug text,
    label text NOT NULL,
    sheet_key text,
    task_id uuid,
    dataset_id uuid NOT NULL,
    column_id text,
    days_to_resync integer DEFAULT 30,
    webhook_url text,
    s3_secret_key text,
    user_ids text,
    template_id text,
    postmark_from text
);
COMMENT ON COLUMN public.dataset_materialization.template_id IS 'The post mark template ID';
CREATE VIEW public.dataset_tags AS
 SELECT tag.id,
    tag.created_at,
    tag.updated_at,
    tag.tag_id,
    tag.related_id AS dataset_id
   FROM public.tag
  WHERE (tag.related_to = 'dataset'::text);
CREATE TABLE public.document_revision (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    markdown text NOT NULL,
    published boolean DEFAULT false NOT NULL
);
CREATE VIEW public.document_live AS
 SELECT DISTINCT ON (document_revision.slug) document_revision.id,
    document_revision.created_at,
    document_revision.updated_at,
    document_revision.name,
    document_revision.slug,
    document_revision.markdown,
    document_revision.published
   FROM public.document_revision
  WHERE (document_revision.published = true)
  ORDER BY document_revision.slug, document_revision.created_at DESC;
CREATE TABLE public."group" (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL
);
COMMENT ON TABLE public."group" IS 'WIP company groups';
CREATE TABLE public.job_execution (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    details jsonb DEFAULT jsonb_build_object() NOT NULL,
    task_execution_id uuid
);
CREATE TABLE public.job_execution_status (
    value text NOT NULL,
    description text
);
COMMENT ON TABLE public.job_execution_status IS 'enum table for job execution status';
CREATE TABLE public.maintenance_kinds (
    value text NOT NULL,
    description text
);
CREATE TABLE public.materialization_type (
    value text NOT NULL,
    description text
);
CREATE TABLE public.metric (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    company_id uuid NOT NULL,
    dataset_slug text NOT NULL,
    agg_function text NOT NULL,
    column_id text NOT NULL,
    analyzable boolean DEFAULT false NOT NULL,
    time_resolution text DEFAULT 'month'::text NOT NULL,
    time_to_convert_column_id text,
    created_by uuid NOT NULL,
    archived_at timestamp with time zone,
    is_increase boolean DEFAULT true,
    format text,
    unit_name text,
    table_id uuid,
    status text DEFAULT 'in_progress'::text NOT NULL,
    updated_by uuid,
    task_id uuid
);
CREATE VIEW public.metric_tags AS
 SELECT tag.id,
    tag.created_at,
    tag.updated_at,
    tag.tag_id,
    tag.related_id AS metric_id
   FROM public.tag
  WHERE (tag.related_to = 'metric'::text);
CREATE VIEW public.metric_timelines AS
 SELECT company_timeline.id,
    company_timeline.created_at,
    company_timeline.updated_at,
    company_timeline.related_to,
    company_timeline.related_to_id,
    company_timeline.happened_at,
    company_timeline.name,
    company_timeline.description
   FROM public.company_timeline
  WHERE (company_timeline.related_to = 'metric'::text);
CREATE TABLE public.narrative (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL,
    company_id uuid NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    state text DEFAULT 'in_progress'::text NOT NULL,
    task_id uuid,
    description text,
    category_id uuid,
    template_id uuid,
    updated_by uuid,
    requested_by uuid,
    type text DEFAULT 'standalone'::text,
    last_viewed_at timestamp with time zone,
    last_config_updated_at timestamp with time zone,
    metric_id uuid,
    feature_slug text,
    feature_label text
);
COMMENT ON COLUMN public.narrative.feature_slug IS 'only used for analyze button narratives';
COMMENT ON COLUMN public.narrative.feature_label IS 'only used for analyze button narrative (display)';
CREATE VIEW public.narrative_company_timelines AS
 SELECT company_timeline.id,
    company_timeline.created_at,
    company_timeline.updated_at,
    company_timeline.related_to,
    company_timeline.related_to_id,
    company_timeline.happened_at,
    company_timeline.name,
    company_timeline.description
   FROM public.company_timeline
  WHERE (company_timeline.related_to = 'narrative'::text);
CREATE TABLE public.narrative_datasets (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    narrative_id uuid NOT NULL,
    dataset_id uuid NOT NULL
);
CREATE TABLE public.narrative_narratives (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    narrative_id uuid NOT NULL,
    depends_on_narrative_id uuid NOT NULL
);
CREATE TABLE public.narrative_runs (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    s3_key text NOT NULL,
    company_id uuid,
    narrative_slug text,
    is_actionable boolean,
    potential_lift double precision
);
CREATE VIEW public.narrative_tags AS
 SELECT tag.id,
    tag.created_at,
    tag.updated_at,
    tag.tag_id,
    tag.related_id AS narrative_id
   FROM public.tag
  WHERE (tag.related_to = 'narrative'::text);
CREATE TABLE public.narrative_template (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    template text NOT NULL,
    question text,
    description text,
    display_companies_using integer,
    created_by uuid,
    in_free_tier boolean DEFAULT false,
    company_id uuid,
    preview_narrative_json text,
    state text DEFAULT 'draft'::text NOT NULL,
    global_version integer DEFAULT 3 NOT NULL,
    customer_iteration integer DEFAULT 1 NOT NULL,
    local_iteration integer DEFAULT 1,
    kind text
);
CREATE TABLE public.narrative_template_kinds (
    value text NOT NULL,
    description text NOT NULL
);
CREATE TABLE public.narrative_template_states (
    value text NOT NULL,
    description text
);
CREATE TABLE public.narrative_types (
    value text NOT NULL,
    description text NOT NULL
);
CREATE VIEW public.production_tranformation_sql_queries AS
 SELECT s.id,
    s.created_at,
    s.updated_at,
    s.sql,
    s.notes,
    s.updated_by,
    s.related_id AS transformation_id,
    s.related_kind
   FROM public.sql_queries s
  WHERE ((s.related_to = 'transformation'::text) AND (s.related_kind = 'production'::text));
CREATE TABLE public.query_template (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid NOT NULL,
    warehouse_language text NOT NULL,
    el_source text NOT NULL,
    data_source text NOT NULL,
    transformation_name text NOT NULL,
    query text NOT NULL,
    schema_names text
);
COMMENT ON COLUMN public.query_template.warehouse_language IS 'The warehoure_language (ex. bq, snowflake, querymapper)';
COMMENT ON COLUMN public.query_template.el_source IS 'This is the source the company uses to do their EL - fivetran, stitch, segment, etc..';
COMMENT ON COLUMN public.query_template.data_source IS 'the source of the data (ex. shopify, segment, etc..)';
CREATE TABLE public.query_updates (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone DEFAULT now() NOT NULL,
    from_sync_time timestamp with time zone NOT NULL,
    to_sync_time timestamp with time zone NOT NULL,
    rows_inserted integer DEFAULT 0 NOT NULL,
    transformation_id uuid NOT NULL,
    update_duration integer,
    update_kind text
);
COMMENT ON COLUMN public.query_updates.update_duration IS 'Seconds to update a transformation';
CREATE TABLE public.question_answer_relations (
    value text NOT NULL,
    description text
);
CREATE VIEW public.scratchpad_tranformation_sql_queries AS
 SELECT s.id,
    s.created_at,
    s.updated_at,
    s.sql,
    s.notes,
    s.updated_by,
    s.related_id AS transformation_id,
    s.related_kind
   FROM public.sql_queries s
  WHERE ((s.related_to = 'transformation'::text) AND (s.related_kind = 'scratchpad'::text));
CREATE TABLE public.service_limit (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid NOT NULL,
    deleted_at timestamp with time zone,
    plan_id uuid,
    monthly_price double precision,
    activity_limit integer,
    dataset_limit integer,
    transformation_limit integer,
    narrative_limit integer,
    row_limit bigint,
    activity_stream_limit integer,
    run_transformations_daily_limit integer,
    materialization_limit integer,
    user_limit integer,
    name text,
    total_templates_from_library_limit integer,
    monthly_templates_from_library_limit integer,
    disable_on timestamp with time zone,
    admin_user_limit integer,
    start_on date,
    end_on date
);
COMMENT ON COLUMN public.service_limit.plan_id IS 'this is a link to the future plan taels';
COMMENT ON COLUMN public.service_limit.activity_limit IS 'maximum live activities';
COMMENT ON COLUMN public.service_limit.dataset_limit IS 'maximum number of dataset';
COMMENT ON COLUMN public.service_limit.transformation_limit IS 'maximum transformations';
COMMENT ON COLUMN public.service_limit.narrative_limit IS 'maximum live narratives';
COMMENT ON COLUMN public.service_limit.row_limit IS 'maximum rows in each activity stream';
COMMENT ON COLUMN public.service_limit.activity_stream_limit IS 'maximum activity stream tables supported';
COMMENT ON COLUMN public.service_limit.run_transformations_daily_limit IS 'For limiting processing to be once a day';
COMMENT ON COLUMN public.service_limit.materialization_limit IS 'Limit of dataset materializations';
COMMENT ON COLUMN public.service_limit.total_templates_from_library_limit IS 'maximum Narratives that can be built from our template library';
COMMENT ON COLUMN public.service_limit.monthly_templates_from_library_limit IS 'maximum narratives that can be built from our template library per month';
COMMENT ON COLUMN public.service_limit.start_on IS 'when the subscription starts';
COMMENT ON COLUMN public.service_limit.end_on IS 'when the subscription ends';
CREATE TABLE public.sql_query_kinds (
    value text NOT NULL,
    description text
);
CREATE TABLE public.sql_query_relations (
    value text NOT NULL,
    description text
);
CREATE TABLE public.status (
    value text NOT NULL,
    description text
);
COMMENT ON TABLE public.status IS 'enum table for dataset status';
CREATE TABLE public.tag_relations (
    value text NOT NULL,
    description text
);
CREATE TABLE public.task_execution (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    details jsonb DEFAULT jsonb_build_object() NOT NULL,
    trace_id text,
    trace_parent_id text,
    by_user uuid,
    is_running boolean DEFAULT true,
    orchestration_id text
);
COMMENT ON COLUMN public.task_execution.is_running IS 'This is managed by an on update trigger, is effectively !completed_at, and used for the unique index';
COMMENT ON COLUMN public.task_execution.orchestration_id IS 'The ID of the Step Function execution that is running this task';
CREATE TABLE public.task_execution_status (
    value text NOT NULL,
    description text
);
COMMENT ON TABLE public.task_execution_status IS 'enum table for task execution status';
CREATE TABLE public.tranformation_enriched_activities (
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    transformation_id uuid NOT NULL,
    activity_id uuid NOT NULL,
    "column" text
);
COMMENT ON COLUMN public.tranformation_enriched_activities."column" IS 'The column that we will use to join, if null then activity_id';
CREATE SEQUENCE public.tranformation_enriched_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.tranformation_enriched_activities_id_seq OWNED BY public.tranformation_enriched_activities.id;
CREATE TABLE public.transformation (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    slug text NOT NULL,
    name text,
    notes text,
    kind text DEFAULT 'stream'::text,
    update_type text DEFAULT 'regular'::text,
    "table" text,
    has_source boolean,
    is_aliasing boolean DEFAULT false,
    single_activity boolean DEFAULT true,
    do_not_delete_on_resync boolean DEFAULT false,
    delete_window integer,
    mutable_day_window integer DEFAULT 10,
    start_data_after date,
    max_days_to_insert integer,
    last_resynced_at timestamp with time zone,
    next_resync_at timestamp with time zone,
    company_id uuid NOT NULL,
    last_identity_resolution_updated_at timestamp with time zone,
    last_diff_data_and_insert_at timestamp with time zone,
    category_id uuid,
    updated_by uuid,
    allow_future_data boolean,
    notify_row_count_percent_change numeric,
    do_not_update_on_percent_change boolean,
    remove_customers boolean
);
COMMENT ON COLUMN public.transformation.notify_row_count_percent_change IS 'a percent that will notify the user if the last row count update has been great than that change.';
COMMENT ON COLUMN public.transformation.do_not_update_on_percent_change IS 'if percent change has been more than an amount, skip the update of the transformation';
COMMENT ON COLUMN public.transformation.remove_customers IS 'A flag to remove all the customers that are in this transformation';
CREATE TABLE public.transformation_activities (
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    transformation_id uuid NOT NULL,
    activity_id uuid NOT NULL
);
CREATE SEQUENCE public.transformation_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.transformation_activities_id_seq OWNED BY public.transformation_activities.id;
CREATE VIEW public.transformation_column_renames AS
 SELECT column_renames.id,
    column_renames.created_at,
    column_renames.updated_at,
    column_renames.name,
    column_renames.label,
    column_renames.type,
    column_renames.casting,
    column_renames.description,
    column_renames.related_to,
    column_renames.related_to_id,
    column_renames.has_data,
    column_renames.related_to_id AS transformation_id
   FROM public.column_renames
  WHERE (column_renames.related_to = 'transformation'::text);
CREATE TABLE public.transformation_depends_on (
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    transformation_id uuid NOT NULL,
    depends_on_transformation_id uuid NOT NULL
);
CREATE SEQUENCE public.transformation_depends_on_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.transformation_depends_on_id_seq OWNED BY public.transformation_depends_on.id;
CREATE TABLE public.transformation_kinds (
    value text NOT NULL,
    description text
);
CREATE TABLE public.transformation_maintenance (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone,
    transformation_id uuid NOT NULL,
    notes text,
    kind text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);
CREATE VIEW public.transformation_questions AS
 SELECT s.id,
    s.created_at,
    s.updated_at,
    s.question,
    s.answer,
    s.answered_by,
    s.related_id AS transformation_id
   FROM public.question_answer s
  WHERE (s.related_to = 'transformation'::text);
CREATE TABLE public.transformation_run_after (
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    transformation_id uuid NOT NULL,
    run_after_transformation_id uuid NOT NULL
);
CREATE SEQUENCE public.transformation_run_after_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.transformation_run_after_id_seq OWNED BY public.transformation_run_after.id;
CREATE TABLE public.transformation_test (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'Running'::text NOT NULL,
    name text NOT NULL,
    content text,
    query text,
    ran_data_from timestamp with time zone,
    transformation_id uuid NOT NULL,
    data text,
    updated_by uuid
);
CREATE TABLE public.transformation_test_status (
    value text NOT NULL,
    description text
);
CREATE TABLE public.transformation_update_types (
    value text NOT NULL,
    description text
);
CREATE TABLE public."user" (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'user'::text,
    accepted_terms_at timestamp with time zone,
    accepted_terms_version uuid
);
COMMENT ON TABLE public."user" IS 'Users that have access to the platform. Can belong to many companies via company_users.';
CREATE TABLE public.user_role (
    value text NOT NULL,
    description text
);
COMMENT ON TABLE public.user_role IS 'Enum Table for User Roles';
CREATE VIEW public.validation_activity_sql_queries AS
 SELECT s.id,
    s.created_at,
    s.updated_at,
    s.sql,
    s.notes,
    s.updated_by,
    s.related_id AS activity_id,
    s.related_kind
   FROM public.sql_queries s
  WHERE ((s.related_to = 'activity'::text) AND (s.related_kind = 'validation'::text));
CREATE VIEW public.validation_tranformation_sql_queries AS
 SELECT s.id,
    s.created_at,
    s.updated_at,
    s.sql,
    s.notes,
    s.updated_by,
    s.related_id AS transformation_id,
    s.related_kind
   FROM public.sql_queries s
  WHERE ((s.related_to = 'transformation'::text) AND (s.related_kind = 'validation'::text));
CREATE TABLE public.watcher (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    related_to text NOT NULL,
    related_id uuid NOT NULL,
    user_id uuid NOT NULL
);
CREATE TABLE public.watcher_relation (
    value text NOT NULL,
    description text
);
ALTER TABLE ONLY audit.logged_actions ALTER COLUMN event_id SET DEFAULT nextval('audit.logged_actions_event_id_seq'::regclass);
ALTER TABLE ONLY public.tranformation_enriched_activities ALTER COLUMN id SET DEFAULT nextval('public.tranformation_enriched_activities_id_seq'::regclass);
ALTER TABLE ONLY public.transformation_activities ALTER COLUMN id SET DEFAULT nextval('public.transformation_activities_id_seq'::regclass);
ALTER TABLE ONLY public.transformation_depends_on ALTER COLUMN id SET DEFAULT nextval('public.transformation_depends_on_id_seq'::regclass);
ALTER TABLE ONLY public.transformation_run_after ALTER COLUMN id SET DEFAULT nextval('public.transformation_run_after_id_seq'::regclass);
ALTER TABLE ONLY audit.logged_actions
    ADD CONSTRAINT logged_actions_pkey PRIMARY KEY (event_id);
ALTER TABLE ONLY public.activity_maintenance
    ADD CONSTRAINT activity_maintenance_activity_id_ended_at_key UNIQUE (activity_id, ended_at);
ALTER TABLE ONLY public.activity_maintenance
    ADD CONSTRAINT activity_maintenance_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.activity_status
    ADD CONSTRAINT activity_status_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_table_id_slug_key UNIQUE (table_id, slug);
ALTER TABLE ONLY public.adhoc_execution
    ADD CONSTRAINT adhoc_execution_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.column_rename_relations
    ADD CONSTRAINT column_rename_relations_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.column_renames
    ADD CONSTRAINT column_renames_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.column_renames
    ADD CONSTRAINT column_renames_related_to_related_to_id_name_key UNIQUE (related_to, related_to_id, name);
ALTER TABLE ONLY public.company
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.company
    ADD CONSTRAINT companies_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.company_categories
    ADD CONSTRAINT company_categories_category_company_id_key UNIQUE (category, company_id);
ALTER TABLE ONLY public.company_categories
    ADD CONSTRAINT company_categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.company_config_batch_version
    ADD CONSTRAINT company_config_batch_version_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.company_config_core_version
    ADD CONSTRAINT company_config_core_version_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.company_config_warehouse_language
    ADD CONSTRAINT company_config_warehouse_language_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_id_key UNIQUE (id);
ALTER TABLE ONLY public.company_job_execution_environment
    ADD CONSTRAINT company_job_execution_environment_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.company_job
    ADD CONSTRAINT company_job_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.company_job
    ADD CONSTRAINT company_job_task_id_script_name_key UNIQUE (task_id, script, name);
ALTER TABLE ONLY public.company_prototypes
    ADD CONSTRAINT company_prototypes_company_id_block_slug_key UNIQUE (company_id, block_slug);
ALTER TABLE ONLY public.company_prototypes
    ADD CONSTRAINT company_prototypes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.company_query_alert_kinds
    ADD CONSTRAINT company_query_alert_kinds_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.company_query_alert
    ADD CONSTRAINT company_query_alert_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.company_query_alert
    ADD CONSTRAINT company_query_alert_query_id_key UNIQUE (query_id);
ALTER TABLE ONLY public.company_resources
    ADD CONSTRAINT company_resources_company_id_key UNIQUE (company_id);
ALTER TABLE ONLY public.company_resources
    ADD CONSTRAINT company_resources_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.company_sso
    ADD CONSTRAINT company_sso_company_id_key UNIQUE (company_id);
ALTER TABLE ONLY public.company_sso
    ADD CONSTRAINT company_sso_org_id_key UNIQUE (org_id);
ALTER TABLE ONLY public.company_sso
    ADD CONSTRAINT company_sso_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.company_status
    ADD CONSTRAINT company_status_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.company_table
    ADD CONSTRAINT company_table_activity_stream_company_id_key UNIQUE (activity_stream, company_id);
ALTER TABLE ONLY public.company_table
    ADD CONSTRAINT company_table_company_id_identifier_key UNIQUE (company_id, identifier);
ALTER TABLE ONLY public.company_table
    ADD CONSTRAINT company_table_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.company_tags
    ADD CONSTRAINT company_tags_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.company_task_category
    ADD CONSTRAINT company_task_category_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.company_task
    ADD CONSTRAINT company_task_company_id_task_slug_key UNIQUE (company_id, task_slug);
ALTER TABLE ONLY public.company_task
    ADD CONSTRAINT company_task_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.company_user
    ADD CONSTRAINT company_user_company_id_user_id_key UNIQUE (company_id, user_id);
ALTER TABLE ONLY public.company_user_notifications
    ADD CONSTRAINT company_user_notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.company_user
    ADD CONSTRAINT company_user_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.company_user_preferences
    ADD CONSTRAINT company_user_preferences_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.company_user_preferences
    ADD CONSTRAINT company_user_preferences_user_id_key UNIQUE (company_user_id);
ALTER TABLE ONLY public.company_user_role
    ADD CONSTRAINT company_user_role_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.custom_function
    ADD CONSTRAINT custom_functions_company_id_name_key UNIQUE (company_id, name);
ALTER TABLE ONLY public.custom_function
    ADD CONSTRAINT custom_functions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dataset_activities
    ADD CONSTRAINT dataset_activities_dataset_id_activity_id_key UNIQUE (dataset_id, activity_id);
ALTER TABLE ONLY public.dataset_activities
    ADD CONSTRAINT dataset_activities_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dataset
    ADD CONSTRAINT dataset_company_id_slug_key UNIQUE (company_id, slug);
ALTER TABLE ONLY public.dataset_materialization
    ADD CONSTRAINT dataset_materialization_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dataset
    ADD CONSTRAINT dataset_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.status
    ADD CONSTRAINT dataset_status_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.document_revision
    ADD CONSTRAINT document_revision_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.company_timeline_relations
    ADD CONSTRAINT event_relations_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.company_timeline
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public."group"
    ADD CONSTRAINT group_company_id_name_key UNIQUE (company_id, name);
ALTER TABLE ONLY public."group"
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.job_execution
    ADD CONSTRAINT job_execution_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.job_execution_status
    ADD CONSTRAINT job_execution_status_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.maintenance_kinds
    ADD CONSTRAINT maintenance_kinds_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.materialization_type
    ADD CONSTRAINT materialization_types_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.metric
    ADD CONSTRAINT metric_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.narrative
    ADD CONSTRAINT narrative_company_id_slug_key UNIQUE (company_id, slug);
ALTER TABLE ONLY public.narrative_datasets
    ADD CONSTRAINT narrative_datasets_narrative_id_dataset_id_key UNIQUE (narrative_id, dataset_id);
ALTER TABLE ONLY public.narrative_datasets
    ADD CONSTRAINT narrative_datasets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.narrative_narratives
    ADD CONSTRAINT narrative_narratives_narrative_id_depends_on_narrative_id_key UNIQUE (narrative_id, depends_on_narrative_id);
ALTER TABLE ONLY public.narrative_narratives
    ADD CONSTRAINT narrative_narratives_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.narrative
    ADD CONSTRAINT narrative_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.narrative_runs
    ADD CONSTRAINT narrative_runs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.narrative_template_kinds
    ADD CONSTRAINT narrative_template_kinds_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.narrative_template
    ADD CONSTRAINT narrative_template_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.narrative_template_states
    ADD CONSTRAINT narrative_template_states_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.narrative_types
    ADD CONSTRAINT narrative_types_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.query_template
    ADD CONSTRAINT query_template_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.query_template
    ADD CONSTRAINT query_template_warehouse_language_el_source_data_source_tra_key UNIQUE (warehouse_language, el_source, data_source, transformation_name);
ALTER TABLE ONLY public.query_updates
    ADD CONSTRAINT query_update_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.question_answer
    ADD CONSTRAINT question_answer_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.question_answer_relations
    ADD CONSTRAINT question_answer_relations_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.service_limit
    ADD CONSTRAINT service_limit_company_id_deleted_at_key UNIQUE (company_id, deleted_at);
ALTER TABLE ONLY public.service_limit
    ADD CONSTRAINT service_limit_company_id_end_on_deleted_at_key UNIQUE (company_id, end_on, deleted_at);
ALTER TABLE ONLY public.service_limit
    ADD CONSTRAINT service_limit_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sql_queries
    ADD CONSTRAINT sql_queries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sql_query_kinds
    ADD CONSTRAINT sql_query_kinds_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.sql_query_relations
    ADD CONSTRAINT sql_query_relations_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tag_relations
    ADD CONSTRAINT tag_relations_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_tag_id_related_to_related_id_key UNIQUE (tag_id, related_to, related_id);
ALTER TABLE ONLY public.task_execution
    ADD CONSTRAINT task_execution_is_running_task_id_key UNIQUE (is_running, task_id);
ALTER TABLE ONLY public.task_execution
    ADD CONSTRAINT task_execution_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.task_execution_status
    ADD CONSTRAINT task_execution_status_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.transformation_test_status
    ADD CONSTRAINT test_status_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.transformation_test
    ADD CONSTRAINT tests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tranformation_enriched_activities
    ADD CONSTRAINT tranformation_enriched_activi_transformation_id_activity_id_key UNIQUE (transformation_id, activity_id);
ALTER TABLE ONLY public.tranformation_enriched_activities
    ADD CONSTRAINT tranformation_enriched_activities_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.transformation_activities
    ADD CONSTRAINT transformation_activities_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.transformation_activities
    ADD CONSTRAINT transformation_activities_transformation_id_activity_id_key UNIQUE (transformation_id, activity_id);
ALTER TABLE ONLY public.transformation
    ADD CONSTRAINT transformation_company_id_slug_key UNIQUE (company_id, slug);
ALTER TABLE ONLY public.transformation_depends_on
    ADD CONSTRAINT transformation_depends_on_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.transformation_kinds
    ADD CONSTRAINT transformation_kinds_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.transformation_maintenance
    ADD CONSTRAINT transformation_maintenance_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.transformation_maintenance
    ADD CONSTRAINT transformation_maintenance_transformation_id_ended_at_key UNIQUE (transformation_id, ended_at);
ALTER TABLE ONLY public.transformation
    ADD CONSTRAINT transformation_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.transformation_run_after
    ADD CONSTRAINT transformation_run_after_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.transformation_update_types
    ADD CONSTRAINT transformation_update_types_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.watcher
    ADD CONSTRAINT watcher_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.watcher_relation
    ADD CONSTRAINT watcher_relation_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.watcher
    ADD CONSTRAINT watchers_related_to_related_id_user_id_key UNIQUE (related_to, related_id, user_id);
CREATE INDEX logged_actions_action_idx ON audit.logged_actions USING btree (action);
CREATE INDEX logged_actions_action_tstamp_tx_stm_idx ON audit.logged_actions USING btree (action_tstamp_stm);
CREATE INDEX logged_actions_relid_idx ON audit.logged_actions USING btree (relid);
CREATE INDEX active_maintenance_index ON public.activity_maintenance USING btree (activity_id) WHERE (ended_at IS NULL);
CREATE INDEX activity_company_id_idx ON public.activity USING btree (company_id);
CREATE INDEX activity_company_id_table_id_idx ON public.activity USING btree (company_id, table_id);
CREATE INDEX activity_maintainer_index ON public.activity USING btree (maintainer_id);
CREATE INDEX activity_maintenance_activity_id_idx ON public.activity_maintenance USING btree (activity_id);
CREATE INDEX activity_maintence_filtered_index ON public.activity_maintenance USING btree (activity_id, started_at);
CREATE INDEX column_renames_related_to_id_idx ON public.column_renames USING btree (related_to_id);
CREATE INDEX column_renames_related_to_idx ON public.column_renames USING btree (related_to);
CREATE INDEX company_active_metric_index ON public.metric USING btree (company_id) WHERE (archived_at IS NULL);
CREATE INDEX company_categories_company_id_idx ON public.company_categories USING btree (company_id);
CREATE INDEX company_job_task_id_key ON public.company_job USING btree (task_id);
CREATE INDEX company_prototype_index ON public.company_prototypes USING btree (company_id);
CREATE INDEX company_query_alert_task_id_key ON public.company_query_alert USING btree (task_id);
CREATE INDEX company_resources_company_id_idx ON public.company_resources USING btree (company_id);
CREATE INDEX company_resources_company_id_idx1 ON public.company_resources USING btree (company_id);
CREATE INDEX company_resources_s3_bucket_idx ON public.company_resources USING btree (s3_bucket);
CREATE INDEX company_s3_bucket_idx ON public.company USING btree (s3_bucket);
CREATE INDEX company_slug_idx ON public.company USING btree (slug);
CREATE INDEX company_sso_company_id_idx ON public.company_sso USING btree (company_id);
CREATE INDEX company_sso_org_id_idx ON public.company_sso USING btree (org_id);
CREATE INDEX company_table_activity_stream_idx ON public.company_table USING btree (activity_stream);
CREATE INDEX company_table_company_id_idx ON public.company_table USING btree (company_id);
CREATE INDEX company_tags_company_id_idx ON public.company_tags USING btree (company_id);
CREATE UNIQUE INDEX company_tags_tag_company_id_key_unique ON public.company_tags USING btree (company_id, tag) WHERE (user_id IS NULL);
CREATE UNIQUE INDEX company_tags_tag_company_id_user_id_key_unique ON public.company_tags USING btree (company_id, tag, user_id) WHERE (user_id IS NOT NULL);
CREATE INDEX company_task_category_idx ON public.company_task USING btree (category);
CREATE INDEX company_task_company_id_created_at_idx ON public.company_task USING btree (company_id, created_at DESC);
CREATE INDEX company_task_company_id_idx ON public.company_task USING btree (company_id);
CREATE INDEX company_task_internal_only_idx ON public.company_task USING btree (internal_only);
CREATE INDEX company_timeline_related_to_id_idx ON public.company_timeline USING btree (related_to_id);
CREATE INDEX company_timeline_related_to_idx ON public.company_timeline USING btree (related_to);
CREATE INDEX company_user_company_id_idx ON public.company_user USING btree (company_id);
CREATE INDEX company_user_notifications_company_user_id_idx ON public.company_user_notifications USING btree (company_user_id);
CREATE INDEX company_user_notifications_company_user_id_template_slug_idx ON public.company_user_notifications USING btree (company_user_id, template_slug);
CREATE INDEX company_user_notifications_template_slug_idx ON public.company_user_notifications USING btree (template_slug);
CREATE INDEX company_user_user_id_idx ON public.company_user USING btree (user_id);
CREATE INDEX custom_function_company_id_idx ON public.custom_function USING btree (company_id);
CREATE INDEX dataset_activities_dataset_id_idx ON public.dataset_activities USING btree (dataset_id);
CREATE INDEX dataset_company_id_idx ON public.dataset USING btree (company_id);
CREATE INDEX dataset_created_by_idx ON public.dataset USING btree (created_by);
CREATE INDEX dataset_materialization_dataset_id_idx ON public.dataset_materialization USING btree (dataset_id);
CREATE INDEX dataset_materialization_task_id_idx ON public.dataset_materialization USING btree (task_id);
CREATE INDEX dataset_metric_index ON public.dataset USING btree (metric_id);
CREATE INDEX dataset_slug_idx ON public.dataset USING btree (slug);
CREATE INDEX document_revision_published_slug_created_at_idx ON public.document_revision USING btree (slug, created_at DESC NULLS LAST) WHERE (published IS TRUE);
CREATE INDEX job_execution_job_id_idx ON public.job_execution USING btree (job_id);
CREATE INDEX job_execution_task_execution_id_idx ON public.job_execution USING btree (task_execution_id);
CREATE INDEX metric_company_id_idx ON public.metric USING btree (company_id);
CREATE UNIQUE INDEX metric_name_idx ON public.metric USING btree (company_id, name) WHERE (status = 'live'::text);
CREATE INDEX narrative_category_id_idx ON public.narrative USING btree (category_id);
CREATE INDEX narrative_company_id_idx ON public.narrative USING btree (company_id);
CREATE INDEX narrative_created_by_idx ON public.narrative USING btree (created_by);
CREATE INDEX narrative_datasets_dataset_id_idx ON public.narrative_datasets USING btree (dataset_id);
CREATE INDEX narrative_datasets_narrative_id_idx ON public.narrative_datasets USING btree (narrative_id);
CREATE INDEX narrative_metric_index ON public.narrative USING btree (metric_id);
CREATE INDEX narrative_narratives_narrative_id_idx ON public.narrative_narratives USING btree (narrative_id);
CREATE INDEX narrative_runs_company_id_idx ON public.narrative_runs USING btree (company_id);
CREATE INDEX narrative_runs_created_at_idx ON public.narrative_runs USING btree (created_at DESC);
CREATE INDEX narrative_runs_created_at_nl_idx ON public.narrative_runs USING btree (created_at DESC NULLS LAST);
CREATE INDEX narrative_runs_narrative_slug_idx ON public.narrative_runs USING btree (narrative_slug);
CREATE INDEX narrative_runs_search_index ON public.narrative_runs USING btree (company_id, narrative_slug, created_at DESC);
CREATE INDEX narrative_slug_idx ON public.narrative USING btree (slug);
CREATE INDEX narrative_task_id_idx ON public.narrative USING btree (task_id);
CREATE INDEX narrative_template_id_idx ON public.narrative USING btree (template_id);
CREATE INDEX narrative_template_name_idx ON public.narrative_template USING btree (name);
CREATE INDEX query_search_index ON public.query_updates USING btree (transformation_id, processed_at);
CREATE INDEX query_updates_processed_at_asc_idx ON public.query_updates USING btree (processed_at);
CREATE INDEX query_updates_processed_at_idx ON public.query_updates USING btree (processed_at DESC NULLS LAST);
CREATE INDEX query_updates_processed_at_idx1 ON public.query_updates USING btree (processed_at DESC);
CREATE INDEX query_updates_processed_at_with_rows_idx ON public.query_updates USING btree (processed_at DESC NULLS LAST) WHERE (rows_inserted > 0);
CREATE INDEX query_updates_processed_at_with_transformation_and_rows_idx ON public.query_updates USING btree (transformation_id, processed_at DESC NULLS LAST) WHERE (rows_inserted > 0);
CREATE INDEX query_updates_rows_inserted_idx ON public.query_updates USING btree (rows_inserted);
CREATE INDEX query_updates_transformation_id_idx ON public.query_updates USING btree (transformation_id);
CREATE INDEX question_answer_related_id_idx ON public.question_answer USING btree (related_id);
CREATE INDEX question_answer_related_to_idx ON public.question_answer USING btree (related_to);
CREATE INDEX running_task_index ON public.task_execution USING btree (status) WHERE (status = ANY (ARRAY['pending'::text, 'running'::text]));
CREATE INDEX service_limit_active ON public.service_limit USING btree (company_id) WHERE (deleted_at IS NULL);
CREATE INDEX sql_queries_related_id_idx ON public.sql_queries USING btree (related_id);
CREATE INDEX sql_queries_related_kind_idx ON public.sql_queries USING btree (related_kind);
CREATE INDEX sql_queries_related_to_idx ON public.sql_queries USING btree (related_to);
CREATE INDEX sql_queries_updated_at_idx ON public.sql_queries USING btree (updated_at);
CREATE INDEX sql_queries_updated_at_idx1 ON public.sql_queries USING btree (updated_at DESC NULLS LAST);
CREATE INDEX tag_related_id_idx ON public.tag USING btree (related_id);
CREATE INDEX tag_related_to_idx ON public.tag USING btree (related_to);
CREATE INDEX task_execution_started_at_idx ON public.task_execution USING btree (started_at DESC NULLS LAST);
CREATE INDEX task_execution_task_id_idx ON public.task_execution USING btree (task_id);
CREATE INDEX task_execution_task_id_started_at_idx ON public.task_execution USING btree (task_id, started_at DESC NULLS LAST);
CREATE INDEX tranformation_enriched_activities_activity_id_idx ON public.tranformation_enriched_activities USING btree (activity_id);
CREATE INDEX tranformation_enriched_activities_transformation_id_idx ON public.tranformation_enriched_activities USING btree (transformation_id);
CREATE INDEX transformation_activities_activity_id_idx ON public.transformation_activities USING btree (activity_id);
CREATE INDEX transformation_activities_transformation_id_idx ON public.transformation_activities USING btree (transformation_id);
CREATE INDEX transformation_category_id_idx ON public.transformation USING btree (category_id);
CREATE INDEX transformation_company_id_idx ON public.transformation USING btree (company_id);
CREATE INDEX transformation_created_at_idx ON public.transformation USING btree (created_at);
CREATE INDEX transformation_created_at_idx1 ON public.transformation USING btree (created_at DESC);
CREATE INDEX transformation_created_at_idx2 ON public.transformation USING btree (created_at DESC NULLS LAST);
CREATE INDEX transformation_depends_on_depends_on_transformation_id_idx ON public.transformation_depends_on USING btree (depends_on_transformation_id);
CREATE INDEX transformation_depends_on_transformation_id_idx ON public.transformation_depends_on USING btree (transformation_id);
CREATE INDEX transformation_maintenance_search ON public.transformation USING btree (company_id, "table");
CREATE INDEX transformation_next_resync_at_idx ON public.transformation USING btree (next_resync_at);
CREATE INDEX transformation_run_after_run_after_transformation_id_idx ON public.transformation_run_after USING btree (run_after_transformation_id);
CREATE INDEX transformation_run_after_transformation_id_idx ON public.transformation_run_after USING btree (transformation_id);
CREATE INDEX transformation_slug_idx ON public.transformation USING btree (slug);
CREATE INDEX transformation_test_transformation_id_idx ON public.transformation_test USING btree (transformation_id);
CREATE TRIGGER audit_trigger_row AFTER INSERT OR DELETE OR UPDATE ON public.activity FOR EACH ROW EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_row AFTER INSERT OR DELETE OR UPDATE ON public.activity_status FOR EACH ROW EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_row AFTER INSERT OR DELETE OR UPDATE ON public.company FOR EACH ROW EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_row AFTER INSERT OR DELETE OR UPDATE ON public.company_status FOR EACH ROW EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_row AFTER INSERT OR DELETE OR UPDATE ON public.company_user FOR EACH ROW EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_row AFTER INSERT OR DELETE OR UPDATE ON public.company_user_role FOR EACH ROW EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_row AFTER INSERT OR DELETE OR UPDATE ON public."group" FOR EACH ROW EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_row AFTER INSERT OR DELETE OR UPDATE ON public."user" FOR EACH ROW EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_row AFTER INSERT OR DELETE OR UPDATE ON public.user_role FOR EACH ROW EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_stm AFTER TRUNCATE ON public.activity FOR EACH STATEMENT EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_stm AFTER TRUNCATE ON public.activity_status FOR EACH STATEMENT EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_stm AFTER TRUNCATE ON public.company FOR EACH STATEMENT EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_stm AFTER TRUNCATE ON public.company_status FOR EACH STATEMENT EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_stm AFTER TRUNCATE ON public.company_user FOR EACH STATEMENT EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_stm AFTER TRUNCATE ON public.company_user_role FOR EACH STATEMENT EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_stm AFTER TRUNCATE ON public."group" FOR EACH STATEMENT EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_stm AFTER TRUNCATE ON public."user" FOR EACH STATEMENT EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER audit_trigger_stm AFTER TRUNCATE ON public.user_role FOR EACH STATEMENT EXECUTE FUNCTION audit.if_modified_func('true');
CREATE TRIGGER set_public_activity_maintenance_updated_at BEFORE UPDATE ON public.activity_maintenance FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_activity_maintenance_updated_at ON public.activity_maintenance IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_activity_updated_at BEFORE UPDATE ON public.activity FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_activity_updated_at ON public.activity IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_adhoc_execution_updated_at BEFORE UPDATE ON public.adhoc_execution FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_adhoc_execution_updated_at ON public.adhoc_execution IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_column_renames_updated_at BEFORE UPDATE ON public.column_renames FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_column_renames_updated_at ON public.column_renames IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_company_job_updated_at BEFORE UPDATE ON public.company_job FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_company_job_updated_at ON public.company_job IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_company_query_alert_updated_at BEFORE UPDATE ON public.company_query_alert FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_company_query_alert_updated_at ON public.company_query_alert IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_company_resources_updated_at BEFORE UPDATE ON public.company_resources FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_company_resources_updated_at ON public.company_resources IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_company_sso_updated_at BEFORE UPDATE ON public.company_sso FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_company_sso_updated_at ON public.company_sso IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_company_table_updated_at BEFORE UPDATE ON public.company_table FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_company_table_updated_at ON public.company_table IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_company_task_updated_at BEFORE UPDATE ON public.company_task FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_company_task_updated_at ON public.company_task IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_company_updated_at BEFORE UPDATE ON public.company FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_company_updated_at ON public.company IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_company_user_preferences_updated_at BEFORE UPDATE ON public.company_user_preferences FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_company_user_preferences_updated_at ON public.company_user_preferences IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_company_user_updated_at BEFORE UPDATE ON public.company_user FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_company_user_updated_at ON public.company_user IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_custom_functions_updated_at BEFORE UPDATE ON public.custom_function FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_custom_functions_updated_at ON public.custom_function IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_dataset_activities_updated_at BEFORE UPDATE ON public.dataset_activities FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_dataset_activities_updated_at ON public.dataset_activities IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_dataset_materialization_updated_at BEFORE UPDATE ON public.dataset_materialization FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_dataset_materialization_updated_at ON public.dataset_materialization IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_dataset_updated_at BEFORE UPDATE ON public.dataset FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_dataset_updated_at ON public.dataset IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_document_revision_updated_at BEFORE UPDATE ON public.document_revision FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_document_revision_updated_at ON public.document_revision IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_events_updated_at BEFORE UPDATE ON public.company_timeline FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_events_updated_at ON public.company_timeline IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_groups_updated_at BEFORE UPDATE ON public."group" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_groups_updated_at ON public."group" IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_job_execution_updated_at BEFORE UPDATE ON public.job_execution FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_job_execution_updated_at ON public.job_execution IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_metric_updated_at BEFORE UPDATE ON public.metric FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_metric_updated_at ON public.metric IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_narrative_datasets_updated_at BEFORE UPDATE ON public.narrative_datasets FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_narrative_datasets_updated_at ON public.narrative_datasets IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_narrative_narratives_updated_at BEFORE UPDATE ON public.narrative_narratives FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_narrative_narratives_updated_at ON public.narrative_narratives IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_narrative_template_updated_at BEFORE UPDATE ON public.narrative_template FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_narrative_template_updated_at ON public.narrative_template IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_narrative_updated_at BEFORE UPDATE ON public.narrative FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_narrative_updated_at ON public.narrative IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_query_template_updated_at BEFORE UPDATE ON public.query_template FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_query_template_updated_at ON public.query_template IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_query_update_updated_at BEFORE UPDATE ON public.query_updates FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_query_update_updated_at ON public.query_updates IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_question_answer_updated_at BEFORE UPDATE ON public.question_answer FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_question_answer_updated_at ON public.question_answer IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_service_limit_updated_at BEFORE UPDATE ON public.service_limit FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_service_limit_updated_at ON public.service_limit IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_sql_queries_updated_at BEFORE UPDATE ON public.sql_queries FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_sql_queries_updated_at ON public.sql_queries IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_tag_updated_at BEFORE UPDATE ON public.tag FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_tag_updated_at ON public.tag IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_task_execution_updated_at BEFORE UPDATE ON public.task_execution FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_task_execution_updated_at ON public.task_execution IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_tests_updated_at BEFORE UPDATE ON public.transformation_test FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_tests_updated_at ON public.transformation_test IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_transformation_maintenance_updated_at BEFORE UPDATE ON public.transformation_maintenance FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_transformation_maintenance_updated_at ON public.transformation_maintenance IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_transformation_updated_at BEFORE UPDATE ON public.transformation FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_transformation_updated_at ON public.transformation IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_user_updated_at BEFORE UPDATE ON public."user" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_user_updated_at ON public."user" IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_watchers_updated_at BEFORE UPDATE ON public.watcher FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_watchers_updated_at ON public.watcher IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER trigger_task_execution_is_running BEFORE UPDATE ON public.task_execution FOR EACH ROW EXECUTE FUNCTION public.trigger_is_running_on_task_execution();
ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.company_categories(id) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_maintainer_id_fkey FOREIGN KEY (maintainer_id) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.activity_maintenance
    ADD CONSTRAINT activity_maintenance_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activity(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.activity_maintenance
    ADD CONSTRAINT activity_maintenance_kind_fkey FOREIGN KEY (kind) REFERENCES public.maintenance_kinds(value) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_status_fkey FOREIGN KEY (status) REFERENCES public.activity_status(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.company_table(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.adhoc_execution
    ADD CONSTRAINT adhoc_execution_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.adhoc_execution
    ADD CONSTRAINT adhoc_execution_status_fkey FOREIGN KEY (status) REFERENCES public.job_execution_status(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.column_renames
    ADD CONSTRAINT column_renames_related_to_fkey FOREIGN KEY (related_to) REFERENCES public.column_rename_relations(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.company
    ADD CONSTRAINT companies_status_fkey FOREIGN KEY (status) REFERENCES public.company_status(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_batch_version_fkey FOREIGN KEY (batch_version) REFERENCES public.company_config_batch_version(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_core_version_fkey FOREIGN KEY (core_version) REFERENCES public.company_config_core_version(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_created_by_fkey FOREIGN KEY (created_by) REFERENCES public."user"(id) ON UPDATE RESTRICT;
ALTER TABLE ONLY public.company_job
    ADD CONSTRAINT company_job_execution_environment_fkey FOREIGN KEY (execution_environment) REFERENCES public.company_job_execution_environment(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.company_job
    ADD CONSTRAINT company_job_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.company_task(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.company_prototypes
    ADD CONSTRAINT company_prototypes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.company_query_alert
    ADD CONSTRAINT company_query_alert_alert_kind_fkey FOREIGN KEY (alert_kind) REFERENCES public.company_query_alert_kinds(value) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.company_query_alert
    ADD CONSTRAINT company_query_alert_query_id_fkey FOREIGN KEY (query_id) REFERENCES public.sql_queries(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.company_query_alert
    ADD CONSTRAINT company_query_alert_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.company_task(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.company_query_alert
    ADD CONSTRAINT company_query_alert_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public."user"(id);
ALTER TABLE ONLY public.company_resources
    ADD CONSTRAINT company_resources_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.company_resources
    ADD CONSTRAINT company_resources_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public."user"(id);
ALTER TABLE ONLY public.company_sso
    ADD CONSTRAINT company_sso_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.company_table
    ADD CONSTRAINT company_table_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.company_tags
    ADD CONSTRAINT company_tags_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.company_tags
    ADD CONSTRAINT company_tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.company_task
    ADD CONSTRAINT company_task_category_fkey FOREIGN KEY (category) REFERENCES public.company_task_category(value) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE ONLY public.company_task
    ADD CONSTRAINT company_task_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.company_user
    ADD CONSTRAINT company_user_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.company_user_notifications
    ADD CONSTRAINT company_user_notifications_company_user_id_fkey FOREIGN KEY (company_user_id) REFERENCES public.company_user(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.company_user_preferences
    ADD CONSTRAINT company_user_preferences_company_user_id_fkey FOREIGN KEY (company_user_id) REFERENCES public.company_user(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.company_user
    ADD CONSTRAINT company_user_role_fkey FOREIGN KEY (role) REFERENCES public.company_user_role(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.company_user
    ADD CONSTRAINT company_user_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_warehouse_language_fkey FOREIGN KEY (warehouse_language) REFERENCES public.company_config_warehouse_language(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.custom_function
    ADD CONSTRAINT custom_functions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dataset_activities
    ADD CONSTRAINT dataset_activities_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activity(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dataset_activities
    ADD CONSTRAINT dataset_activities_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.dataset(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dataset
    ADD CONSTRAINT dataset_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.company_categories(id) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE ONLY public.dataset
    ADD CONSTRAINT dataset_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE ONLY public.dataset
    ADD CONSTRAINT dataset_created_by_fkey FOREIGN KEY (created_by) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE ONLY public.dataset_materialization
    ADD CONSTRAINT dataset_materialization_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.dataset(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.dataset_materialization
    ADD CONSTRAINT dataset_materialization_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.company_task(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.dataset_materialization
    ADD CONSTRAINT dataset_materialization_type_fkey FOREIGN KEY (type) REFERENCES public.materialization_type(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.dataset_materialization
    ADD CONSTRAINT dataset_materialization_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE ONLY public.dataset
    ADD CONSTRAINT dataset_metric_id_fkey FOREIGN KEY (metric_id) REFERENCES public.metric(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.dataset
    ADD CONSTRAINT dataset_status_fkey FOREIGN KEY (status) REFERENCES public.status(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.dataset
    ADD CONSTRAINT dataset_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE ONLY public.company_timeline
    ADD CONSTRAINT events_related_to_fkey FOREIGN KEY (related_to) REFERENCES public.company_timeline_relations(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public."group"
    ADD CONSTRAINT groups_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.job_execution
    ADD CONSTRAINT job_execution_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.company_job(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.job_execution
    ADD CONSTRAINT job_execution_status_fkey FOREIGN KEY (status) REFERENCES public.job_execution_status(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.job_execution
    ADD CONSTRAINT job_execution_task_execution_fkey FOREIGN KEY (task_execution_id) REFERENCES public.task_execution(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.metric
    ADD CONSTRAINT metric_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.metric
    ADD CONSTRAINT metric_created_by_fkey FOREIGN KEY (created_by) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.metric
    ADD CONSTRAINT metric_status_fkey FOREIGN KEY (status) REFERENCES public.status(value) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.metric
    ADD CONSTRAINT metric_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.company_table(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.metric
    ADD CONSTRAINT metric_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.company_task(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.metric
    ADD CONSTRAINT metric_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.narrative
    ADD CONSTRAINT narrative_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.company_categories(id) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE ONLY public.narrative
    ADD CONSTRAINT narrative_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON UPDATE RESTRICT;
ALTER TABLE ONLY public.narrative
    ADD CONSTRAINT narrative_created_by_fkey FOREIGN KEY (created_by) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE ONLY public.narrative_datasets
    ADD CONSTRAINT narrative_datasets_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.dataset(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.narrative_datasets
    ADD CONSTRAINT narrative_datasets_narrative_id_fkey FOREIGN KEY (narrative_id) REFERENCES public.narrative(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.narrative
    ADD CONSTRAINT narrative_metric_id_fkey FOREIGN KEY (metric_id) REFERENCES public.metric(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.narrative_narratives
    ADD CONSTRAINT narrative_narratives_depends_on_narrative_id_fkey FOREIGN KEY (depends_on_narrative_id) REFERENCES public.narrative(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.narrative_narratives
    ADD CONSTRAINT narrative_narratives_narrative_id_fkey FOREIGN KEY (narrative_id) REFERENCES public.narrative(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.narrative
    ADD CONSTRAINT narrative_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE ONLY public.narrative_runs
    ADD CONSTRAINT narrative_runs_narrative_slug_company_id_fkey FOREIGN KEY (narrative_slug, company_id) REFERENCES public.narrative(slug, company_id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.narrative
    ADD CONSTRAINT narrative_state_fkey FOREIGN KEY (state) REFERENCES public.status(value) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE ONLY public.narrative
    ADD CONSTRAINT narrative_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.company_task(id) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE ONLY public.narrative_template
    ADD CONSTRAINT narrative_template_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE ONLY public.narrative_template
    ADD CONSTRAINT narrative_template_created_by_fkey FOREIGN KEY (created_by) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE ONLY public.narrative_template
    ADD CONSTRAINT narrative_template_kind_fkey FOREIGN KEY (kind) REFERENCES public.narrative_template_kinds(value) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.narrative_template
    ADD CONSTRAINT narrative_template_state_fkey FOREIGN KEY (state) REFERENCES public.narrative_template_states(value) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE ONLY public.narrative
    ADD CONSTRAINT narrative_type_fkey FOREIGN KEY (type) REFERENCES public.narrative_types(value) ON UPDATE CASCADE;
ALTER TABLE ONLY public.narrative
    ADD CONSTRAINT narrative_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public."user"(id);
ALTER TABLE ONLY public.query_template
    ADD CONSTRAINT query_template_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public."user"(id) ON UPDATE SET NULL ON DELETE SET NULL;
ALTER TABLE ONLY public.query_updates
    ADD CONSTRAINT query_updates_transformation_id_fkey FOREIGN KEY (transformation_id) REFERENCES public.transformation(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.query_updates
    ADD CONSTRAINT query_updates_update_kind_fkey FOREIGN KEY (update_kind) REFERENCES public.transformation_update_types(value) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.question_answer
    ADD CONSTRAINT question_answer_related_to_fkey FOREIGN KEY (related_to) REFERENCES public.question_answer_relations(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.question_answer
    ADD CONSTRAINT question_answer_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public."user"(id);
ALTER TABLE ONLY public.service_limit
    ADD CONSTRAINT service_limit_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sql_queries
    ADD CONSTRAINT sql_queries_related_kind_fkey FOREIGN KEY (related_kind) REFERENCES public.sql_query_kinds(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.sql_queries
    ADD CONSTRAINT sql_queries_related_to_fkey FOREIGN KEY (related_to) REFERENCES public.sql_query_relations(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_related_to_fkey FOREIGN KEY (related_to) REFERENCES public.tag_relations(value) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.company_tags(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.task_execution
    ADD CONSTRAINT task_execution_status_fkey FOREIGN KEY (status) REFERENCES public.task_execution_status(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.task_execution
    ADD CONSTRAINT task_execution_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.company_task(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.transformation_test
    ADD CONSTRAINT tests_status_fkey FOREIGN KEY (status) REFERENCES public.transformation_test_status(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.transformation_test
    ADD CONSTRAINT tests_transformation_id_fkey FOREIGN KEY (transformation_id) REFERENCES public.transformation(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.tranformation_enriched_activities
    ADD CONSTRAINT tranformation_enriched_activities_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activity(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.tranformation_enriched_activities
    ADD CONSTRAINT tranformation_enriched_activities_transformation_id_fkey FOREIGN KEY (transformation_id) REFERENCES public.transformation(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.transformation_activities
    ADD CONSTRAINT transformation_activities_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activity(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.transformation_activities
    ADD CONSTRAINT transformation_activities_transformation_id_fkey FOREIGN KEY (transformation_id) REFERENCES public.transformation(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.transformation
    ADD CONSTRAINT transformation_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.company_categories(id) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE ONLY public.transformation
    ADD CONSTRAINT transformation_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.transformation_depends_on
    ADD CONSTRAINT transformation_depends_on_depends_on_tranformation_id_fkey FOREIGN KEY (depends_on_transformation_id) REFERENCES public.transformation(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.transformation_depends_on
    ADD CONSTRAINT transformation_depends_on_transformation_id_fkey FOREIGN KEY (transformation_id) REFERENCES public.transformation(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.transformation
    ADD CONSTRAINT transformation_kind_fkey FOREIGN KEY (kind) REFERENCES public.transformation_kinds(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.transformation_maintenance
    ADD CONSTRAINT transformation_maintenance_kind_fkey FOREIGN KEY (kind) REFERENCES public.maintenance_kinds(value) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.transformation_maintenance
    ADD CONSTRAINT transformation_maintenance_transformation_id_fkey FOREIGN KEY (transformation_id) REFERENCES public.transformation(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.transformation_run_after
    ADD CONSTRAINT transformation_run_after_run_after_transformation_id_fkey FOREIGN KEY (run_after_transformation_id) REFERENCES public.transformation(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.transformation_run_after
    ADD CONSTRAINT transformation_run_after_transformation_id_fkey FOREIGN KEY (transformation_id) REFERENCES public.transformation(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.transformation_test
    ADD CONSTRAINT transformation_test_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public."user"(id);
ALTER TABLE ONLY public.transformation
    ADD CONSTRAINT transformation_update_type_fkey FOREIGN KEY (update_type) REFERENCES public.transformation_update_types(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.transformation
    ADD CONSTRAINT transformation_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public."user"(id);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_accepted_terms_version_fkey FOREIGN KEY (accepted_terms_version) REFERENCES public.document_revision(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_role_fkey FOREIGN KEY (role) REFERENCES public.user_role(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.watcher
    ADD CONSTRAINT watcher_related_to_fkey FOREIGN KEY (related_to) REFERENCES public.watcher_relation(value) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.watcher
    ADD CONSTRAINT watcher_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);

-- Set up enum table values
-- Hasura will fail if these tables are empty, and the values are not part of the schema by default

INSERT INTO company_status (value, description) VALUES
    ('new', 'pending onboarding'),
    ('onboarding', 'actively onboarding'),
    ('active', 'live company'),
    ('archived', 'archived company')
ON CONFLICT (value) DO NOTHING;

INSERT INTO user_role (value, description) VALUES
    ('user', 'normal user'),
    ('internal', 'narrator internal user or service'),
    ('internal_admin', 'narrator internal super admin')
ON CONFLICT (value) DO NOTHING;;

INSERT INTO company_user_role (value, description) VALUES
    ('user', 'company user'),
    ('admin', 'company admin')
ON CONFLICT (value) DO NOTHING;;

INSERT INTO activity_status (value) VALUES
    ('live'),
    ('ignored')
ON CONFLICT (value) DO NOTHING;


INSERT INTO company_config_core_version (value) VALUES
    ('v4')
ON CONFLICT (value) DO NOTHING;


INSERT INTO company_config_batch_version (value) VALUES
    ('v2')
ON CONFLICT (value) DO NOTHING;

INSERT INTO company_config_warehouse_language (value) VALUES
    ('redshift'),
    ('bigquery'),
    ('snowflake'),
    ('pg'),
    ('mysql'),
    ('athena'),
    ('clickhouse'),
    ('druid'),
    ('mssql_odbc'),
    ('databricks')
ON CONFLICT (value) DO NOTHING;

INSERT INTO transformation_update_types (value, description) VALUES
    ('regular', 'Inserts all the new data by the last timestamp (Incremental)'),
    ('mutable', 'Updates by diffing the tranformation and the output table (only for the data in the mutable time window). If there is data in the transformation not in the production table, it will insert it'),
    ('single_run', 'Runs the data once and doesn''t update it in subsequent runs'),
    ('materialized_view', 'Creates a table based on the transformation and updates it everything time the transformation runs'),
    ('view', 'Creates a view ')
ON CONFLICT (value) DO NOTHING;

INSERT INTO transformation_test_status (value) VALUES
  ('Running'), ('Failed'), ('Passed')
ON CONFLICT (value) DO NOTHING;


INSERT INTO column_rename_relations (value) VALUES
    ('transformation'), ('activity')
ON CONFLICT (value) DO NOTHING;

INSERT INTO job_execution_status (value) VALUES
    ('pending'), ('running'), ('complete'), ('failed'), ('cancelled')
ON CONFLICT (value) DO NOTHING;


INSERT INTO task_execution_status (value) VALUES
  ('pending'), ('running'), ('complete'), ('failed'), ('cancelled')
ON CONFLICT (value) DO NOTHING;
  
INSERT INTO company_task_category (value, description) VALUES
    ('processing', NULL),
    ('narratives', NULL),
    ('materializations', NULL),
    ('alerts', 'Validation Alert Queries')
ON CONFLICT (value) DO NOTHING;

INSERT INTO watcher_relation VALUES 
    ('company_task', NULL),
    ('dataset', NULL),
    ('narrative', NULL)
ON CONFLICT (value) DO NOTHING;

INSERT INTO tag_relations (value) VALUES
    ('activity'),
    ('transformation')
ON CONFLICT (value) DO NOTHING;

INSERT INTO transformation_kinds (value, description) VALUES
    ('stream', 'Updates the activity Stream'),
    ('enrichment', 'Creates/Updates Enrichment tables'),
    ('customer_attribute', 'Updates/creates Customer Attribute tables'),
    ('spend', NULL)
ON CONFLICT (value) DO NOTHING;

INSERT INTO narrative_template_kinds VALUES 
    ('hard_coded', 'Used to answer 1 question at a given time for 1 company'),
    ('conditional', 'Can answer the same question (exact same activities) but will have different recommendations'),
    ('generic', 'Can answer many questiosn for many companies and makes decisions')
ON CONFLICT (value) DO NOTHING;

INSERT INTO narrative_template_states (value) VALUES
   ('draft'),
   ('published'),
   ('published_globally'),
   ('archived')
ON CONFLICT (value) DO NOTHING;

INSERT INTO narrative_types VALUES 
    ('kpi', 'Explains a single KPI'),
    ('lever', 'A hypothese designed to optimize a KPI'),
    ('standalone', 'An independent Narrative')
ON CONFLICT (value) DO NOTHING;

INSERT INTO "status" (value) VALUES
    ('live'),
    ('archived'),
    ('internal_only'),
    ('in_progress')
ON CONFLICT (value) DO NOTHING;

INSERT INTO company_timeline_relations VALUES 
    ('narrative', 'Actions on the Narratives')
ON CONFLICT (value) DO NOTHING;

INSERT INTO sql_query_relations (value) VALUES
    ('transformation'), ('activity'), ('company')
ON CONFLICT (value) DO NOTHING;

INSERT INTO maintenance_kinds (value, description) VALUES
    ('resynced', 'Activity is syncing data due to a push to production'),
    ('cascade_resynced', 'Activity was resynced due to a shared dependency'),
    ('query_failed', 'Activity is failing due to a query error'),
    ('duplicated_id', 'Activity has duplicate activity_id values'),
    ('anomaly_detected', 'Activity is tied to a tranformation that has an triggered an anomaly'),
    ('custom_alert', 'Activity has a custom alert that failed'),
    ('manually_added', 'Activity is currently put under maintenance by internal team')
ON CONFLICT (value) DO NOTHING;

INSERT INTO materialization_type (value, description) VALUES
    ('gsheets', NULL),
    ('materialized_view', NULL),
    ('view', NULL),
    ('webhook', NULL),
    ('text', 'Sends A Text Message'),
    ('csv', 'sends a link with a downlaod to the csv'),
    ('klaviyo', NULL),
    ('sendgrid', NULL),
    ('postmark', NULL)
ON CONFLICT (value) DO NOTHING;

INSERT INTO question_answer_relations (value) VALUES
    ('transformation'), ('activity')
ON CONFLICT (value) DO NOTHING;

INSERT INTO sql_query_kinds (value, description) VALUES
    ('production', 'Is a production version of a query and will run in production'),
    ('validation', 'Is a user defined test'),
    ('scratchpad', 'Is a query used in the creation process of writing a script'),
    ('current', 'Is the current version of the script')
ON CONFLICT (value) DO NOTHING;

INSERT INTO company_query_alert_kinds Values
    ('returns_no_rows', 'The query returns 0 rows'),
    ('returns_rows', 'The query returns more than 0 rows')
ON CONFLICT (value) DO NOTHING;

INSERT INTO company_job_execution_environment (value) VALUES
  ('batch'), ('lambda')
ON CONFLICT (value) DO NOTHING;

-- Enable auditing on these tables
-- See https://github.com/hasura/audit-trigger

select audit.audit_table('company');
select audit.audit_table('company_status');
select audit.audit_table('company_user');
select audit.audit_table('company_user_preferences');
select audit.audit_table('company_resources');
select audit.audit_table('company_sso');
select audit.audit_table('company_job');
select audit.audit_table('company_prototypes');
select audit.audit_table('company_table');
select audit.audit_table('company_tags');
select audit.audit_table('company_task');
select audit.audit_table('company_timeline');
select audit.audit_table('user');
select audit.audit_table('activity');
select audit.audit_table('transformation');
select audit.audit_table('transformation_activities');
select audit.audit_table('tranformation_enriched_activities');
select audit.audit_table('transformation_maintenance');
select audit.audit_table('dataset');
select audit.audit_table('dataset_activities');
select audit.audit_table('dataset_materialization');
select audit.audit_table('narrative');
select audit.audit_table('narrative_datasets');
select audit.audit_table('narrative_narratives');
select audit.audit_table('narrative_template');
select audit.audit_table('metric');
select audit.audit_table('document_revision');
select audit.audit_table('service_limit');
select audit.audit_table('sql_queries');
select audit.audit_table('tag');
