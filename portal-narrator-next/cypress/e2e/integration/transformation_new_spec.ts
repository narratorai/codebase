const NEW_TRANSFORMATION_URL = 'narratorclient/transformations/new'
const INDEX_TRANSFORMATION_URL = 'narratorclient/transformations'

const NEW_TRANSFORMATION_NAME = 'Testing Cypress Transformation'
const NEW_TRANSFORMATION_FORMATTED_NAME = 'testing_cypress_transformation'
const TRANFORMATION_SQL = `SELECT {enter} d.id AS "activity_id" {enter} , d.created_at AS "ts" {enter} , NULL  AS "source" {enter} , NULL  AS "source_id" {enter} , u.email AS "customer" {enter} , 'created_a_new_dashboard' AS "activity" {enter} , d.slug AS "feature_1" {enter} , d.description AS "feature_2" {enter} , c.name AS "feature_3" {enter} , NULL AS "revenue_impact" {enter} , 'https://portal.narrator.ai/dashboards/d/' + d.slug AS "link" {enter} FROM api_db_public.dashboards AS d {enter} JOIN api_db_public.users AS u {enter}ON ( u.id = d.owner_id ) {enter} LEFT OUTER JOIN api_db_public.categories c  {enter}     on (c.id = d.category_id) {enter} `

describe('Create New Transformation - Company Admin', () => {
  const deleteCreatedTransformation = () => {
    cy.get('#layoutRoot').then(($layoutContent) => {
      // if the transformation is in the content
      if ($layoutContent.text().includes(NEW_TRANSFORMATION_NAME)) {
        // make sure the transformation we are deleting is actaully the NEW_TRANSFORMATION_NAME
        cy.getBySel(`delete-transformation-${NEW_TRANSFORMATION_FORMATTED_NAME}`).should('have.length', 1)

        cy.getBySel(`delete-transformation-${NEW_TRANSFORMATION_FORMATTED_NAME}`).click()

        cy.getBySel('delete-transformation-modal').within(() => {
          // double check that we are deleting the correct transformation
          cy.get('.antd5-modal-body').should('contain', `Are you sure you want to delete ${NEW_TRANSFORMATION_NAME}`)

          // confirm delete
          cy.get('button').contains('OK').click()
        })

        // check that the progress loader is present in the modal
        cy.getBySel('result-progress-loader').should('exist')

        cy.waitForSpinners()

        // make sure the transformation has been deleted
        cy.getBySel(`delete-transformation-${NEW_TRANSFORMATION_FORMATTED_NAME}`).should('have.length', 0)
      }
    })
  }

  beforeEach(() => {
    // conditional cleanup: make sure NEW_TRANSFORMATION_NAME doesn't exist before test starts
    // https://docs.cypress.io/guides/core-concepts/conditional-testing#Dynamic-text
    // keep this in beforeEach(), rather than before() b/c cypress will run multiple attempts in GH
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit(INDEX_TRANSFORMATION_URL)
    cy.waitForSpinners()

    // make sure the index items have had a chance to render
    cy.waitUntil(() => {
      return cy.getBySel('transformation-name').should('exist')
    })

    deleteCreatedTransformation()

    // Start each test at the /transformations/new route
    cy.visit(NEW_TRANSFORMATION_URL)
  })

  // cleanup
  after(() => {
    // // go to transformation index and make sure it is added and no longer pending
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit(INDEX_TRANSFORMATION_URL)

    cy.waitForSpinners()

    // delete new transformation
    deleteCreatedTransformation()
    cy.waitForSpinners()

    // make sure the transformation has been deleted
    cy.getBySel('transformation-list-item').should('have.length', 0)
  })

  it('can add a new transformation', () => {
    cy.getBySel('dynamic-form-content').within(() => {
      // give the transformation a unique name
      cy.get('input[value="New Transformation"]').clear()
      cy.get('label')
        .contains('Transformation Name')
        .parent()
        .parent()
        .within(() => {
          cy.get('input').type(NEW_TRANSFORMATION_NAME)
        })

      // open the sql editor
      cy.getBySel('read-only-sql-editor').click()

      // clear and add new valid sql
      cy.get('.react-monaco-editor-container')
        .first()
        .within(() => {
          // hacky: monaco only has one text area at a time
          // which seems to be sql segment you are clicked into
          // so click and clear all text areas before entering new SQL
          cy.get('textarea').first().click()
          cy.get('textarea').first().clear()
          cy.get('textarea').first().click()
          cy.get('textarea').first().clear()
          cy.get('textarea').first().click()
          cy.get('textarea').first().clear()
          cy.get('textarea').first().type(TRANFORMATION_SQL)
        })

      // exit out of sql editor
      cy.getBySel('exit-full-screen-editor-button').click()
      cy.waitForSpinners()

      // click next button
      cy.get('button').contains('Next').first().click()
    })

    cy.waitForSpinners()

    // url should change
    cy.location('pathname').should('not.contain', '/new')
    cy.waitForSpinners()

    // validate and push to production
    cy.getBySel('dynamic-form-content').within(() => {
      // click validate button
      cy.get('button').contains('Validate').click()
      cy.waitForSpinners(4)

      // wait until the "Push to Production" button exists
      cy.waitUntil(() => {
        return cy.get('button').contains('Push to Production')
      })

      // make sure there is success text (large timeout because validation can take a while)
      cy.get('h1', { timeout: 40000 }).contains('Validation Status: Passed', { timeout: 40000 }).should('exist')

      // push transformation to production
      cy.get('button').contains('Push to Production').click()
      cy.waitForSpinners()
    })

    // make sure there is success notification
    cy.get('.antd5-notification-notice').should('contain', 'Pushed to Production')

    // go to transformation index and make sure it is added and no longer pending
    cy.visit(INDEX_TRANSFORMATION_URL)
    cy.waitForSpinners()

    // search for transformation and go to transformation
    cy.getBySel('resource-search-select').type(`${NEW_TRANSFORMATION_NAME}{enter}`)

    // make sure the transformation is set
    cy.get('#layoutSider').within(() => {
      cy.get('span').contains(NEW_TRANSFORMATION_NAME).should('exist')
    })
  })
})
