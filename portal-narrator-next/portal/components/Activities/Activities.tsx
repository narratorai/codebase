import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Redirect, RouteChildrenProps, Switch, useHistory } from 'react-router-dom'
import Route from 'util/route'

import ActivityIndexV2 from './v2/ActivityIndexV2'

const Activities = ({ match }: RouteChildrenProps) => {
  const { isCompanyAdmin } = useUser()
  const company = useCompany()
  const history = useHistory()

  // Don't allow non-admins to edit activities
  const isEditPage = history.location.pathname.includes(`/${company.slug}/activities/edit`)
  if (!isCompanyAdmin && isEditPage) {
    history.replace({
      pathname: `/${company.slug}/activities`,
    })
  }

  return (
    <Switch>
      <Redirect exact from={`${match?.path}/view`} to={`${match?.path}`} />
      <Redirect exact from={`${match?.path}/edit`} to={`${match?.path}`} />

      {/* Can be /activities/edit/:id, /activities/edit_dim/:id, /activities/edit_stream/:id */}
      <Route render={(props) => <ActivityIndexV2 {...props} />} />
    </Switch>
  )
}

export default Activities
