import { OnboardedRoute } from 'components/context/auth/protectedComponents'
import TaskTracker from 'components/TaskTracker/TaskTracker'
import { useFlags } from 'launchdarkly-react-client-sdk'
import React from 'react'
import { Redirect, RouteComponentProps, Switch } from 'react-router'
import Route from 'util/route'

import Company from './Company/Company'
import Notifications from './Notifcations/Notifications'

const PrototypePage = React.lazy(
  () => import(/* webpackChunkName: "build-generic-block" */ 'components/Manage/Prototypes/PrototypePage')
)

const Manage = ({ match }: RouteComponentProps<{ company_slug: string }>) => {
  const flags = useFlags()

  let allowedTabs = 'warehouse|company|users|api-keys|branding|billing'
  if (flags['manage-connections']) {
    allowedTabs = allowedTabs.concat('|connections')
  }

  return (
    <Switch>
      <Route exact path={`${match.path}/:path(${allowedTabs})`} component={Company} />
      <OnboardedRoute path={match.path + '/notifications'} component={Notifications} />
      <OnboardedRoute path={match.path + '/tasks'} component={TaskTracker} />
      <OnboardedRoute path={`${match.path}/dynamic/:slug?/:tab?`} adminOnly component={PrototypePage} />

      {/* LEGACY REDIRECT */}
      <Redirect exact from={match.path} to={`${match.path}/company`} />
      <Redirect exact from={match.path + '/company/edit'} to={`${match.path}/company`} />

      {/* Catch all */}
      <Redirect from="*" to={`/${match.params.company_slug}/manage/company`} />
    </Switch>
  )
}

export default Manage
