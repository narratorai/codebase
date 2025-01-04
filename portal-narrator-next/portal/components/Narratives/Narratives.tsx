import ExploreDatasetModal from 'components/Datasets/Explore/ExploreDatasetModal'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { Redirect, RouteComponentProps, Switch } from 'react-router'
import Route from 'util/route'

import BuildNarrative from './BuildNarrative/BuildNarrative'
import NarrativeIndexV3 from './Narrative/NarrativeIndexV3/NarrativeIndexV3'
import NarrativePage from './Narrative/NarrativePage'
import Templates from './Templates/Templates'

const Narratives = ({ match }: RouteComponentProps) => {
  const flags = useFlags()

  return (
    <>
      <Route
        path={match.path + '/a/:narrative_slug/:dynamic_fields?/explorer/:datasetSlug/:linkSlug?'}
        component={ExploreDatasetModal}
      />
      <Route
        path={match.path + '/edit/:narrative_slug/explorer/:datasetSlug/:linkSlug?'}
        component={ExploreDatasetModal}
      />

      <Switch>
        <Route path={match.path + '/a/:narrative_slug/:dynamic_fields?'} component={NarrativePage} />
        <Route exact path={match.path + '/new'} component={BuildNarrative} />
        <Route exact path={match.path + '/edit/:narrative_slug'} component={BuildNarrative} />
        <Route exact path={match.path} component={NarrativeIndexV3} />

        {flags['create-narrative-from-template'] && (
          <Route exact path={match.path + '/templates/use'} component={Templates} />
        )}

        {/* "/narratives/v2" was used while using building the new narratives index */}
        {/* redirect old links now that v1 is deprecated: "/narrative/v2" -> "/narratives" */}
        <Redirect exact from={`${match.path}/v2`} to={match.path} />
      </Switch>
    </>
  )
}

export default Narratives
