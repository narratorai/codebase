describe('Query Editor Page - Company Admin', () => {
  beforeEach(() => {
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit('narratorclient/query_editor')
  })

  it('keeps state when window is resized narrow and then wide (sc-3776)', () => {
    const input = 'Why hello there'

    cy.get('.react-monaco-editor-container').within(() => {
      // hacky: monaco only has one text area at a time
      // which seems to be sql segment you are clicked into
      // so click and clear all text areas before entering new SQL
      cy.get('textarea').first().click().clear()
      cy.get('textarea').first().click().clear()
      cy.get('textarea').first().click().clear().type(input)
    })

    cy.getBySel('mobile-support-warning').should('not.be.visible')

    cy.viewport('iphone-6')
    cy.getBySel('mobile-support-warning').should('be.visible')
    cy.get('.react-monaco-editor-container').should('not.be.visible')

    cy.viewport('macbook-13')
    cy.getBySel('mobile-support-warning').should('not.be.visible')
    cy.get('.react-monaco-editor-container').should('be.visible')

    cy.get('.react-monaco-editor-container').within(() => {
      cy.get('textarea').should('have.value', input)
    })
  })
})
