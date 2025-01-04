describe('Create New Narrative Template From Dataset - Company Admin', () => {
  const NEW_DATASET_NAME = `New Cypress Dataset - ${Date.now()}`

  const getNewDataset = () => {
    // find test dataset
    // go to all mine datasets
    cy.getBySel('index-sidebar-all-mine').click()
    cy.waitForSpinners()

    // click in name column header
    cy.get('.dataset-table-header-name')
      .first()
      .within(() => {
        cy.get('.antd5-dropdown-trigger').click()
      })

    // search for the dataset
    cy.get('.antd5-table-filter-dropdown').within(() => {
      cy.get('input').type(`${NEW_DATASET_NAME}{enter}`)
    })

    // there should only be one match for the dataset
    cy.get('.antd5-table-row').should('have.length', 1)
  }

  before(() => {
    // login and create a dataset to edit
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit('narratorclient/datasets')

    // click create new dataset
    cy.getBySel('create-new-dataset-cta').click()

    cy.url().should('contain', '/narratorclient/datasets/new')
    cy.waitForSpinners()

    // choose activity_stream datasource
    cy.getBySel('activity-stream-select').click()
    cy.get('.antd5-select-item').contains('dw.activity_stream').first().click()
    cy.waitForSpinners()

    // Select first option
    cy.getBySel('activity-select').first().click()
    // cy.getBySel('activity-select-option').first().click()
    cy.getBySel('activity-select-option').contains('Marketing Session').first().click()

    // click submit button
    cy.getBySel('dataset-definition-submit').click()
    cy.waitForSpinners()

    // click save icon
    cy.getBySel('save-dataset-cta').click()
    cy.waitForSpinners()

    // fill out save form
    cy.getBySel('dataset-form-fields').waitForSpinners().get('input[name="name"]').type(NEW_DATASET_NAME)

    // save dataset
    cy.getBySel('save-dataset-modal').within(() => {
      cy.get('button').contains('Save').click()
    })

    // make sure dataset is done saving
    cy.waitForSpinners()
  })

  beforeEach(() => {
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit('narratorclient/datasets')

    // find test dataset
    getNewDataset()

    // click on the dataset
    cy.getBySel('dataset-index-name-link').first().click()

    // // navigate to the dataset
    cy.url().should('contain', '/datasets/edit/new_cypress_dataset')
  })

  // clean up dataset
  after(() => {
    // Reset auth state
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit('narratorclient/datasets')

    // find test dataset
    getNewDataset()
    cy.waitForSpinners()

    // delete it
    // open actions dropdown
    cy.getBySel('dataset-actions-dropdown').first().click()
    cy.getBySel('dataset-actions-delete-option').first().click()
    cy.getBySel('confirm-delete-dataset').first().click()
    cy.waitForSpinners()
  })

  it('can create and delete a narrative template from a dataset', () => {
    cy.waitForSpinners()
    // open analyze data modal
    cy.getBySel('analyze-dataset-button').click()
    cy.waitForSpinners()

    // submit analyze data
    cy.getBySel('confirm-run-analysis').click()
    cy.waitForSpinners()

    // add extra time for this link to appear since it is dependent on Mavis api response
    cy.get('[data-test="go-to-narrative-template-link"]', { timeout: 60000 }).should('be.visible')

    // remove the target _blank on the link to continue testing
    // (target parent of <Link />, b/c parent is the actual <a /> of <Link />)
    cy.getBySel('go-to-narrative-template-link').parent().invoke('removeAttr', 'target')

    // navigate to the new narrative
    cy.getBySel('go-to-narrative-template-link').click()

    // check that you are on the assembled narrative page
    cy.url().should('contain', '/narratives/a/')
    cy.waitForSpinners(6)

    // make sure the assembled narrative has loaded sidebar content
    cy.getBySel('assembled-narrative-name').should('be.visible')

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
  })
})
