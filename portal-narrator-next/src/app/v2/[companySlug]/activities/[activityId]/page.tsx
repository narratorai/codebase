import { auth0 } from '@/util/server/auth0'

async function ActivityPage() {
  return <div></div>
}

export default auth0.withPageAuthRequired(ActivityPage)
