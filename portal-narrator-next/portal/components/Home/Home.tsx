import { useAuth0 } from 'components/context/auth/hooks'
import { CenteredLoader } from 'components/shared/icons/Loader'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { useEffect } from 'react'
import { RouteComponentProps, useHistory } from 'react-router-dom'
import {
  DEFAULT_LOGIN_REDIRECT_PATH,
  DEFAULT_LOGIN_REDIRECT_PATH_V2,
  DEFAULT_MOBILE_LOGIN_REDIRECT_PATH,
  MAX_WIDTHS,
} from 'util/constants'

import { notCompanySlugs } from '@/util/auth'

interface MatchParams {
  company_slug?: string
}

/**
 * This component is mounted at /:company_slug. It will:
 *  - redirect to the default route if they have selected a company
 *  - kick users back to the /welcome page if they need to select a company
 *  - kick users back to the /welcome page if they have no companies
 */
const Home = ({ match }: RouteComponentProps<MatchParams>) => {
  const history = useHistory()
  const { authCompany } = useAuth0()
  const flags = useFlags()

  const allowChat = flags['llm-chat']
  const defaultDesktopRedirectPath = allowChat ? DEFAULT_LOGIN_REDIRECT_PATH_V2 : DEFAULT_LOGIN_REDIRECT_PATH

  const { company_slug: companyParam } = match.params
  const urlCompany = companyParam && notCompanySlugs.includes(companyParam) ? null : companyParam

  useEffect(() => {
    if (!authCompany) {
      history.replace('/welcome')
      return
    }

    if (authCompany === urlCompany) {
      const redirectPath =
        window.innerWidth <= MAX_WIDTHS[1] ? DEFAULT_MOBILE_LOGIN_REDIRECT_PATH : defaultDesktopRedirectPath
      history.replace(`/${authCompany}${redirectPath}`)
    } else {
      history.replace(`/${authCompany}`)
    }
  }, [history, authCompany, urlCompany, defaultDesktopRedirectPath])

  return <CenteredLoader id="home-loader" />
}

export default Home
