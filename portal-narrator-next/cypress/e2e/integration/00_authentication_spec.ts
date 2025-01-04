describe('Unathenticated', () => {
  describe('Redirects to login', () => {
    const baseUrl = Cypress.config().baseUrl as string

    it('for http /', () => {
      const modified = new URL(baseUrl)
      modified.protocol = 'http'

      cy.visit(modified.toString())

      cy.location('protocol').should('eq', 'https:')
      cy.location('hostname').should('include', Cypress.env('AUTH0_DOMAIN'))
    })

    it('for /', () => {
      cy.visit('/')

      cy.location('protocol').should('eq', 'https:')
      cy.location('hostname').should('include', Cypress.env('AUTH0_DOMAIN'))
    })

    it('for /narratorclient', () => {
      cy.visit('/narratorclient')

      cy.location('protocol').should('eq', 'https:')
      cy.location('hostname').should('include', Cypress.env('AUTH0_DOMAIN'))
    })

    it('for /narrator-demo', () => {
      cy.visit('/narrator-demo')

      cy.location('protocol').should('eq', 'https:')
      cy.location('hostname').should('include', Cypress.env('AUTH0_DOMAIN'))
    })

    it('for /login', () => {
      cy.visit('/login')

      cy.location('protocol').should('eq', 'https:')
      cy.location('hostname').should('include', Cypress.env('AUTH0_DOMAIN'))
    })

    it('for /signup', () => {
      cy.visit('/signup')

      cy.location('protocol').should('eq', 'https:')
      cy.location('hostname').should('include', Cypress.env('AUTH0_DOMAIN'))
    })

    it('for /welcome', () => {
      cy.visit('/welcome')

      cy.location('protocol').should('eq', 'https:')
      cy.location('hostname').should('include', Cypress.env('AUTH0_DOMAIN'))
    })

    it('for /null', () => {
      cy.visit('/null')

      cy.location('protocol').should('eq', 'https:')
      cy.location('hostname').should('include', Cypress.env('AUTH0_DOMAIN'))
    })

    // The /signup route was removed when we migrated to server side auth
    it('for /signup', () => {
      cy.visit('/signup')

      cy.location('protocol').should('eq', 'https:')
      cy.location('hostname').should('include', Cypress.env('AUTH0_DOMAIN'))
    })
  })

  describe('Logs in', () => {
    it('for /', () => {
      cy.login({ role: 'company_user' })
      cy.location('pathname').should('include', '/narrator-demo')
    })

    it('for /narratorclient', () => {
      cy.login({ role: 'company_user', company: 'narratorclient', initialLoginPath: '/' })
      cy.location('pathname').should('include', '/narratorclient')
    })

    it('for /narrator-demo/activities?foo=bar', () => {
      cy.login({ role: 'company_user', company: 'narrator-demo', initialLoginPath: '/activities?foo=bar' })
      cy.location('pathname').should('include', '/narrator-demo/activities')
      cy.location('search').should('include', 'foo=bar')
    })

    // error on auth0 screen when bogus org is input, cy.login doesn't handle it
    it.skip('for /company-that-doesnt-exist (fake company, no access)', () => {
      cy.login({
        role: 'company_user',
        company: 'company-that-doesnt-exist',
        initialLoginPath: '/',
        cache: false,
        expectError: 'Something Went Wrong',
      })
    })

    it('for /narrator (real company, no access)', () => {
      cy.login({ role: 'company_user', company: 'narrator', initialLoginPath: '/', expectError: true })
      cy.location('hostname').should('include', Cypress.env('AUTH0_DOMAIN'))
    })

    it('for /narrator/narratives (real company, no access)', () => {
      cy.login({ role: 'company_user', company: 'narrator', initialLoginPath: '/narratives', expectError: true })
      cy.location('hostname').should('include', Cypress.env('AUTH0_DOMAIN'))
    })
  })
})

describe('Authenticated', () => {
  describe('Switching Companies', () => {
    it('forbids from a company to another user does not have access', () => {
      cy.login({ role: 'company_user', company: 'narratorclient', initialLoginPath: '/' })
      cy.waitForSpinners()

      // User should not have access to this company
      cy.visit('/narrator')
      cy.login({ role: 'company_user', company: 'narrator', initialLoginPath: '/', cache: false, expectError: true })
      cy.waitForSpinners()
      cy.location('hostname').should('include', Cypress.env('AUTH0_DOMAIN'))
    })

    it('allows from a company to another user does have access', () => {
      cy.login({ role: 'company_user', company: 'narratorclient', initialLoginPath: '/' })
      cy.waitForSpinners()

      // User should have access to this company
      cy.visit('/narrator-demo')
      cy.login({ role: 'company_user', company: 'narrator-demo', initialLoginPath: '/' })
      cy.waitForSpinners()
      cy.location('pathname').should('include', '/narrator-demo')
    })

    it('preserves login state when switching between companies', () => {
      cy.login({ role: 'company_user', company: 'narratorclient', initialLoginPath: '/' })
      cy.waitForSpinners()

      // User should have access to this company
      cy.visit('/narrator-demo')
      cy.login({ role: 'company_user', company: 'narrator-demo', initialLoginPath: '/' })
      cy.waitForSpinners()
      cy.location('pathname').should('include', '/narrator-demo')

      // Go back to original company
      cy.login({ role: 'company_user', company: 'narratorclient', initialLoginPath: '/' })
      cy.waitForSpinners()
      cy.location('pathname').should('include', '/narratorclient')

      cy.visit('/')
      cy.waitForSpinners()
      cy.location('pathname').should('include', '/narratorclient')

      // And back to second company
      cy.login({ role: 'company_user', company: 'narrator-demo', initialLoginPath: '/' })
      cy.waitForSpinners()
      cy.location('pathname').should('include', '/narrator-demo')

      cy.visit('/')
      cy.waitForSpinners()
      cy.location('pathname').should('include', '/narrator-demo')
    })
  })

  describe('Logout', () => {
    it('logs out the user', () => {
      cy.login({ role: 'company_user', company: 'narratorclient', initialLoginPath: '/' })
      cy.waitForSpinners()

      cy.getBySel('nav-profile-submenu').first().trigger('mouseover')
      cy.getBySel('nav-logout').click()

      cy.location('hostname').should('include', Cypress.env('AUTH0_DOMAIN'))

      cy.visit('/')
      cy.waitForSpinners()
      cy.location('hostname').should('include', Cypress.env('AUTH0_DOMAIN'))
    })
  })
})
