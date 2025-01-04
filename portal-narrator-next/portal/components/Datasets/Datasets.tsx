import { useCompany } from 'components/context/company/hooks'
import ExploreDatasetModal from 'components/Datasets/Explore/ExploreDatasetModal'
import { RECENTLY_VIEWED } from 'components/shared/IndexPages/constants'
import NoActivityStreamAlert from 'components/shared/NoActivityStreamAlert'
import NoWarehouseAlert from 'components/shared/NoWarehouseAlert'
import { ICompany_Status_Enum } from 'graph/generated'
import { isEmpty } from 'lodash'
import React from 'react'
import { Redirect, RouteComponentProps, Switch, useLocation } from 'react-router'
import Route from 'util/route'

const DatasetIndex = React.lazy(
  () => import(/* webpackChunkName: "datasets-index" */ 'components/Datasets/DatasetIndex')
)

const BuildDataset = React.lazy(
  () => import(/* webpackChunkName: "datasets-edit" */ 'components/Datasets/BuildDataset/BuildDataset')
)

const Datasets: React.FC<RouteComponentProps> = ({ match }) => {
  const company = useCompany()
  const location = useLocation()

  const hasConnectedWarehouse = company.status === ICompany_Status_Enum.Active
  const hasTables = !isEmpty(company.tables)

  return (
    <>
      <Route path={match.path + '/:filter?/explorer/:datasetSlug/:linkSlug?'} component={ExploreDatasetModal} />

      <Switch>
        {/* Backfill: redirect index from V3 to non-V3 url structure */}
        <Redirect
          exact
          from={`${match.path}/v3/:filter?`}
          to={{
            // Splat location so we preserrve any query params through the redirect
            ...location,
            pathname: `${match.path}/${RECENTLY_VIEWED}`,
          }}
        />

        {/* Backfill: redirect explorer from V3 to non-V3 url structure */}
        <Redirect
          exact
          from={`${match.path}/v3/:filter?/explorer/:datasetSlug/:linkSlug?`}
          to={{
            // Splat location so we preserrve any query params through the redirect
            ...location,
            pathname: `${match.path}/:filter?/explorer/:datasetSlug/:linkSlug?`,
          }}
        />

        {/* Backfill: redirect /edit.v2 to /edit */}
        <Redirect
          exact
          from={`${match.path}/edit.v2/:dataset_slug`}
          to={{
            // Splat location so we preserrve any query params through the redirect
            ...location,
            pathname: `${match.path}/edit/:dataset_slug`,
          }}
        />

        {/* Backfill: redirect /new.v2 to /new */}
        <Redirect
          exact
          from={`${match.path}/new.v2`}
          to={{
            // Splat location so we preserrve any query params through the redirect
            ...location,
            pathname: `${match.path}/new`,
          }}
        />

        {/* Make sure they have a warehouse connected before trying to create a new dataset */}
        {!hasConnectedWarehouse && <Route exact path={match.path + '/new'} component={NoWarehouseAlert} />}

        {/* Make sure they have an activity stream before trying to create a new dataset */}
        {!hasTables && <Route exact path={match.path + '/new'} component={NoActivityStreamAlert} />}

        {/* NEW DATASET only */}
        <Route exact path={match.path + '/new'} component={BuildDataset} />

        {/*
          EDIT DATASET - supports required params.dataset_slug to preload form definition
          Use render= so we can key by slug, so that changing the URL re-mounts the page
          This is important for example when duplicating a dataset and changing the url to /<new-slug>
        */}
        <Route
          exact
          path={match.path + '/edit/:dataset_slug'}
          render={(props) => <BuildDataset key={props.match.params.dataset_slug} {...props} />}
        />

        {/* INDEX v3 */}
        <Route path={match.path + '/:filter?'} component={DatasetIndex} />
      </Switch>
    </>
  )
}

export default Datasets
