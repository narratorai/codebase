import { produce } from 'immer'
import { fromPairs, map, toPairs } from 'lodash'
import { create } from 'zustand'

import { AccessRole, IAccessRoles, IUser } from './interfaces'
import UsersRepository from './UsersRepository'

const repository = new UsersRepository()

const initialState = {
  accessRoles: {
    Admin: false,
    CanUseSql: false,
    CreateChat: false,
    CreateDataset: false,
    CreateDatasetIntegration: false,
    CreateDatasetMaterializeView: false,
    CreateDatasetTraining: false,
    CreateReport: false,
    DownloadData: false,
    ManageApi: false,
    ManageBilling: false,
    ManageConnection: false,
    ManageCustomFunction: false,
    ManageProcessing: false,
    ManageProcessingConfig: false,
    ManageTags: false,
    ManageTickets: false,
    ManageTransformations: false,
    ManageUsers: false,
    UpdatePrivate: false,
    ViewActivities: false,
    ViewBilling: false,
    ViewChat: false,
    ViewCustomerJourney: false,
    ViewDataset: false,
    ViewPrivate: false,
    ViewProcessing: false,
    ViewReport: false,
  },
  companies: [],
  favorites: null,
  teamIds: [],
}

/**
 * A store for managing the user.
 */
const useUser = create<IUser>((set) => ({
  ...initialState,

  set,

  reset: () => {
    set(initialState)
  },

  async getCurrentUserSeed(datacenterRegion) {
    const response = await repository.getCurrentUserSeed(datacenterRegion)

    const { accessRoles, companies, favorites, teamIds } = response
    const accessRolesSet = new Set(accessRoles)
    const accessRolesPairs = toPairs(AccessRole)
    const accessRolesPairsUpdated = map(accessRolesPairs, ([key, value]) => [key, accessRolesSet.has(value)])
    const accessRolesObject = fromPairs(accessRolesPairsUpdated) as IAccessRoles

    set(
      produce((state: IUser) => {
        state.accessRoles = accessRolesObject
        state.companies = companies
        state.favorites = favorites
        state.teamIds = teamIds
      })
    )

    return response
  },
}))

export default useUser
