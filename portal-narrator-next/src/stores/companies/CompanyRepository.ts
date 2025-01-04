import AbstractRepository from '../AbstractRepository'
import { IRemoteCompany } from './interfaces'

export default class CompanyRepository extends AbstractRepository<IRemoteCompany, unknown> {
  constructor() {
    super('/api/companies')
  }

  getAll(): Promise<unknown> {
    throw new Error('Method not implemented.')
  }

  create(): Promise<IRemoteCompany> {
    throw new Error('Method not implemented.')
  }
}
