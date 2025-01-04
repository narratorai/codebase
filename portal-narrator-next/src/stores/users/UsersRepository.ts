import { DatacenterRegion, getMavis } from '@/util/mavisClient'

import AbstractRepository from '../AbstractRepository'
import { IRemoteUser, IRemoteUserDetails, IRemoteUsers } from './interfaces'

export default class UsersRepository extends AbstractRepository<IRemoteUser, IRemoteUsers> {
  constructor() {
    super('/api/users')
  }

  getCurrentUserSeed(datacenterRegion?: DatacenterRegion) {
    const url = `${this.remotePathOrUrl}/current`
    return getMavis<IRemoteUserDetails>(url, { datacenterRegion })
  }
}
