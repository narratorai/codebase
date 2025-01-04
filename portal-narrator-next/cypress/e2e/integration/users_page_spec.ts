describe('Users Page - Company Admin', () => {
  const NEW_USER_EMAIL = `opsnarrator+test.${Date.now()}@gmail.com`
  const MANAGE_USERS_URL = 'narratorclient/manage/users'

  const searchForNewUser = () => {
    cy.getBySel('search-icon-email').click()

    // search for the newly created user
    cy.getBySel('search-dropdown-container').within(() => {
      cy.get('input[placeholder="Search Email"]').type(NEW_USER_EMAIL)
      cy.getBySel('search-button').click()
    })
  }

  before(() => {
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit(MANAGE_USERS_URL)
    cy.waitForSpinners()

    // Add new user
    cy.getBySel('add-users-container').within(() => {
      cy.getBySel('add-email-input').type(`${NEW_USER_EMAIL}`)
      cy.getBySel('add-user-button').click()
    })

    cy.get('.antd5-notification-notice-success').should('exist')
  })

  beforeEach(() => {
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit(MANAGE_USERS_URL)
    cy.waitForSpinners()

    searchForNewUser()

    // make sure there is only one row after search
    cy.getBySel('company-user-table-row').should('have.length', 1)
    cy.getBySel('company-user-table-cell').should('have.length.above', 1)
  })

  after(() => {
    // clean up: delete the user created for these tests
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit(MANAGE_USERS_URL)
    cy.waitForSpinners()

    // filter users to only the one user created before all tests
    // (limit the damage we can do to real/existing users)
    searchForNewUser()

    // make sure there is only one row after search
    cy.getBySel('company-user-table-row').should('have.length', 1)
    cy.getBySel('company-user-table-cell').should('have.length.above', 1)

    // just to be sure, make sure there is only one delete option
    cy.getBySel('delete-user-icon').should('have.length', 1)
    cy.getBySel('delete-user-icon').click()

    // transfer resources to another ops user
    cy.getBySel('transfer-to-user-select').click()
    cy.get('.antd5-select-item-option-content').contains('opsnarrator+test').first().click()

    // confirm delete the user
    cy.getBySel('delete-user-modal').within(() => {
      cy.get('button').contains('Delete User').click()
    })

    cy.waitForSpinners()

    // check for success notification
    cy.get('.antd5-notification-notice').should('contain', 'User Deleted')

    // make sure the user is gone
    cy.get('.antd5-empty-description').should('exist')
  })

  it('cant add a user that already exists', () => {
    // Try to re-add the user
    cy.getBySel('add-users-container').within(() => {
      cy.getBySel('add-email-input').type(`${NEW_USER_EMAIL}`)
      // blur the email to trigger validation
      cy.getBySel('add-first-name-input').click()
      cy.getBySel('add-user-button').should('be.disabled')
    })

    cy.getBySel('add-users-container').contains('The user already exists.').should('exist')
  })

  it('can update first_name', () => {
    const FIRST_NAME = 'Cypress First Name'
    // add a first name
    cy.getBySel('user-cell-first_name').click()
    cy.getBySel('user-cell-input').type(`${FIRST_NAME}{enter}`)
    cy.get('.antd5-notification-notice').should('contain', 'Changes Saved')

    // reload page and make sure first name is still there
    cy.reload()
    cy.waitForSpinners()
    searchForNewUser()

    cy.getBySel('user-cell-first_name').should('contain', FIRST_NAME)
  })

  it('can update last_name', () => {
    const LAST_NAME = 'Cypress Last Name'
    // add a last name
    cy.getBySel('user-cell-last_name').click()
    cy.getBySel('user-cell-input').type(`${LAST_NAME}{enter}`)
    cy.get('.antd5-notification-notice').should('contain', 'Changes Saved')

    // reload page and make sure last name is still there
    cy.reload()
    cy.waitForSpinners()
    searchForNewUser()

    cy.getBySel('user-cell-last_name').should('contain', LAST_NAME)
  })

  it('can update phone', () => {
    const PHONE = Date.now()
    // add a phone
    cy.getBySel('user-cell-phone').click()
    cy.getBySel('user-cell-input').type(`${PHONE}{enter}`)
    cy.get('.antd5-notification-notice').should('contain', 'Changes Saved')

    // reload page and make sure phone is still there
    cy.reload()
    cy.waitForSpinners()
    searchForNewUser()

    cy.getBySel('user-cell-phone').should('contain', PHONE)
  })

  it('can update role', () => {
    // confirm that default role is member
    cy.getBySel('user-cell-role-select').should('contain', 'Member')

    // click role dropdown
    cy.getBySel('user-cell-role-select').click()
    // click admin option
    cy.getBySel('admin-cell-role-option').contains('Admin').click()

    // cancel and make sure role is still member
    cy.get('.antd5-popconfirm-buttons').contains('Cancel').click()
    cy.getBySel('user-cell-role-select').should('contain', 'Member')

    // click role dropdown
    cy.getBySel('user-cell-role-select').click()
    // click admin option
    cy.getBySel('admin-cell-role-option').contains('Admin').click()
    // Confirm you want to change user role to admin
    cy.get('.antd5-popconfirm-buttons').contains('Yes').click()
    cy.getBySel('user-cell-role-select').should('contain', 'Admin')

    // reload page and make sure role is still Admin
    cy.reload()
    cy.waitForSpinners()

    searchForNewUser()

    // confirm that default role is admin
    cy.getBySel('user-cell-role-select').should('contain', 'Admin')
  })
})
