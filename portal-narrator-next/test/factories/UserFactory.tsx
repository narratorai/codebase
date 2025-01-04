import { faker } from '@faker-js/faker'
import { makeFactory } from 'factory.ts'
import { ICompany_User_Role_Enum, IUser_Role_Enum } from 'graph/generated'

import CompanyUserFactory from './CompanyUserFactory'

const AdminCompanyUser = CompanyUserFactory.build({
  role: ICompany_User_Role_Enum.Admin,
})

const NonAdminCompanyUser = CompanyUserFactory.build({
  role: ICompany_User_Role_Enum.User,
})

const User = makeFactory({
  id: faker.string.uuid(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.past().toISOString(),
  accepted_terms_at: faker.date.past().toISOString(),
  email: faker.internet.email(),
  role: IUser_Role_Enum.User,
  user_activities: [],
  // user_company_tables
  // user_datasets
  // user_datasets_aggregate
  // user_narrative_templates
  // user_narratives
  // user_narratives_aggregate
})

export const AdminUser = makeFactory({
  ...User,
  company_users: [AdminCompanyUser],
})

export const NonAdminUser = makeFactory({
  ...User,
  company_users: [NonAdminCompanyUser],
})
