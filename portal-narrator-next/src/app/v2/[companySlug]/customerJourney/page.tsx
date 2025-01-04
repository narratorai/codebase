import { auth0 } from '@/util/server/auth0'

async function CustomerJourneyIndexPage() {
  return <div></div>
}

export default auth0.withPageAuthRequired(CustomerJourneyIndexPage)
