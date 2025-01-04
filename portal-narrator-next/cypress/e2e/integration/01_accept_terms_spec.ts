// Has "01_" file prefix to ensure that this test runs before all else
// (clearing the terms notification out of the way)

// Maybe this should belong somewhere else/handled differently
// But when we update the terms a popup appears that blocks Cypress's
// ability to click on certain elements - which makes tests fail
// This goes through every login and accepts the terms if they
// have been updated

// use dataset index page to ensure that the #layoutSider
// content is available before conditional search
const TEST_URL = 'narratorclient/datasets'

// To be fair - this is a bit of an anti-pattern in Cypress testing
// https://docs.cypress.io/guides/core-concepts/conditional-testing#The-problem
// BUT - the "Review and Confirm" terms notification is blocking other Cypress tests
// this test will accept the terms via the UI (not blocking future tests)
// and it tests that we can accept terms
const acceptTermsIfVisible = () => {
  cy.waitForSpinners()

  // make sure content has rendered before searching for review and confirm button
  cy.get('#layoutSider')

  cy.get('body').then(($body) => {
    // The accept terms banner only shows up when it's updated
    // (or the user has never accepted)
    // See if accept button exists
    if ($body.find('[data-test="update-terms-review-confirm-button"]').length) {
      // If review and confirm button exists - click it
      cy.getBySel('update-terms-review-confirm-button').click()

      // make sure the modal opens
      cy.get('.ant-modal-header')
        .first()
        .should('contain', 'Accept Terms of Use, Data Processing Agreement, and Privacy Policy')

      // accept terms and conditions
      cy.getBySel('agree-to-terms-in-modal-button').click()

      cy.waitForSpinners()

      // make sure the notification no longer exists
      cy.getBySel('update-terms-review-confirm-button').should('not.exist')
    }
  })
}

describe('Accept Terms if they exist - Company Admin', () => {
  beforeEach(() => {
    // login to already created dataset
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit(TEST_URL)
  })

  it('accepts the terms if they exist', () => {
    acceptTermsIfVisible()
  })
})

describe('Accept Terms if they exist - Company User', () => {
  beforeEach(() => {
    // login to already created dataset
    cy.login({ role: 'company_user', company: 'narratorclient' })
    cy.visit(TEST_URL)
  })

  it('accepts the terms if they exist', () => {
    acceptTermsIfVisible()
  })
})

describe('Accept Terms if they exist - Company User with one company access', () => {
  beforeEach(() => {
    // login to already created dataset
    cy.login({ role: 'company_user_one_company', company: 'narratorclient' })
    cy.visit(TEST_URL)
  })

  it('accepts the terms if they exist', () => {
    acceptTermsIfVisible()
  })
})

describe('Accept Terms if they exist - Company User with multiple company access', () => {
  beforeEach(() => {
    // login to already created dataset
    cy.login({ role: 'company_user_multi_company', company: 'narratorclient' })
    cy.visit(TEST_URL)
  })

  it('accepts the terms if they exist', () => {
    acceptTermsIfVisible()
  })
})
