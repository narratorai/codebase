// ONLY USE THIS COMPANY FOR TESTING SNOWFLAKE CONNECTIONS
// (this company was created specifically for these tests)
const TEST_SNOWFLAKE_COMPANY_SLUG = 'narrator-snowflake-test'
const CYPRESS_SNOWFLAKE_TEST_WAREHOUSE = 'COMPUTE_WH'
const CYPRESS_SNOWFLAKE_TEST_DATABASE = 'TEST'

describe('Connect to Snowflake Warehouse - Company Admin', () => {
  before(() => {
    // make sure there are no warehouse connections
    cy.login({ role: 'company_admin', company: TEST_SNOWFLAKE_COMPANY_SLUG })
    cy.visit(`${TEST_SNOWFLAKE_COMPANY_SLUG}/manage/warehouse`)

    // delete any that exist (leftover from previous failed tests)
    // https://docs.cypress.io/guides/core-concepts/conditional-testing#Dynamic-text
    cy.get('[data-test="warehouse-section"]').then(($warehouseSection) => {
      if ($warehouseSection.text().includes('Delete')) {
        // click delete button
        cy.getBySel('delete-connection-button').click()

        // confirm delete in modal
        cy.getBySel('confirm-delete-warehouse-connection-button').click()

        // reload page and make sure there delete button doesn't exist
        cy.getBySel('delete-connection-button').should('not.exist')
      }
    })
  })

  beforeEach(() => {
    cy.login({ role: 'company_admin', company: TEST_SNOWFLAKE_COMPANY_SLUG })
    cy.visit(`${TEST_SNOWFLAKE_COMPANY_SLUG}/manage/warehouse`)
  })

  after(() => {
    // clean up warehouse connection
    cy.getBySel('delete-connection-button').click()

    // confirm delete in modal
    // confirm delete in modal
    cy.getBySel('confirm-delete-warehouse-connection-button').click()
  })

  it('can connect to snowflake successfully', () => {
    // click snowflake card
    cy.getBySel('warehouse-card').contains('Snowflake').click()

    // add in form fields
    // Account name
    cy.get('#root_account').type(Cypress.env('SNOWFLAKE_TEST_ACCOUNT_NAME'))
    // User
    cy.get('#root_user').type(Cypress.env('SNOWFLAKE_TEST_USERNAME'))
    // Password
    cy.get('#root_password').type(Cypress.env('SNOWFLAKE_TEST_PASSWORD'))
    // Warehouse
    cy.get('#root_warehouse').type(CYPRESS_SNOWFLAKE_TEST_WAREHOUSE)
    // Database
    cy.get('#root_database').type(CYPRESS_SNOWFLAKE_TEST_DATABASE)

    // hit test and save
    cy.getBySel('warehouse-section').within(() => {
      cy.get('button').contains('Test and Save').click()
    })

    // should see success notification
    // Note: this can take a while to establish the connection
    // and sometimes waitForSpinners times out
    cy.waitForSpinners(6)
    cy.get('.antd5-notification-notice').should('contain', 'Successfully')

    // page should reload and the data should still be in the fields
    // reload again just to be sure and make sure all fields are still filled out
    cy.reload()
    cy.waitForSpinners()

    cy.get('#root_account').should('have.value', Cypress.env('SNOWFLAKE_TEST_ACCOUNT_NAME'))
    cy.get('#root_user').should('have.value', Cypress.env('SNOWFLAKE_TEST_USERNAME'))
    // password is hidden - so just check that it's there at all
    cy.get('#root_password').should('have.length.above', 0)
    cy.get('#root_warehouse').should('have.value', CYPRESS_SNOWFLAKE_TEST_WAREHOUSE)
    cy.get('#root_database').should('have.value', CYPRESS_SNOWFLAKE_TEST_DATABASE)
  })
})
