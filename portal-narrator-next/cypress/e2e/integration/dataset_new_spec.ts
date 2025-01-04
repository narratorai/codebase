const NEW_DATASET_NAME = `New Cypress Dataset - ${Date.now()}`

describe('Create New Dataset - Company Admin', () => {
  beforeEach(() => {
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit('narratorclient/datasets')

    cy.getBySel('nav-datasets').click()
    cy.waitForSpinners()
    cy.getBySel('create-new-dataset-cta').click()
    cy.waitForSpinners()

    cy.getBySel('activity-stream-select').click()
    cy.get('.antd5-select-item').contains('dw.activity_stream').first().click()
    cy.getBySel('activity-select').click()
  })

  it('redirect from /new.v2 to /new', () => {
    cy.visit('narratorclient/datasets/new.v2')
    cy.waitForSpinners()

    cy.url().should('not.contain', '/new.v2')
    cy.url().should('contain', '/new')
  })

  it('can select an activity', () => {
    // Select first option in select
    cy.getBySel('activity-select-option')
      .last()
      .getBySel('activity-name')
      .last()
      // grab its text
      .invoke('text')
      .then((text) => {
        cy.getBySel('activity-select-option').last().click()

        // check if info panel title matches activity selected
        cy.getBySel('dataset-info-panel-activity')
          .waitForSpinners()
          .then(() => {
            cy.getBySel('dataset-info-panel-activity-title').should('contain', text)
          })
      })
  })

  it('can select and submit and activity', () => {
    // Select first option
    cy.getBySel('activity-select-option').last().click()

    // click submit button
    cy.getBySel('dataset-definition-submit').click()
    cy.waitForSpinners()

    // check if info panel title matches activity selected
    cy.getBySel('dataset-info-panel-activity')
      .waitForSpinners()
      .then(() => {
        // check that DatasetTabCTA is present and running
        cy.getBySel('dataset-tab-cta').should('contain', 'Cancel')
      })
  })

  it('can select an activity, save a dataset, and then delete it', () => {
    // Select first option
    cy.getBySel('activity-select-option').last().click()

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

    cy.url().should('contain', '/datasets/edit/new_cypress_dataset')

    // cleanup: delete dataset
    cy.getBySel('dataset-manage-dropdown-target').trigger('mouseover')
    cy.getBySel('delete-dataset-option').click()
    cy.getBySel('confirm-delete-dataset').click()
    cy.waitForSpinners()
    cy.url().should('contain', '/datasets')
    cy.url().should('not.contain', '/datasets/edit')
  })
})
