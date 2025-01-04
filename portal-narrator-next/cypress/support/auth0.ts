// Unfortunately, this can only be used against deployments at this time.
// When attempting to use localhost at BASE_URL, 'checks.state' is getting lost in the redirect to callback

export interface LoginOpts {
  role:
    | 'company_user'
    | 'company_admin'
    | 'company_user_no_company'
    | 'company_user_one_company'
    | 'company_user_multi_company'
  // initialLoginPath only used for testing login flow.
  // When outside of login specs - login and then use cy.visit to go to desired path
  initialLoginPath?: string
  company?: string
  expectError?: boolean | string
  cache?: boolean
}

Cypress.Commands.add('login', ({ role, company, initialLoginPath, expectError = false, cache = true }: LoginOpts) => {
  const baseUrl = Cypress.config().baseUrl as string
  if (!new URL(baseUrl).hostname.includes('narrator.ai')) {
    throw new Error(
      `Cannot login against ${baseUrl} -- E2E tests can currently only be run against a deployment on a narrator.ai domain`
    )
  }

  let username: string
  let password: string

  switch (role) {
    case 'company_user':
      username = Cypress.env('MEMBER_USERNAME')
      password = Cypress.env('MEMBER_PASSWORD')
      break
    case 'company_user_no_company':
      username = Cypress.env('MEMBER_NO_COMPANY_USERNAME')
      password = Cypress.env('MEMBER_PASSWORD')
      break
    case 'company_user_one_company':
      username = Cypress.env('MEMBER_ONE_COMPANY_USERNAME')
      password = Cypress.env('MEMBER_PASSWORD')
      break
    case 'company_user_multi_company':
      username = Cypress.env('MEMBER_MULTI_COMPANY_USERNAME')
      password = Cypress.env('MEMBER_PASSWORD')
      break
    case 'company_admin':
      username = Cypress.env('ADMIN_USERNAME')
      password = Cypress.env('ADMIN_PASSWORD')
      break
    default:
      throw new Error(`Invalid login role: ${role}`)
  }

  if (!username || !password) {
    throw new Error(`Missing username and/or password for ${role}`)
  }

  const visit = (company ? `/${company}` : '') + (initialLoginPath || '/')

  // Set session data
  cy.session(
    [company, username, cache ? null : Date.now()].filter(Boolean).join('|'),
    () => {
      // kick off auth0 login flow w/ initial navigation to portal
      cy.visit(visit)

      // Auth0 is throwing an error when we visit it with Cypress. Ignore the host page error.
      cy.on('uncaught:exception', () => false)

      // Check for the enter organization step
      cy.get('body').then(($body) => {
        const selector = 'input[name="organizationName"]'

        if ($body.find(selector).length) {
          cy.get(selector).type(company || 'narrator-demo')
          cy.get('button[name="action"]').click()
        }
      })

      cy.get('#username').type(username)
      cy.get('button[name="action"]').click()

      cy.get('#password').type(password, { log: false })
      cy.get('button[type="submit"]').contains('Continue').click({ force: true })

      // TODO: conditional check if prompting for authorization (and accept)
      // for now we have manually accepted for each cypress user
    },
    {
      cacheAcrossSpecs: cache,
      validate() {
        // Break out of cy.session and go to initial path
        cy.visit(visit)
        cy.waitForSpinners()

        // Check auth status
        cy.request({ url: '/api/auth/me', failOnStatusCode: !expectError })
          .its('status')
          .should('eq', expectError ? 401 : 200)
      },
    }
  )
})
