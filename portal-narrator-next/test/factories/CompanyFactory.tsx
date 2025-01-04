import { faker } from '@faker-js/faker'
import { makeFactory } from 'factory.ts'
import { ICompany_Status_Enum } from 'graph/generated'

export default makeFactory({
  id: faker.string.uuid(),
  allow_narrator_employee_access: true,
  name: faker.company.name(),
  slug: faker.company.name(),
  status: ICompany_Status_Enum.Active,
  batch_halt: false,
  updated_at: null,
  timezone: 'America/New_York',
  spend_table: null,
  production_schema: null,
  materialize_schema: null,
  cache_minutes: 60,
  demo_company: false,
  branding_color: null,
  plot_colors: null,
  logo_url: null,
  currency_used: null,
  warehouse_default_schemas: null,
  datacenter_region: null,
  tables: [],
})
