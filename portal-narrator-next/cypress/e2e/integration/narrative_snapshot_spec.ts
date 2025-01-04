// This is points to a reserved narrative
// It has more than 20 narrative runs and has an older snapshot (Jan 14, 2021) - more than 30 days ago
const OLD_NARRATIVE_NAME = 'DO NOT DELETE ME - Cypress Testing'
const OLD_NARRATIVE_SNAPSHOT_URL = '/narratives/a/testing_assembled?snapshot=2021-01-14T19%3A10%3A51.873384'
const OLD_NARRATIVE_SNAPSHOT_DATE = '2021-01-14T19:10:51.873384'
const DOES_NOT_EXIST_SNAPSHOT_URL = '/narratives/a/testing_assembled?snapshot=2019-01-14T19%3A10%3A51.873384'
const INVALID_SNAPSHOT_URL = '/narratives/a/testing_assembled?snapshot=xyz'

describe('Narrative Snapshots - Company Admin', () => {
  it('can view a snapshot more than 30 days ago when there are more than 20 snapshots', () => {
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit(`narratorclient${OLD_NARRATIVE_SNAPSHOT_URL}`)

    // make sure the narrative loads
    cy.getBySel('assembled-narrative-name').should('contain', OLD_NARRATIVE_NAME)

    // make sure the snapshot dropdown is populated with correct snapshot from query params
    // note - this will fail if we change the timezone of narratorclient
    // but that may be a good warning for us
    cy.getBySel('snapshot-button').click()
    cy.getBySel('snapshot-date-range-modal').within(() => {
      cy.getBySel('snapshot-selector').should('contain', OLD_NARRATIVE_SNAPSHOT_DATE)
    })
  })

  it('is redirected to the most current snapshot if the snapshot query param does not match an existing file', () => {
    // go to an actual narrative - but with snapshot query param that doesn't actually exist
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit(`narratorclient${DOES_NOT_EXIST_SNAPSHOT_URL}`)

    // make sure the narrative loads
    cy.getBySel('assembled-narrative-name').should('contain', OLD_NARRATIVE_NAME)

    // snapshot query param is removed
    cy.url().should('not.include', 'snapshot=')

    // notification is fired letting the user know that they are on the most recent snapshot
    cy.get('.antd5-notification-notice').should('contain', 'The snapshot from the url does not exist')
  })

  it('is redirected to the most current snapshot if the snapshot query param is not a valid time string', () => {
    // go to an actual narrative - but with snapshot query param that doesn't actually exist
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit(`narratorclient${INVALID_SNAPSHOT_URL}`)

    // make sure the narrative loads
    cy.getBySel('assembled-narrative-name').should('contain', OLD_NARRATIVE_NAME)

    // snapshot query param is removed
    cy.url().should('not.include', 'snapshot=')

    // notification is fired letting the user know that they are on the most recent snapshot
    cy.get('.antd5-notification-notice').should('contain', 'The snapshot from the url does not exist')
  })
})
