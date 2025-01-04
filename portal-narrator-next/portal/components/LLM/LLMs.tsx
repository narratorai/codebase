import { useUser } from 'components/context/user/hooks'
import RequestIndex from 'components/LLM/Request/RequestIndex/RequestIndex'
import RequestView from 'components/LLM/Request/RequestView/RequestView'
import TrainingIndex from 'components/LLM/Training/TrainingIndex'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { RouteComponentProps, Switch } from 'react-router'
import Route from 'util/route'

const LLMs: React.FC<RouteComponentProps> = ({ match }) => {
  const flags = useFlags()
  const showLLM = flags['llm-training']

  const { isCompanyAdmin } = useUser()

  if (!showLLM) {
    return null
  }

  return (
    <Switch>
      <Route exact path={match.path + '/trainings/edit/:id'} component={TrainingIndex} />
      <Route path={match.path + '/trainings'} component={TrainingIndex} />

      {isCompanyAdmin && <Route exact path={match.path + '/requests/edit/:id'} component={RequestView} />}
      {isCompanyAdmin && <Route path={match.path + '/requests'} component={RequestIndex} />}
    </Switch>
  )
}

export default LLMs
