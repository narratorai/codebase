INSERT INTO company (id, name, slug, created_at, updated_at, s3_bucket, status)
SELECT
	id, name, slug, created_at AT TIME ZONE 'UTC' as created_at, updated_at AT TIME ZONE 'UTC' as updated_at, s3_bucket,
	CASE when status = 'live' then 'active'
		 else status
	END
from rails_sync.companies
ON CONFLICT DO NOTHING