import { useCompany } from 'components/context/company/hooks'
import NoActivityStreamAlert from 'components/shared/NoActivityStreamAlert'
import NoWarehouseAlert from 'components/shared/NoWarehouseAlert'
import Page from 'components/shared/Page'
import { ICompany_Status_Enum } from 'graph/generated'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { isEmpty } from 'lodash'
import { Redirect, RouteComponentProps, Switch, useHistory } from 'react-router'
import { loadPersistedActivityStreamSlug } from 'util/persistActivityStream'
import Route from 'util/route'

import Customer from './v2/Customer'
import CustomerJourneyPageV3 from './v3/shared/CustomerJourneyPage'

const CustomerJourneyPage = ({ match }: RouteComponentProps) => {
  const history = useHistory()
  const company = useCompany()
  const flags = useFlags()
  const useV3 = flags['customer-journey-v-3']
  const defaultActivityStream = loadPersistedActivityStreamSlug(company)

  const hasConnectedWarehouse = company.status === ICompany_Status_Enum.Active
  const hasTables = !isEmpty(company.tables)

  // Only used for "/customer_journey" url without table
  const defaultTable = !isEmpty(defaultActivityStream) ? defaultActivityStream : company?.tables?.[0]?.activity_stream

  return (
    <Page title="Customer Journey | Narrator" bg="white" breadcrumbs={[{ text: 'Customer Journey' }]}>
      <Switch>
        {/* Catch if they have no warehouse connected */}
        {!hasConnectedWarehouse && <Route exact path={match.path} component={NoWarehouseAlert} />}

        {/* Catch if they have no tables (no activity streams) */}
        {!hasTables && <Route exact path={match.path} component={NoActivityStreamAlert} />}

        {useV3 && <Route exact path={match.path + '/:table/:customer?'} component={CustomerJourneyPageV3} />}

        <Route exact path={match.path + '/:table'} render={(props) => <Customer {...props} />} />

        {/* add default table if they do not specify a table in the url */}
        {defaultTable && (
          <Redirect
            exact
            from={match.path}
            to={{
              // preserve any query params etc, only replace the pathname
              ...history.location,
              pathname: `${match.path}/${defaultTable}`,
            }}
          />
        )}
      </Switch>
    </Page>
  )
}

export default CustomerJourneyPage
