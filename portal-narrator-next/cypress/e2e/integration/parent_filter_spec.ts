describe('Parent Filter in Dataset - Company Admin', () => {
  // DO NOT DELETE: This serves as a dataset fixture
  const DATASET_PATH = 'narratorclient/datasets/edit/do_not_delete_me_cypressa5116f3f?group=activity_id8742e74c'

  beforeEach(() => {
    // login to already created dataset
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit(DATASET_PATH)
  })

  it('can maintain value kind', () => {
    // open parent filter modal
    cy.getBySel('parent-filter-cta').click()

    // add new default filter
    cy.getBySel('add-parent-filter-cta').click()

    // add filter kind
    cy.getBySel('filter-operator-select').last().click()
    cy.get('.antd5-select-item-option-content').contains('is equal to').click()

    // add column kind
    cy.getBySel('value-kind-select').last().click()
    cy.get('.antd5-select-item-option-content').contains('column').click()

    // select first column available
    cy.getBySel('column-select').last().click()
    cy.getBySel('column-select-label-enabled').first().click()

    // add group filter
    cy.getBySel('add-parent-filters-submit').should('not.be.disabled')
    cy.getBySel('add-parent-filters-submit').click()

    // open parent filter modal again
    cy.getBySel('parent-filter-cta').click()

    // check that the column kind has not reverted back to default values
    cy.getBySel('value-kind-select').last().should('contain', 'column')
  })

  it('can delete a previous filter and maintain its values', () => {
    // open parent filter modal
    cy.getBySel('parent-filter-cta').click()

    // grab last filter operator
    cy.getBySel('filter-operator-select')
      .last()
      .invoke('text')
      .then((operatorText) => {
        // grab last value
        cy.getBySel('filter-value-input-string')
          .last()
          .children()
          .invoke('val')
          .then((valueText) => {
            // delete first parent filter
            cy.getBySel('list-item-card-close').first().click()

            // check that the last filter operator is the same
            cy.getBySel('filter-operator-select').last().should('contain', operatorText)

            // check that last value is the same
            cy.getBySel('filter-value-input-string').last().children().should('have.value', valueText)
          })
      })
  })
})
