const DASHBOARD_NAME = 'DO NOT DELETE - TESTING DASHBOARD'

const goToExistingDashboardFromIndex = () => {
  cy.getBySel('dashboard-search-bar').type(DASHBOARD_NAME)
  cy.get('.antd5-select-item-option-content').contains('DO NOT DELETE - TESTING DASHBOARD').first().click()
  cy.waitForSpinners()
}

describe('Edit Dashboard - Company Admin', () => {
  beforeEach(() => {
    // login
    cy.login({
      role: 'company_admin',
      company: 'narratorclient',
    })

    // go to dashboards index
    cy.visit('narratorclient/dashboards')
  })

  it('Shows warning when assembling on larger screens', () => {
    // go to dashboard that already exists
    goToExistingDashboardFromIndex()

    // set viewport to larger size to trigger the warning
    cy.viewport(1300, 800)

    // click on the assemble button
    cy.getBySel('narrative-assemble-cta').click()

    // check that the warning is visible
    cy.get('.antd5-notification-notice-message').should('contain', 'Heads up!')
  })

  it('Does not show a warning when assembling on smaller screens', () => {
    // go to dashboard that already exists
    goToExistingDashboardFromIndex()

    // set viewport to larger size to trigger the warning
    cy.viewport(1100, 800)

    // click on the assemble button
    cy.getBySel('narrative-assemble-cta').click()

    // check that the warning is visible
    cy.get('.antd5-notification-notice-message').should('not.exist')
  })

  it('Can open the explore modal and return to the correct tab on close', () => {
    // go to dashboard that already exists
    goToExistingDashboardFromIndex()

    // then go to it's assembled version
    cy.getBySel('narrative-view-link').invoke('removeAttr', 'target').click()
    cy.waitForSpinners()

    // click on the last tab
    cy.getBySel('assembled-dashboard-tabs').within(() => {
      cy.get('.antd5-tabs-tab').last().click()
    })

    cy.waitForSpinners()

    // check that the tab has been added to the url
    cy.url().should('contain', 'tab=')

    // click on the explore icon (open explore modal)
    cy.getBySel('explore-dataset-icon').first().click()
    cy.waitForSpinners()

    // check that the url has been updated with previousUrl to return to
    cy.url().should('contain', 'previousUrl=')

    // close the modal
    cy.get('.antd5-modal-close').click()
    cy.waitForSpinners()

    // check that the url has the tab param again
    cy.url().should('contain', 'tab=')

    // check that the last tab is active
    cy.getBySel('assembled-dashboard-tabs').within(() => {
      cy.get('.antd5-tabs-tab').last().should('have.class', 'antd5-tabs-tab-active')
    })
  })
})
