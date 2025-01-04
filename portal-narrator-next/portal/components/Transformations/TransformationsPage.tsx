import { ProtectedRoleRoute } from 'components/context/auth/protectedComponents'
import BuildTransformationPage from 'components/Transformations/BuildTransformationPage'
import TransformationIndex from 'components/Transformations/TransformationIndex/TransformationIndex'
import { Redirect, RouteComponentProps, Switch } from 'react-router'

const TransformationsPage = ({ match }: RouteComponentProps) => {
  return (
    <Switch>
      <ProtectedRoleRoute exact path={match.path + '/new/:tab?'} component={BuildTransformationPage} />
      <ProtectedRoleRoute exact path={match.path + '/edit/:id/:tab?'} component={BuildTransformationPage} />

      <Redirect exact from={match.path + '/edit'} to={match.path} />
      <ProtectedRoleRoute
        subTitle="Sorry, only admin users can access this page."
        exact
        path={match.path}
        component={TransformationIndex}
      />
    </Switch>
  )
}

export default TransformationsPage
