describe('Narratives Index - Company Admin', () => {
  const NARRATIVE_NAME_PREFIX = `Cypress Narrative Index Testing - ${Date.now()}`
  const ASSEMBLED_NARRATIVE_NAME = `${NARRATIVE_NAME_PREFIX} - Assembled`
  const UNASSEMBLED_NARRATIVE_NAME = `${NARRATIVE_NAME_PREFIX} - Unassembled`

  before(() => {
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit('narratorclient/narratives')

    // Create an assembled narrative
    cy.getBySel('create-narrative-cta').first().click()
    cy.getBySel('narrative-from-scratch-option').click()
    cy.waitForSpinners()

    // check that you are directed to /new url
    cy.url().should('contain', '/narratives/new')

    // wait for the add goal button to show (we know the page has fully loaded at that point)
    cy.getBySel('add-goal-button').should('have.have.length', 1)

    // click save button to open the overlay
    cy.getBySel('narrative-save-cta').click()
    cy.waitForSpinners()

    // add name and save narrative
    cy.getBySel('save-narrative-overlay').within(() => {
      cy.getBySel('save-overlay-name-input').type(ASSEMBLED_NARRATIVE_NAME)
      cy.getBySel('create-new-narrative-button').click()
    })

    cy.waitForSpinners()
    cy.url().should('contain', '/narratives/edit')

    cy.getBySel('add-goal-button').click()
    cy.getBySel('narrative-section-question').first().trigger('mouseover')
    cy.getBySel('narrative-section-question').first().type('This is a test.')
    cy.getBySel('narrative-save-cta').click()
    cy.waitForSpinners()
    cy.getBySel('narrative-assemble-cta').click()
    cy.waitForSpinners()

    // Create an unassembled narrative
    cy.visit('/narratorclient/narratives')
    cy.getBySel('create-narrative-cta').first().click()
    cy.getBySel('narrative-from-scratch-option').click()
    cy.waitForSpinners()

    // check that you are directed to /new url
    cy.url().should('contain', '/narratives/new')

    // wait for the add goal button to show (we know the page has fully loaded at that point)
    cy.getBySel('add-goal-button').should('have.have.length', 1)

    // click save button to open the overlay
    cy.getBySel('narrative-save-cta').click()
    cy.waitForSpinners()

    // add name and save narrative
    cy.getBySel('save-narrative-overlay').within(() => {
      cy.getBySel('save-overlay-name-input').type(UNASSEMBLED_NARRATIVE_NAME)
      cy.getBySel('create-new-narrative-button').click()
    })

    cy.waitForSpinners()
    cy.url().should('contain', '/narratives/edit')
  })

  const searchForNarrative = (name: string) => {
    cy.getBySel('search-narratives-filter-icon').click()
    cy.getBySel('search-narratives-dropdown').within(() => {
      cy.get('input').type(name)
      cy.get('button').contains('Search').click()
    })
  }

  after(() => {
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit('narratorclient/narratives')

    // Delete test narratives
    const narratives = [UNASSEMBLED_NARRATIVE_NAME, ASSEMBLED_NARRATIVE_NAME]
    narratives.forEach((name) => {
      searchForNarrative(name)
      cy.getBySel('narrative-item-name').should('have.length', 1)
      cy.getBySel('narrative-item-options').trigger('mouseover')
      cy.getBySel('delete-narrative-menu-item').click()

      cy.getBySel('confirm-delete-narrative').click()
      cy.waitForSpinners()

      // check that the narrative no longer exists
      searchForNarrative(name)
      cy.getBySel('narrative-item-name').should('have.length', 0)
    })
  })

  beforeEach(() => {
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit('narratorclient/narratives')
  })

  it('can search for narratives', () => {
    cy.getBySel('resource-search-select').type(UNASSEMBLED_NARRATIVE_NAME)
    cy.waitForSpinners()
    cy.get('.antd5-select-item-option-content').should('have.length', 1)
  })

  it('can edit its own narrative', () => {
    searchForNarrative(UNASSEMBLED_NARRATIVE_NAME)

    cy.getBySel('edit-narrative').should('have.length', 1)
    cy.getBySel('edit-narrative').click()
    cy.url().should('contain', '/narratives/edit/cypress_narrative')
  })

  it('cannot visit an unassembled narrative', () => {
    searchForNarrative(UNASSEMBLED_NARRATIVE_NAME)

    cy.getBySel('narrative-item-name').should('have.length', 1)
    cy.getBySel('narrative-item-name').click()
    cy.waitForSpinners()
    cy.url().should('not.contain', '/narratives/a/cypress_narrative')
  })

  it('can visit an assembled narrative', () => {
    searchForNarrative(ASSEMBLED_NARRATIVE_NAME)
    cy.getBySel('narrative-item-name').not('disabled').click()

    cy.url().should('contain', '/narratorclient/narratives/a/cypress_narrative')
  })
})
