describe('Persist Activity Stream - Company Admin', () => {
  // cy.login clears localStorage - which is good for between these tests
  it('can select an activity stream from creating dataset and it will persist', () => {
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit('narratorclient/datasets/new')
    cy.waitForSpinners()

    // select the "Email" activity stream
    cy.getBySel('activity-stream-select').click()
    cy.get('.antd5-select-item').contains('dw.activity_stream').first().click()

    // go to customer journey and make sure the "Email" activity stream is selected
    cy.getBySel('nav-customers').click()
    cy.waitForSpinners()
    cy.getBySel('customer-journey-activity-stream-select').should('contain', 'Email')
    cy.getBySel('customer-journey-activity-stream-select').should('not.contain', 'Demo Email')
  })

  it('can select an activity stream from customer journey and it will persist', () => {
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit('narratorclient/customer_journey')
    cy.waitForSpinners()

    cy.getBySel('customer-journey-activity-stream-select').click()
    // set the activity stream to localStorage
    cy.get('.antd5-select-item').contains('Demo Email').click()

    // go to create dataset and make sure the default activity stream is "Demo Email"
    cy.getBySel('nav-datasets').click()
    cy.waitForSpinners()
    // force in case there are notification errors from previous customer journey
    cy.getBySel('create-new-dataset-cta').click({ force: true })
    cy.waitForSpinners()

    cy.getBySel('activity-stream-select').should('contain', 'Demo Email')
  })
})
