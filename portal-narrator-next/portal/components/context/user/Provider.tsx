import { QueryResult } from '@apollo/client'
import { useAuth0 } from 'components/context/auth/hooks'
import { CenteredLoader } from 'components/shared/icons/Loader'
import {
  ICompany_User,
  IUserSeedQuery,
  IUserSeedQueryVariables,
  useCreateCompanyUserProfilePictureMutation,
  useUserSeedLazyQuery,
} from 'graph/generated'
import React, { useEffect, useMemo, useState } from 'react'
import { reportError } from 'util/errors'

import { getLogger } from '@/util/logger'

import FlagsWrapper from './FlagsWrapper'

const logger = getLogger()

export interface IUserContext {
  result?: QueryResult<IUserSeedQuery, IUserSeedQueryVariables>
  companyUser?: Partial<ICompany_User>
}

export const UserContext = React.createContext<IUserContext>({})

interface Props {
  children: React.ReactNode
}

const UserProvider = ({ children }: Props) => {
  const { user: authUser, authCompany } = useAuth0()

  const [doQuery, result] = useUserSeedLazyQuery({ partialRefetch: true, returnPartialData: true })
  const [addProfilePicture, { error: profilePictureError }] = useCreateCompanyUserProfilePictureMutation()
  const [hasSetProfilePicture, setHasSetProfilePicture] = useState(false)

  // Get the company_user for the current company
  const companyUser = useMemo(() => {
    if (!authCompany) {
      return undefined
    }

    return result?.data?.user?.[0]?.company_users?.find(
      (cu) => cu.company.slug === authCompany
    ) as Partial<ICompany_User>
  }, [result, authCompany])

  useEffect(() => {
    if (authUser?.email && !result.data && !result.called) {
      logger.info({ email: authUser.email }, 'loading user from graph')
      doQuery({ variables: { user_email: authUser.email } })
    }
  }, [authUser, doQuery, result])

  useEffect(() => {
    if (result.loading) {
      return
    }

    if (result.error) {
      reportError('GraphQL User Seed Error', result.error, {
        query: 'SeedUser',
      })
    }

    if (result.data) {
      const user = result.data.user[0]
      if (!user) {
        throw new Error('Unable to find user')
      }
    }
  }, [result])

  useEffect(() => {
    if (result.loading || hasSetProfilePicture) {
      return
    }

    if (result.data && authUser?.picture) {
      const profilePicture = companyUser?.preferences?.profile_picture

      // add google picture to user's preferences if they don't already have a profile picture
      if (companyUser?.id && authUser?.picture && (!profilePicture || profilePicture !== authUser.picture)) {
        addProfilePicture({ variables: { profile_picture: authUser?.picture, company_user_id: companyUser?.id } })
        // only allow picture to be updated once per provider mount
        // (guard against multiple queued updates: https://pganalyze.com/docs/log-insights/app-errors/U138)
        setHasSetProfilePicture(true)
      }
    }
  }, [result, companyUser, authUser, addProfilePicture, hasSetProfilePicture])

  // capture better errors on addProfilePicture fails
  useEffect(() => {
    if (profilePictureError) {
      const profilePicture = companyUser?.preferences?.profile_picture

      reportError('Error adding/updating customer profile picture', profilePictureError, {
        data: result.data,
        previousPicture: profilePicture,
        profile_picture: authUser?.picture,
        company_user_id: companyUser?.id,
      })
    }
  }, [profilePictureError, result, authUser, companyUser])

  if (!result?.data?.user?.[0]) {
    return <CenteredLoader id="user-loader" />
  }

  return (
    <UserContext.Provider
      value={{
        // The entire user seed query response
        result,
        // The company user for the current company, if any
        companyUser,
      }}
    >
      <FlagsWrapper>{children}</FlagsWrapper>
    </UserContext.Provider>
  )
}

export default UserProvider
