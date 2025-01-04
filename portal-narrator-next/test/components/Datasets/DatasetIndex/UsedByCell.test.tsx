import { render, screen } from '@testing-library/react'

import UsedByCell from '../../../../portal/components/Datasets/UsedByCell'
import { NonAdminTestContext } from '../../../context'
import { INarrative_Types_Enum, IStatus_Enum, IMaterialization_Type_Enum } from '../../../../portal/graph/generated'

const postmarkIntegration = {
  id: 'postmark_id',
  label: 'Postmark Integration',
  type: IMaterialization_Type_Enum.Postmark,
}

const narrative = {
  narrative: {
    id: 'nar_id',
    name: 'Narrative Name',
    slug: 'narrative_name',
    state: IStatus_Enum.Live,
    type: INarrative_Types_Enum.Analysis,
  },
}

const dashboard = {
  narrative: {
    id: 'dash_id',
    name: 'Dashboard Name',
    slug: 'dashboard_name',
    state: IStatus_Enum.Live,
    type: INarrative_Types_Enum.Dashboard,
  },
}

describe('When user is not an admin and has a Narrative', () => {
  beforeEach(() => {
    render(
      <NonAdminTestContext>
        <UsedByCell integrations={[]} narratives={[narrative]} />
      </NonAdminTestContext>
    )
  })

  test('shows that it has a narrative and no analyses or integrations', async () => {
    expect(screen.getByText('Analyses')).toBeInTheDocument()
    expect(screen.queryByText('Dashboards')).toBeNull()
    expect(screen.queryByText('Postmark')).toBeNull()
  })
})

describe('When user is not an admin and has a Dashboard', () => {
  beforeEach(() => {
    render(
      <NonAdminTestContext>
        <UsedByCell integrations={[]} narratives={[dashboard]} />
      </NonAdminTestContext>
    )
  })

  test('shows that it has a dashboard and no analyses or integrations', async () => {
    expect(screen.getByText('Dashboards')).toBeInTheDocument()
    expect(screen.queryByText('Narratives')).toBeNull()
    expect(screen.queryByText('Postmark')).toBeNull()
  })
})

describe('When user is not an admin and has a Dashboard and a Narrative', () => {
  beforeEach(() => {
    render(
      <NonAdminTestContext>
        <UsedByCell integrations={[]} narratives={[dashboard, narrative]} />
      </NonAdminTestContext>
    )
  })

  test('shows that it has dashboards and analyses, but no integrations', async () => {
    expect(screen.getByText('Dashboards')).toBeInTheDocument()
    expect(screen.getByText('Analyses')).toBeInTheDocument()
    expect(screen.queryByText('Postmark')).toBeNull()
  })
})

describe('When user is not an admin and has a Dashboard and a Narrative and an integration', () => {
  beforeEach(() => {
    render(
      <NonAdminTestContext>
        <UsedByCell integrations={[postmarkIntegration]} narratives={[dashboard, narrative]} />
      </NonAdminTestContext>
    )
  })

  test('shows that it has dashboards, narratives, and integrations', async () => {
    expect(screen.getByText('Dashboards')).toBeInTheDocument()
    expect(screen.getByText('Analyses')).toBeInTheDocument()
    expect(screen.getByText('Postmark')).toBeInTheDocument()
  })
})
