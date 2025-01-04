INSERT INTO company_user (id, company_id, user_id, first_name, last_name, phone, created_at, updated_at, role)
SELECT cu.id, cu.company_id, cu.user_id, u.first_name, u.last_name, u.phone, cu.created_at AT TIME ZONE 'UTC' as created_at, cu.updated_at AT TIME ZONE 'UTC' as updated_at,
    CASE WHEN u.company_admin = true THEN 'admin'
	    ELSE 'user'
    END as role
from rails_sync.companies_users as cu
LEFT JOIN rails_sync.users as u
ON cu.user_id = u.id
ON CONFLICT DO NOTHING
