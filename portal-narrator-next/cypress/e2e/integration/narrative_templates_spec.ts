interface TestTemplateProps {
  kpi: string
  impact: string
}

const testTemplate = ({ kpi, impact }: TestTemplateProps) => {
  cy.waitForSpinners()
  // select the KPI option
  cy.getBySel('analyze-modal-kpi-select').click()
  cy.getBySel('analyze-modal-kpi-select').type(kpi)
  cy.get('.antd5-select-item-option').contains(kpi).first().click()

  // select the impact
  cy.getBySel('analyze-modal-impact-select').click()
  cy.getBySel('analyze-modal-impact-select').type(impact)
  cy.get('.antd5-select-item-option').contains(impact).first().click()

  // submit analyze data
  cy.getBySel('confirm-run-analysis').click()
  cy.waitForSpinners(4)

  // add extra time for this link to appear since it is dependent on Mavis api response
  cy.get('[data-test="go-to-narrative-template-link"]', { timeout: 80000 }).should('be.visible')

  // remove the target _blank on the link to continue testing
  // (target parent of <Link />, b/c parent is the actual <a /> of <Link />)
  cy.getBySel('go-to-narrative-template-link').parent().invoke('removeAttr', 'target')

  // navigate to the new narrative
  cy.getBySel('go-to-narrative-template-link').click()

  // check that you are on the assembled narrative page
  cy.url().should('contain', '/narratives/a/')
  cy.waitForSpinners()

  // make sure the assembled narrative has loaded sidebar content
  cy.get('[data-test="assembled-narrative-name"]', { timeout: 60000 }).should('be.visible')
  cy.getBySel('assembled-narrative-name').should('contain', `${impact} to increase ${kpi}`)

  // get narrative name so we can delete it later
  cy.getBySel('assembled-narrative-name')
    .first()
    .invoke('text')
    .then((narrativeName) => {
      // go to narrative index
      cy.getBySel('nav-narratives').click()
      cy.waitForSpinners()

      // search for the narrative
      cy.getBySel('search-narratives-filter-icon').click()
      cy.getBySel('search-narratives-dropdown').within(() => {
        cy.get('input').type(narrativeName)
        cy.get('button').contains('Search').click()
      })
      cy.waitForSpinners()

      // see how many there are to make sure it's one less after delete
      // (there could be multiple same named narrative templates)
      cy.getBySel('narrative-item-options').then((sameNameNarratives) => {
        const narrativeCountBeforeDelete = Cypress.$(sameNameNarratives).length

        // delete first one
        cy.getBySel('narrative-item-options').first().trigger('mouseover')
        cy.getBySel('delete-narrative-menu-item').first().click()

        cy.getBySel('confirm-delete-narrative').click()
        cy.waitForSpinners()

        cy.getBySel('narrative-item-options').should('have.length.lessThan', narrativeCountBeforeDelete)
      })
    })
}

describe('Narrative Template - Company Admin', () => {
  const DATASET_FOR_TEMPLATES_URL = 'narratorclient/datasets/edit/test_narratives_dataset6fe2634a'
  beforeEach(() => {
    // login to previously created dataset to build all the different
    // variations of narrative templates
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit(DATASET_FOR_TEMPLATES_URL)
    cy.waitForSpinners()

    // wait until the analyze button is visible
    cy.waitUntil(() => {
      return cy.getBySel('analyze-dataset-button', { timeout: 40000 }).should('be.visible')
    })

    // wait until the analyze button is not disabled
    cy.waitUntil(() => {
      return cy.getBySel('analyze-dataset-button').should('not.be.disabled')
    })

    // open analyze data modal
    cy.getBySel('analyze-dataset-button').click()
    cy.waitForSpinners()
  })

  it('Impact of DID GET PRODUCT EMAIL, KPI: Avg TOTAL RUN DATASETS', () => {
    testTemplate({ kpi: 'Average Total Run Datasets', impact: 'Did Get Product Email' })
  })

  it('Impact of ACTIVITY, KPI: Avg TOTAL RUN DATASETS', () => {
    testTemplate({ kpi: 'Average Total Run Datasets', impact: 'Activity' })
  })

  it('Impact of ACTIVITY OCCURRENCE, KPI: Avg TOTAL RUN DATASETS', () => {
    testTemplate({ kpi: 'Average Total Run Datasets', impact: 'Activity Occurrence' })
  })

  it('Impact of DID GET PRODUCT EMAIL , KPI: Conv Rate TO DID SCHEDULED MEETING', () => {
    testTemplate({ kpi: 'Conversion Rate to Scheduled Meeting', impact: 'Did Get Product Email' })
  })

  it('Impact of ACTIVITY, KPI: Conv Rate TO DID SCHEDULED MEETING', () => {
    testTemplate({ kpi: 'Conversion Rate to Scheduled Meeting', impact: 'Activity' })
  })

  it('Impact of ACTIVITY OCCURRENCE, KPI: Conv Rate TO DID SCHEDULED MEETING', () => {
    testTemplate({ kpi: 'Conversion Rate to Scheduled Meeting', impact: 'Activity Occurrence' })
  })
})
