WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE s.activity = 'added_to_crm'
),
ever_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE s.activity in ('call', 'click_docsend', 'deal_created', 'lead_funnel_entered', 'marketplace_signup', 'newsletter_subscription', 'opened_email', 'received_email', 'sales_meeting', 'sent_email', 'transaction', 'voicemail')
),
cohort AS (
	SELECT
		s.activity_id
		, s.ts AS "timestamp"
		, s.customer
		, NVL(s.customer, s.anonymous_customer_id) AS "unique_identifier"
		, s.link
		, ROW_NUMBER() over (PARTITION by NVL(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "activity_occurrence"
		, customer_table_tbl.full_name
		, customer_table_tbl.owner_name
		, customer_table_tbl.crm_url
		, customer_table_tbl.investor_channel
		, customer_table_tbl.lead_source
		, customer_table_tbl.organisation_name
		, customer_table_tbl.lead_qualification
		, customer_table_tbl.lead_quality
		, customer_table_tbl.primary_email
		, customer_table_tbl.primary_phone_number
		, NVL(s.customer, s.anonymous_customer_id) AS "join_customer"
		, s.ts AS "join_ts"
		, s.activity_id AS "join_cohort_id"
	FROM cohort_stream AS s
	LEFT JOIN test_schema.customer_table AS customer_table_tbl
		ON s.customer = customer_table_tbl.customer
),
append_ever AS (
	SELECT
		NVL(s.customer, s.anonymous_customer_id) AS "join_customer"
		, COUNT(CASE WHEN ( s.activity = 'call' AND CAST(s.feature_json."a2" AS VARCHAR(4096)) = 'Connected' ) THEN s.ts END) AS "total_calls_ever"
		, COUNT(CASE WHEN s.activity = 'voicemail' THEN s.ts END) AS "total_voicemails_ever"
		, MAX(CASE WHEN ( s.activity = 'call' AND CAST(s.feature_json."a2" AS VARCHAR(4096)) = 'Connected' ) THEN s.ts END) AS "last_ever_calls_timestamp"
		, MAX(CASE WHEN s.activity = 'voicemail' THEN s.ts END) AS "last_ever_voicemails_timestamp"
		, COUNT(CASE WHEN ( s.activity = 'opened_email' AND CAST(s.feature_json."a3" AS VARCHAR(4096)) ilike '%mailbox%' ) THEN s.ts END) AS "total_opened_emails_ever"
		, MAX(CASE WHEN ( s.activity = 'opened_email' AND CAST(s.feature_json."a3" AS VARCHAR(4096)) ilike '%mailbox%' ) THEN s.ts END) AS "last_ever_opened_emails_timestamp"
		, COUNT(CASE WHEN s.activity = 'click_docsend' THEN s.ts END) AS "total_clicked_docsends_ever"
		, MAX(CASE WHEN s.activity = 'click_docsend' THEN s.ts END) AS "last_ever_clicked_docsends_timestamp"
		, COUNT(CASE WHEN ( s.activity = 'transaction' AND CAST(CAST(s.feature_json."a2" AS VARCHAR(4096)) AS FLOAT) > 0.0 ) THEN s.ts END) AS "total_transactions_ever"
		, SUM(CASE WHEN ( s.activity = 'transaction' AND CAST(CAST(s.feature_json."a2" AS VARCHAR(4096)) AS FLOAT) > 0.0 ) THEN CAST(CAST(s.feature_json."a2" AS VARCHAR(4096)) AS FLOAT) END) AS "sum_of_transaction_volume_usd_ever"
		, MAX(CASE WHEN ( s.activity = 'transaction' AND CAST(CAST(s.feature_json."a2" AS VARCHAR(4096)) AS FLOAT) > 0.0 ) THEN s.ts END) AS "last_ever_transactions_timestamp"
		, MAX(CASE WHEN s.activity = 'marketplace_signup' THEN s.ts END) AS "last_ever_marketplace_signups_timestamp"
		, NULLIF(SUBSTRING(MAX(CASE WHEN s.activity = 'marketplace_signup' THEN CONCAT(LEFT(s.ts, 19), NVL(CAST(s.feature_json."a1" AS VARCHAR(4096)),'')) END ),20, 1000),'') AS "last_ever_how_did_you_hear_about_us"
		, COUNT(CASE WHEN s.activity = 'deal_created' THEN s.ts END) AS "total_deal_createds_ever"
		, MAX(CASE WHEN s.activity = 'deal_created' THEN s.ts END) AS "last_ever_deal_createds_timestamp"
		, NULLIF(SUBSTRING(MAX(CASE WHEN s.activity = 'deal_created' THEN CONCAT(LEFT(s.ts, 19), NVL(CAST(s.feature_json."a3" AS VARCHAR(4096)),'')) END ),20, 1000),'') AS "last_ever_deal_channel"
		, NULLIF(SUBSTRING(MAX(CASE WHEN s.activity = 'deal_created' THEN CONCAT(LEFT(s.ts, 19), NVL(s.link,'')) END ),20, 1000),'') AS "last_ever_deal_createds_link"
		, MIN(CASE WHEN s.activity = 'lead_funnel_entered' THEN s.ts END) AS "first_ever_lead_funnel_entereds_timestamp"
		, MIN(CASE WHEN s.activity = 'newsletter_subscription' THEN s.ts END) AS "first_ever_subscribed_to_newsletters_timestamp"
		, COUNT(CASE WHEN ( s.activity = 'received_email' AND CAST(s.feature_json."a3" AS VARCHAR(4096)) ilike '%mailbox%' ) THEN s.ts END) AS "total_received_emails_ever"
		, MAX(CASE WHEN ( s.activity = 'received_email' AND CAST(s.feature_json."a3" AS VARCHAR(4096)) ilike '%mailbox%' ) THEN s.ts END) AS "last_ever_received_emails_timestamp"
		, COUNT(CASE WHEN s.activity = 'sent_email' THEN s.ts END) AS "total_sent_emails_ever"
		, MAX(CASE WHEN s.activity = 'sent_email' THEN s.ts END) AS "last_ever_sent_emails_timestamp"
		, COUNT(CASE WHEN s.activity = 'sales_meeting' THEN s.ts END) AS "total_sales_meetings_ever"
		, MAX(CASE WHEN s.activity = 'sales_meeting' THEN s.ts END) AS "last_ever_sales_meetings_timestamp"
	FROM ever_stream AS s
	GROUP BY NVL(s.customer, s.anonymous_customer_id)
)
SELECT
	*
	, CASE
 				WHEN (  days_since_last_transaction >= 0  AND days_since_last_transaction < 30  ) THEN  '0-30'
 				WHEN (  days_since_last_transaction >= 31  AND days_since_last_transaction < 60  ) THEN  '31-60'
 				WHEN (  days_since_last_transaction >= 61  AND days_since_last_transaction < 90  ) THEN  '61-90'
 				WHEN (  days_since_last_transaction >= 91  AND days_since_last_transaction < 180  ) THEN  '90-180'
 				WHEN (  days_since_last_transaction >= 181  AND days_since_last_transaction < 365  ) THEN  '181-365'
 				WHEN (  days_since_last_transaction >= 365  AND days_since_last_transaction < 3000  ) THEN  '365+'
 				ELSE  'Other'
 			END AS "last_transaction_bins"
	, CASE
 				WHEN (  days_since_last_call >= 0  AND days_since_last_call < 30  ) THEN  '0-30'
 				WHEN (  days_since_last_call >= 31  AND days_since_last_call < 60  ) THEN  '31-60'
 				WHEN (  days_since_last_call >= 61  AND days_since_last_call < 90  ) THEN  '61-90'
 				WHEN (  days_since_last_call >= 91  AND days_since_last_call < 180  ) THEN  '90-180'
 				WHEN (  days_since_last_call >= 181  AND days_since_last_call < 365  ) THEN  '181-365'
 				WHEN (  days_since_last_call >= 365  AND days_since_last_call < 3000  ) THEN  '365+'
 				ELSE  'Other'
 			END AS "last_call_bins"
	, CASE
 				WHEN (  days_since_last_voicemail >= 0  AND days_since_last_voicemail < 30  ) THEN  '0-30'
 				WHEN (  days_since_last_voicemail >= 31  AND days_since_last_voicemail < 60  ) THEN  '31-60'
 				WHEN (  days_since_last_voicemail >= 61  AND days_since_last_voicemail < 90  ) THEN  '61-90'
 				WHEN (  days_since_last_voicemail >= 91  AND days_since_last_voicemail < 180  ) THEN  '90-180'
 				WHEN (  days_since_last_voicemail >= 181  AND days_since_last_voicemail < 365  ) THEN  '181-365'
 				WHEN (  days_since_last_voicemail >= 365  AND days_since_last_voicemail < 3000  ) THEN  '365+'
 				ELSE  'Other'
 			END AS "last_voicemail_bins"
	, CASE
 				WHEN (  days_since_last_received_email >= 0  AND days_since_last_received_email < 30  ) THEN  '0-30'
 				WHEN (  days_since_last_received_email >= 31  AND days_since_last_received_email < 60  ) THEN  '31-60'
 				WHEN (  days_since_last_received_email >= 61  AND days_since_last_received_email < 90  ) THEN  '61-90'
 				WHEN (  days_since_last_received_email >= 91  AND days_since_last_received_email < 180  ) THEN  '90-180'
 				WHEN (  days_since_last_received_email >= 181  AND days_since_last_received_email < 365  ) THEN  '181-365'
 				WHEN (  days_since_last_received_email >= 365  AND days_since_last_received_email < 3000  ) THEN  '365+'
 				ELSE  'Other'
 			END AS "last_email_received_bins"
	, CASE
 				WHEN (  days_since_last_sent_email >= 0  AND days_since_last_sent_email < 30  ) THEN  '0-30'
 				WHEN (  days_since_last_sent_email >= 31  AND days_since_last_sent_email < 60  ) THEN  '31-60'
 				WHEN (  days_since_last_sent_email >= 61  AND days_since_last_sent_email < 90  ) THEN  '61-90'
 				WHEN (  days_since_last_sent_email >= 91  AND days_since_last_sent_email < 180  ) THEN  '90-180'
 				WHEN (  days_since_last_sent_email >= 181  AND days_since_last_sent_email < 365  ) THEN  '181-365'
 				WHEN (  days_since_last_sent_email >= 365  AND days_since_last_sent_email < 3000  ) THEN  '365+'
 				ELSE  'Other'
 			END AS "last_email_sent_bins"
	, CASE
 				WHEN (  days_since_last_docsend >= 0  AND days_since_last_docsend < 30  ) THEN  '0-30'
 				WHEN (  days_since_last_docsend >= 31  AND days_since_last_docsend < 60  ) THEN  '31-60'
 				WHEN (  days_since_last_docsend >= 61  AND days_since_last_docsend < 90  ) THEN  '61-90'
 				WHEN (  days_since_last_docsend >= 91  AND days_since_last_docsend < 180  ) THEN  '90-180'
 				WHEN (  days_since_last_docsend >= 181  AND days_since_last_docsend < 365  ) THEN  '181-365'
 				WHEN (  days_since_last_docsend >= 365  AND days_since_last_docsend < 3000  ) THEN  '365+'
 				ELSE  'Other'
 			END AS "last_docsend_click_bins"
	, CASE
 				WHEN (  days_since_last_email_open >= 0  AND days_since_last_email_open < 30  ) THEN  '0-30'
 				WHEN (  days_since_last_email_open >= 31  AND days_since_last_email_open < 60  ) THEN  '31-60'
 				WHEN (  days_since_last_email_open >= 61  AND days_since_last_email_open < 90  ) THEN  '61-90'
 				WHEN (  days_since_last_email_open >= 91  AND days_since_last_email_open < 180  ) THEN  '90-180'
 				WHEN (  days_since_last_email_open >= 181  AND days_since_last_email_open < 365  ) THEN  '181-365'
 				WHEN (  days_since_last_email_open >= 365  AND days_since_last_email_open < 3000  ) THEN  '365+'
 				ELSE  'Other'
 			END AS "last_mktg_email_open_bins"
	, CASE
 				WHEN (  days_since_mp_signup >= 0  AND days_since_mp_signup < 30  ) THEN  '0-30'
 				WHEN (  days_since_mp_signup >= 31  AND days_since_mp_signup < 60  ) THEN  '31-60'
 				WHEN (  days_since_mp_signup >= 61  AND days_since_mp_signup < 90  ) THEN  '61-90'
 				WHEN (  days_since_mp_signup >= 91  AND days_since_mp_signup < 180  ) THEN  '90-180'
 				WHEN (  days_since_mp_signup >= 181  AND days_since_mp_signup < 365  ) THEN  '181-365'
 				WHEN (  days_since_mp_signup >= 365  AND days_since_mp_signup < 3000  ) THEN  '365+'
 				ELSE  'Other'
 			END AS "last_mp_signup_bins"
	, CASE
 				WHEN (  days_since_last_product_deal_created >= 0  AND days_since_last_product_deal_created < 30  ) THEN  '0-30'
 				WHEN (  days_since_last_product_deal_created >= 31  AND days_since_last_product_deal_created < 60  ) THEN  '31-60'
 				WHEN (  days_since_last_product_deal_created >= 61  AND days_since_last_product_deal_created < 90  ) THEN  '61-90'
 				WHEN (  days_since_last_product_deal_created >= 91  AND days_since_last_product_deal_created < 180  ) THEN  '90-180'
 				WHEN (  days_since_last_product_deal_created >= 181  AND days_since_last_product_deal_created < 365  ) THEN  '181-365'
 				WHEN (  days_since_last_product_deal_created >= 365  AND days_since_last_product_deal_created < 3000  ) THEN  '365+'
 				ELSE  'Other'
 			END AS "last_product_deal_created_bins"
	, CASE
 				WHEN (  days_since_last_meeting >= 0  AND days_since_last_meeting < 30  ) THEN  '0-30'
 				WHEN (  days_since_last_meeting >= 31  AND days_since_last_meeting < 60  ) THEN  '31-60'
 				WHEN (  days_since_last_meeting >= 61  AND days_since_last_meeting < 90  ) THEN  '61-90'
 				WHEN (  days_since_last_meeting >= 91  AND days_since_last_meeting < 180  ) THEN  '90-180'
 				WHEN (  days_since_last_meeting >= 181  AND days_since_last_meeting < 365  ) THEN  '181-365'
 				WHEN (  days_since_last_meeting >= 365  AND days_since_last_meeting < 3000  ) THEN  '365+'
 				ELSE  'Other'
 			END AS "last_meeting_bins"
	, CASE
 				WHEN (  days_since_lead_funnel_entered >= 0  AND days_since_lead_funnel_entered < 30  ) THEN  '0-30'
 				WHEN (  days_since_lead_funnel_entered >= 31  AND days_since_lead_funnel_entered < 60  ) THEN  '31-60'
 				WHEN (  days_since_lead_funnel_entered >= 61  AND days_since_lead_funnel_entered < 90  ) THEN  '61-90'
 				WHEN (  days_since_lead_funnel_entered >= 91  AND days_since_lead_funnel_entered < 180  ) THEN  '90-180'
 				WHEN (  days_since_lead_funnel_entered >= 181  AND days_since_lead_funnel_entered < 365  ) THEN  '181-365'
 				WHEN (  days_since_lead_funnel_entered >= 365  AND days_since_lead_funnel_entered < 3000  ) THEN  '365+'
 				ELSE  'Other'
 			END AS "lead_funnel_entered_bins"
FROM (
	SELECT
		c.activity_id
		, c."timestamp"
		, c.customer
		, c.unique_identifier
		, c.link
		, c.activity_occurrence
		, c.full_name
		, c.owner_name
		, c.crm_url
		, c.investor_channel
		, c.lead_source
		, c.organisation_name
		, c.lead_qualification
		, c.lead_quality
		, c.primary_email
		, c.primary_phone_number
		, NVL(ever.total_calls_ever, 0) AS "total_calls_ever"
		, NVL(ever.total_voicemails_ever, 0) AS "total_voicemails_ever"
		, ever.last_ever_calls_timestamp
		, ever.last_ever_voicemails_timestamp
		, NVL(ever.total_opened_emails_ever, 0) AS "total_opened_emails_ever"
		, ever.last_ever_opened_emails_timestamp
		, NVL(ever.total_clicked_docsends_ever, 0) AS "total_clicked_docsends_ever"
		, ever.last_ever_clicked_docsends_timestamp
		, NVL(ever.total_transactions_ever, 0) AS "total_transactions_ever"
		, NVL(ever.sum_of_transaction_volume_usd_ever, 0) AS "sum_of_transaction_volume_usd_ever"
		, ever.last_ever_transactions_timestamp
		, ever.last_ever_marketplace_signups_timestamp
		, ever.last_ever_how_did_you_hear_about_us
		, NVL(ever.total_deal_createds_ever, 0) AS "total_deal_createds_ever"
		, ever.last_ever_deal_createds_timestamp
		, ever.last_ever_deal_channel
		, ever.last_ever_deal_createds_link
		, ever.first_ever_lead_funnel_entereds_timestamp
		, ever.first_ever_subscribed_to_newsletters_timestamp
		, NVL(ever.total_received_emails_ever, 0) AS "total_received_emails_ever"
		, ever.last_ever_received_emails_timestamp
		, NVL(ever.total_sent_emails_ever, 0) AS "total_sent_emails_ever"
		, ever.last_ever_sent_emails_timestamp
		, NVL(ever.total_sales_meetings_ever, 0) AS "total_sales_meetings_ever"
		, ever.last_ever_sales_meetings_timestamp
		, CASE WHEN last_ever_calls_timestamp is not NULL THEN 1 ELSE 0 END AS "did_call_ever"
		, FLOOR(DATE_DIFF('second', join_ts, last_ever_calls_timestamp)/86400) AS "days_to_call"
		, CASE WHEN last_ever_voicemails_timestamp is not NULL THEN 1 ELSE 0 END AS "did_voicemail_ever"
		, FLOOR(DATE_DIFF('second', join_ts, last_ever_voicemails_timestamp)/86400) AS "days_to_voicemail"
		, CASE WHEN last_ever_opened_emails_timestamp is not NULL THEN 1 ELSE 0 END AS "did_opened_email_ever"
		, FLOOR(DATE_DIFF('second', join_ts, last_ever_opened_emails_timestamp)/86400) AS "days_to_opened_email"
		, CASE WHEN last_ever_clicked_docsends_timestamp is not NULL THEN 1 ELSE 0 END AS "did_clicked_docsend_ever"
		, FLOOR(DATE_DIFF('second', join_ts, last_ever_clicked_docsends_timestamp)/86400) AS "days_to_clicked_docsend"
		, CASE WHEN last_ever_transactions_timestamp is not NULL THEN 1 ELSE 0 END AS "did_transaction_ever"
		, FLOOR(DATE_DIFF('second', join_ts, last_ever_transactions_timestamp)/86400) AS "days_to_transaction"
		, CASE WHEN last_ever_marketplace_signups_timestamp is not NULL THEN 1 ELSE 0 END AS "did_marketplace_signup_ever"
		, FLOOR(DATE_DIFF('second', join_ts, last_ever_marketplace_signups_timestamp)/86400) AS "days_to_marketplace_signup"
		, CASE WHEN last_ever_deal_createds_timestamp is not NULL THEN 1 ELSE 0 END AS "did_deal_created_ever"
		, FLOOR(DATE_DIFF('second', join_ts, last_ever_deal_createds_timestamp)/86400) AS "days_to_deal_created"
		, CASE WHEN first_ever_lead_funnel_entereds_timestamp is not NULL THEN 1 ELSE 0 END AS "did_lead_funnel_entered_ever"
		, FLOOR(DATE_DIFF('second', first_ever_lead_funnel_entereds_timestamp, join_ts)/86400) AS "days_from_lead_funnel_entered"
		, CASE WHEN first_ever_subscribed_to_newsletters_timestamp is not NULL THEN 1 ELSE 0 END AS "did_subscribed_to_newsletter_ever"
		, FLOOR(DATE_DIFF('second', first_ever_subscribed_to_newsletters_timestamp, join_ts)/86400) AS "days_from_subscribed_to_newsletter"
		, CASE WHEN last_ever_received_emails_timestamp is not NULL THEN 1 ELSE 0 END AS "did_received_email_ever"
		, FLOOR(DATE_DIFF('second', join_ts, last_ever_received_emails_timestamp)/86400) AS "days_to_received_email"
		, CASE WHEN last_ever_sent_emails_timestamp is not NULL THEN 1 ELSE 0 END AS "did_sent_email_ever"
		, FLOOR(DATE_DIFF('second', join_ts, last_ever_sent_emails_timestamp)/86400) AS "days_to_sent_email"
		, CASE WHEN last_ever_sales_meetings_timestamp is not NULL THEN 1 ELSE 0 END AS "did_sales_meeting_ever"
		, FLOOR(DATE_DIFF('second', join_ts, last_ever_sales_meetings_timestamp)/86400) AS "days_to_sales_meeting"
		, DATE_TRUNC('month', "timestamp") AS "month"
		, FLOOR(DATE_DIFF('second', last_ever_transactions_timestamp, SYSDATE)/86400) AS "days_since_last_transaction"
		, FLOOR(DATE_DIFF('second', last_ever_clicked_docsends_timestamp, SYSDATE)/86400) AS "days_since_last_docsend"
		, FLOOR(DATE_DIFF('second', last_ever_opened_emails_timestamp, SYSDATE)/86400) AS "days_since_last_email_open"
		, FLOOR(DATE_DIFF('second', last_ever_received_emails_timestamp, SYSDATE)/86400) AS "days_since_last_received_email"
		, FLOOR(DATE_DIFF('second', last_ever_sent_emails_timestamp, SYSDATE)/86400) AS "days_since_last_sent_email"
		, FLOOR(DATE_DIFF('second', last_ever_voicemails_timestamp, SYSDATE)/86400) AS "days_since_last_voicemail"
		, FLOOR(DATE_DIFF('second', last_ever_calls_timestamp, SYSDATE)/86400) AS "days_since_last_call"
		, FLOOR(DATE_DIFF('second', "timestamp", SYSDATE)/86400) AS "days_since_added_to_crm"
		, FLOOR(DATE_DIFF('second', last_ever_marketplace_signups_timestamp, SYSDATE)/86400) AS "days_since_mp_signup"
		, FLOOR(DATE_DIFF('second', last_ever_deal_createds_timestamp, SYSDATE)/86400) AS "days_since_last_product_deal_created"
		, FLOOR(DATE_DIFF('second', last_ever_sales_meetings_timestamp, SYSDATE)/86400) AS "days_since_last_meeting"
		, FLOOR(DATE_DIFF('second', first_ever_lead_funnel_entereds_timestamp, SYSDATE)/86400) AS "days_since_lead_funnel_entered"
	FROM cohort AS c
	LEFT JOIN append_ever AS ever
		ON c.join_customer = ever.join_customer
)
