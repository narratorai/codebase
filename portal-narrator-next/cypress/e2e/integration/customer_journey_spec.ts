describe('Customer Journey - Company Admin', () => {
  beforeEach(() => {
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit('narratorclient/customer_journey')
  })

  const updateTimeFilterToYearAndSubmit = () => {
    // update time filter to be this year
    cy.getBySel('quick-time-filter-select').click()
    cy.get('.antd5-select-item-option').contains('this Year').first().click()

    // submit the filter
    cy.getBySel('submit-customer-filters-cta').first().click()
    cy.waitForSpinners()
  }

  const setActivityStreamAndTimeFilter = () => {
    // make sure the customer activity stream is selected
    cy.getBySel('customer-journey-activity-stream-select').click()

    // https://stackoverflow.com/a/57894080/7949930
    cy.get('.antd5-select-item-option')
      .contains(new RegExp('^' + 'Customer' + '$', 'g'))
      .first()
      .click()

    updateTimeFilterToYearAndSubmit()
  }

  it('can select a customer and see only their activities', () => {
    setActivityStreamAndTimeFilter()

    // click first customer link
    cy.getBySel('customer-link')
      .first()
      .invoke('text')
      .then((customerEmail) => {
        // customerEmail can be truncated if too long
        // cut off "..." text if it exists
        const formattedCustomerEmail = customerEmail.includes('...') ? customerEmail.replace('...', '') : customerEmail

        cy.getBySel('customer-link').first().click()
        cy.waitForSpinners()

        // check that profile has clicked customer email
        cy.getBySel('customer-email-title').should('contain', formattedCustomerEmail)

        // check that customer search input is populated with clicked customer email
        cy.getBySel('select-customer-input')
          .first()
          .within(() => {
            cy.get('input').should('contain.value', formattedCustomerEmail)
          })

        // check that query params are set
        cy.url().should('contain', 'customer=')

        // reload the page and make sure that customer is persisted through query params
        cy.getBySel('customer-email-title').should('contain', formattedCustomerEmail)
      })

    // check that there are no customer links left
    cy.getBySel('customer-link').should('not.exist')

    // click reset and check customer is removed from query params
    cy.getBySel('reset-customer-filters-cta').click()
    cy.waitForSpinners()
    cy.url().should('not.contain', 'customer=')

    // update time filter to be this year
    updateTimeFilterToYearAndSubmit()

    // check that customer links have returned after reset
    cy.getBySel('customer-link').should('exist')
  })

  it('can limit the activities seen', () => {
    setActivityStreamAndTimeFilter()

    // get the first activity
    cy.getBySel('customers-activity')
      .first()
      .invoke('text')
      .then((firstActivity) => {
        // choose an activity that is not the firstActivity
        cy.getBySel('customer-activity-select').click()
        cy.get('.antd5-select-tree-title')
          .not(firstActivity)
          .last()
          .invoke('text')
          .then((selectedActivity) => {
            // select an activity that is not the first
            cy.get('.antd5-select-tree-title').not(firstActivity).last().click()

            // submit the activity filter
            cy.getBySel('submit-customer-filters-cta').click({ force: true })
            cy.waitForSpinners()

            // check that activities are present
            cy.getBySel('customers-activity').first().should('exist')

            // check that first activity is now the newly selected activity
            cy.getBySel('customers-activity').first().should('contain', selectedActivity)

            // check that query params are set
            cy.url().should('contain', 'activities=')

            // reload page and make sure acitivity filter persists
            cy.reload()
            cy.waitForSpinners()
            cy.getBySel('customers-activity').first().should('contain', selectedActivity)
          })

        // click reset and check activities is removed from query params
        cy.getBySel('reset-customer-filters-cta').click()
        cy.waitForSpinners()
        cy.url().should('not.contain', 'activities=')
      })
  })

  it('can order timeline in ascending and descending order', () => {
    setActivityStreamAndTimeFilter()

    // check the first date
    cy.getBySel('customer-activity-day-date')
      .first()
      .invoke('text')
      .then((firstActivityDayDate) => {
        // click asc/desc toggle
        cy.getBySel('customer-order-toggle').click()

        // submit the filter
        cy.getBySel('submit-customer-filters-cta').click()
        cy.waitForSpinners()

        // check first date and make sure that it has changed
        cy.getBySel('customer-activity-day-date').first().should('not.contain', firstActivityDayDate)

        // check that query params are set
        cy.url().should('contain', 'asc=true')

        // reload page and make sure that order persists
        cy.reload()
        cy.waitForSpinners()
        cy.getBySel('customer-activity-day-date').first().should('not.contain', firstActivityDayDate)

        // reset and check asc is removed from query params
        cy.getBySel('reset-customer-filters-cta').click()
        cy.waitForSpinners()
        cy.url().should('not.contain', 'asc=true')
      })
  })

  it('can lazy load more data on scroll', () => {
    setActivityStreamAndTimeFilter()

    cy.getBySel('customers-activity').then((customerActivities) => {
      // get count of activities
      const initialActivityLength = Cypress.$(customerActivities).length

      // scroll to bottom
      cy.getBySel('customers-activity').last().scrollIntoView()

      // check that lazy loader is present
      cy.getBySel('lazy-loading-customer-spinner').should('exist')

      // after load check that there are more activities
      cy.waitUntil(() => {
        return cy
          .getBySel('lazy-loading-customer-spinner')
          .should('not.exist')
          .then(() => {
            cy.getBySel('customers-activity').its('length').should('be.gt', initialActivityLength)
          })
      })
    })
  })

  it('disables submit button when form is not valid', () => {
    setActivityStreamAndTimeFilter()

    // clear the within time filter value
    cy.getBySel('quick-time-filter-select').trigger('mouseover')
    cy.getBySel('quick-time-filter-select').within(() => {
      cy.get('.antd5-select-clear').click()
    })

    // check that the submit button is disabled
    cy.getBySel('submit-customer-filters-cta').should('be.disabled')

    // re-add time filter value
    cy.getBySel('quick-time-filter-select').click()
    cy.get('.antd5-select-item-option').contains('this Year').first().click()

    // check that the submit button is no longer disabled
    cy.getBySel('submit-customer-filters-cta').should('not.be.disabled')

    // clear all the time filters
    cy.getBySel('clear-time-filter-cta').click()

    // make sure that the submit button is still be enabled
    cy.getBySel('submit-customer-filters-cta').should('not.be.disabled')
  })
})
