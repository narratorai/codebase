import { faker } from '@faker-js/faker'
import { makeFactory } from 'factory.ts'
import { ICompany_User_Role_Enum } from 'graph/generated'

export default makeFactory({
  id: faker.string.uuid(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  phone: null,
  role: ICompany_User_Role_Enum.User,
  email: faker.internet.email(),
  created_at: faker.date.past().toISOString(),
})
