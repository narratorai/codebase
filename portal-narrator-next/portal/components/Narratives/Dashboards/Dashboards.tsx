import ExploreDatasetModal from 'components/Datasets/Explore/ExploreDatasetModal'
import BuildNarrative from 'components/Narratives/BuildNarrative/BuildNarrative'
import DashboardIndex from 'components/Narratives/Dashboards/DashboardIndex/DashboardIndex'
import NarrativePage from 'components/Narratives/Narrative/NarrativePage'
import { RouteComponentProps, Switch } from 'react-router'
import Route from 'util/route'

const Dashboards = ({ match }: RouteComponentProps) => {
  return (
    <>
      <Route
        path={match.path + '/a/:narrative_slug/:dynamic_fields?/explorer/:datasetSlug/:linkSlug?'}
        component={ExploreDatasetModal}
      />
      <Route
        path={match.path + '/edit/:narrative_slug/:dynamic_fields?/explorer/:datasetSlug/:linkSlug?'}
        component={ExploreDatasetModal}
      />

      <Switch>
        <Route exact path={match.path} component={DashboardIndex} />
        <Route path={match.path + '/a/:narrative_slug/:dynamic_fields?'} component={NarrativePage} />
        <Route exact path={match.path + '/new'} component={BuildNarrative} />
        <Route exact path={match.path + '/edit/:narrative_slug'} component={BuildNarrative} />
      </Switch>
    </>
  )
}

export default Dashboards
