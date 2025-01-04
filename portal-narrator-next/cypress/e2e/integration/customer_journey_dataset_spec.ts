describe('Customer Journey in Dataset - Company Admin', () => {
  // DO NOT DELETE: This serves as a dataset fixture
  const DATASET_PATH = 'narratorclient/datasets/edit/do_not_delete_me_cypressa5116f3f'

  beforeEach(() => {
    // login to already created dataset
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit(DATASET_PATH)
    cy.waitForSpinners()
    cy.waitUntil(() => cy.get('.ag-cell'))
  })

  it('can open a customer journey with a customer column in the dataset', () => {
    // right click the first row in dataset (fixture is ordered by customer column)
    cy.get('.ag-cell').first().rightclick({ force: true })
    cy.getBySel('dataset-row-menu').children().first().click()

    cy.waitForSpinners()

    cy.getBySel('customer-journey-drawer').should('exist')
  })

  it('cannot open a customer journey without a customer column in the dataset', () => {
    // delete customer column
    cy.getBySel('dataset-info-panel-activity').children().contains('Customer').click()
    cy.getBySel('column-menu').children().contains('Delete').click()

    cy.waitForSpinners()

    // clear out reconciler (dataset is ordered off customer column)
    cy.getBySel('reconciler-drawer-footer').get('button').contains('Apply').click()

    // right click the first row in dataset
    cy.get('.ag-cell').first().rightclick({ force: true })
    cy.getBySel('dataset-row-menu').children().first().click()

    cy.waitForSpinners()

    cy.getBySel('customer-journey-drawer').should('not.exist')
  })
})
