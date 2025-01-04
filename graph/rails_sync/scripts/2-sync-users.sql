INSERT into "user" (id, email, created_at, updated_at, role)
SELECT id, email, created_at AT TIME ZONE 'UTC' as created_at, updated_at AT TIME ZONE 'UTC' as updated_at,
	CASE when super_admin = true then 'internal_admin'
		 else 'user'
	END as role
from rails_sync.users
ON CONFLICT DO NOTHING   