import { UserProfile, useUser } from '@auth0/nextjs-auth0/client'
import { CenteredLoader } from 'components/shared/icons/Loader'
import jwtDecode, { JwtPayload } from 'jwt-decode'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import analytics from 'util/analytics'
import { reportError } from 'util/errors'
import { GetToken } from 'util/interfaces'
import usePrevious from 'util/usePrevious'

import { login, logout } from '@/util/auth'
import { getLogger } from '@/util/logger'

import CallbackError from './CallbackError'

const logger = getLogger()

export type User = UserProfile & {
  org_name?: string
}

export type AuthError = Error & {
  error: string
  error_description: string
  state: string
  stack: string
}

export interface IAuth0Context {
  isAuthenticated: boolean
  user?: User
  authCompany?: string
  getTokenSilently: GetToken
  logout: typeof logout
}

const defaultAuth0Context: IAuth0Context = {
  isAuthenticated: false,
  getTokenSilently: () => {
    throw new Error('auth0 has not loaded')
  },
  logout,
}

export const Auth0Context = React.createContext<IAuth0Context>(defaultAuth0Context)

interface Props {
  companySlug?: string
  children: React.ReactNode
}

const AuthProvider = ({ companySlug, children }: Props) => {
  const { user, error: authError, isLoading: authLoading } = useUser()

  const accessTokenRef = useRef<string>()
  const [isLoading, setIsLoading] = useState(!accessTokenRef.current || authLoading)

  const prevUser = usePrevious(user)
  const authCompany = companySlug
  const [authCompanyOrgId, setAuthCompanyOrgId] = useState<string | undefined>()

  //
  // Loading is a tiny bit tricky. We want to be done loading when user is available, auth has loaded, and
  // the access token is available. The access token is a ref, so we won't be notified when it is changed.
  // The getToken function calls doneLoading right after the access token has been set to handle this
  // We also have a useEffect in the case where the token is set before the user object.
  //

  const doneLoading = useCallback(() => {
    if (user && !authLoading && !!accessTokenRef.current) {
      setIsLoading(false)
    }
  }, [user, authLoading, accessTokenRef])

  useEffect(() => {
    doneLoading()
  }, [doneLoading])

  // Used by every API call in Portal to get the most current access token
  // Gets an access token from Auth0, caches it, and requests a new one when the cached one has expired
  const getToken = useCallback(async () => {
    // Important note:
    // This function should not rerender as access tokens update -- if it does it causes all of portal to
    // rerender, losing people's work.
    //
    // It avoids this by using a ref for the access token.
    // When an access token changes we don't need to rerender anything -- all that matters is that
    // when this function is called it returns the correct token. A ref is perfect for this use case.

    let token = accessTokenRef.current
    let getNewToken = !token

    // check if token has expired
    if (token) {
      const decoded = jwtDecode<JwtPayload>(token as string)
      const tokenExpired = (decoded.exp as number) - Math.floor(Date.now() / 1000) <= 0

      if (tokenExpired) {
        getNewToken = true
      }
    }

    // get new token
    if (getNewToken) {
      // fetch might throw an exception if the network connection is bad. If so we don't want to catch it -- returning
      // an invalid token isn't helpful (the next api call will fail with 'unauthorized' which isn't true). So we let the
      // exception bubble up to be handled by the caller. When the network is restored the next api call will get a token
      // and succeed
      const res = await fetch('/api/auth/token')
      const data = await res.json()

      if (res.ok) {
        token = data.accessToken
        accessTokenRef.current = token
        doneLoading()
      } else {
        // failed silently refreshing the token so redirect to login
        logger.error(data.message)
        login()
      }
    }

    return token
  }, [doneLoading])

  useEffect(() => {
    const lookupOrg = async () => {
      try {
        const res = await fetch(`/api/org?name=${authCompany}`)
        if (!res.ok) {
          throw new Error('Unknown company')
        }
        const data = await res.json()
        if (data.org_id) {
          setAuthCompanyOrgId(data.org_id)
        } else {
          throw new Error('Missing company org_id')
        }
      } catch (err) {
        reportError(err as Error, null, {
          component: 'AuthProvider',
          company: authCompany,
          sub: user?.sub,
          orgId: user?.org_id,
        })

        logger.error({ authCompany }, 'User is attempting to access an unknown company, redirecting to login')
        login({ returnTo: '/' })
      }
    }
    if (authCompany && user && user.org_id && user.org_id !== prevUser?.org_id) {
      lookupOrg()
    }
  }, [user, prevUser, authCompanyOrgId, authCompany])

  useEffect(() => {
    if (authCompanyOrgId) {
      if (authCompanyOrgId === user?.org_id) {
        // This provider will render loading until the token is first initialized
        getToken()
      } else {
        logger.warn(
          { from: window.location.pathname },
          'User is logged in to a different company and must reauthenticate'
        )
        login()
      }
    }
  }, [authCompanyOrgId, getToken, user])

  // FIXME extract this into its own useIdentify hook
  // Identify user for Segment, HelpScout Beacon, LogRocket, and Sentry
  useEffect(() => {
    const identify = async () => {
      // See util/analytics for all supported plugins
      // - NOTE, do not pass in user etc into second arg (traits) or all that info
      // will be automatically sent to ALL plugins! Use third arg (options) instead
      if (user?.email) {
        analytics.identify(user.email, null, { user, companySlug })
      }
    }

    if (user && user !== prevUser) {
      identify()
    }
  }, [user, prevUser, companySlug])

  if (authError) {
    return <CallbackError authError={authError as AuthError} logout={logout} />
  }

  if (isLoading) {
    return <CenteredLoader id="auth-loader" />
  }

  return (
    <Auth0Context.Provider
      value={{
        // Because of ordering of the setState's we want to make sure the
        // isAuthenticated boolean changes only once the user is authenticated
        // AND the user object comes back from auth0:
        isAuthenticated: (!isLoading && !authError && !!user) as boolean,
        user: (user as User) || defaultAuth0Context.user,
        authCompany,
        getTokenSilently: getToken,
        logout,
      }}
    >
      {children}
    </Auth0Context.Provider>
  )
}

export default AuthProvider
