// FIXME add data-id attributes so we dont use classnames / contains(text) etc!

const DO_NOT_DELETE_DATASET_NAME = 'DO NOT DELETE ME - Cypress'
const DUPLICATE_DATASET_NAME = `Duplicate dataset - ${Date.now()} - Cypress`

const getDoNotDeleteDataset = () => {
  // go to all shared datasets
  cy.getBySel('index-sidebar-all-shared').click()
  cy.waitForSpinners()

  // click in name column header
  cy.get('.dataset-table-header-name')
    .first()
    .within(() => {
      cy.get('.antd5-dropdown-trigger').click()
    })

  // search for the dataset
  cy.get('.antd5-table-filter-dropdown').within(() => {
    cy.get('input').type(`${DO_NOT_DELETE_DATASET_NAME}{enter}`)
  })

  // there should only be one match for the dataset
  cy.get('.antd5-table-row').should('have.length', 1)
}

describe('Datasets Index - Company User', () => {
  beforeEach(() => {
    cy.login({ role: 'company_user', company: 'narratorclient' })
    cy.visit('narratorclient/datasets')
    cy.waitForSpinners()
  })

  it('redirect from old /datasets/v3 route to /datasets ', () => {
    cy.visit('narratorclient/datasets/v3')
    cy.waitForSpinners()

    cy.url().should('not.contain', '/datasets/v3/')
    cy.url().should('contain', '/datasets/')
  })

  it('does not allow company_user to edit properties for a dataset that is not theirs', () => {
    getDoNotDeleteDataset()

    // open actions dropdown
    cy.getBySel('dataset-actions-dropdown').first().click()
    cy.getBySel('dataset-actions-edit-option')
      .first()
      .parent()
      .should('have.class', 'antd5-dropdown-menu-item-disabled')
  })

  it('does not allow company_user to delete a dataset that is not theirs', () => {
    getDoNotDeleteDataset()

    // open actions dropdown
    cy.getBySel('dataset-actions-dropdown').first().click()
    cy.getBySel('dataset-actions-delete-option')
      .first()
      .parent()
      .should('have.class', 'antd5-dropdown-menu-item-disabled')
  })

  it('can duplicate a shared dataset that is not theirs', () => {
    // go to all shared datasets
    cy.getBySel('index-sidebar-all-shared').click()
    cy.waitForSpinners()

    // open actions dropdown
    cy.getBySel('dataset-actions-dropdown').first().click()
    cy.getBySel('dataset-actions-duplicate-option')
      .first()
      .parent()
      .should('not.have.class', 'antd5-dropdown-menu-item-disabled')

    // open duplicate dataset modal
    cy.getBySel('dataset-actions-duplicate-option').first().click()
    cy.waitForSpinners()

    // type and apply new name for new duplicated dataset
    cy.getBySel('duplicate-dataset-name-input').clear()
    cy.getBySel('duplicate-dataset-name-input').type(DUPLICATE_DATASET_NAME)
    cy.getBySel('confirm-duplicate-dataset').click()
    cy.waitForSpinners()

    // it should redirect you to the duplicate dataset on confirm above
    cy.url().should('contain', '/datasets/edit')

    // cleanup - delete the duplicate dataset
    // go back to index page
    cy.getBySel('nav-datasets').click()
    cy.waitForSpinners()

    // go to all mine datasets
    cy.getBySel('index-sidebar-all-mine').click()
    cy.waitForSpinners()

    // click in name column header
    cy.get('.dataset-table-header-name')
      .first()
      .within(() => {
        cy.get('.antd5-dropdown-trigger').click()
      })

    // search for the dataset
    cy.get('.antd5-table-filter-dropdown').within(() => {
      cy.get('input').type(`${DUPLICATE_DATASET_NAME}{enter}`)
    })

    // there should only be one match for the dataset
    cy.get('.antd5-table-row').should('have.length', 1)

    // open actions dropdown
    cy.getBySel('dataset-actions-dropdown').first().click()
    // click delete option
    cy.getBySel('dataset-actions-delete-option').first().click()
    cy.waitForSpinners()
    // confirm delete
    cy.getBySel('confirm-delete-dataset').first().click()
    cy.waitForSpinners()

    // confirm there are no datasets shown (since already filtered for)
    cy.get('.antd5-table-row').should('have.length', 0)
  })

  it('can open an existing dataset', () => {
    // cy.getBySel('dataset-item').getBySel('dataset-link').first().click()
    // cy.url().should('contain', '/datasets/edit/')

    // go to all shared datasets
    cy.getBySel('index-sidebar-all-shared').click()
    cy.waitForSpinners()

    // click on the first dataset
    cy.getBySel('dataset-index-name-link').first().click()
    cy.url().should('contain', '/datasets/edit/')
  })

  it('can open an existing dataset from the dataset search bar', () => {
    // go to all shared datasets
    cy.getBySel('index-sidebar-all-shared').click()
    cy.waitForSpinners()

    cy.getBySel('resource-search-select').type(`${DO_NOT_DELETE_DATASET_NAME}`)
    cy.get('.antd5-select-item-option-content').first().click()
    cy.url().should('contain', '/datasets/edit/')
  })

  it('can create a new existing dataset', () => {
    cy.getBySel('create-new-dataset-cta').click()
    cy.url().should('contain', '/datasets/new')
  })

  it('can favorite and unfavorite dataset', () => {
    // go to favorites tab and makes sure it's empty
    cy.getBySel('index-sidebar-favorites').click()
    cy.waitForSpinners()

    // there shouldn't be any datasets favorited
    cy.get('.antd5-table-row').should('have.length', 0)

    // go to all shared datasets
    getDoNotDeleteDataset()

    // favorite the dataset
    cy.getBySel('dataset-favorite-icon-favorited').should('have.length', 0)
    cy.getBySel('dataset-favorite-icon-not-favorited').should('have.length', 1)
    cy.getBySel('dataset-favorite-icon-not-favorited').first().click()
    cy.getBySel('dataset-favorite-icon-not-favorited').should('have.length', 0)
    cy.getBySel('dataset-favorite-icon-favorited').should('have.length', 1)

    // go to favorites tab and makes sure there is one favorite
    cy.getBySel('index-sidebar-favorites').click()
    cy.waitForSpinners()
    cy.get('.antd5-table-row').should('have.length', 1)

    // unfavorite the dataset
    cy.getBySel('dataset-favorite-icon-favorited').first().click()
    cy.waitForSpinners()
    cy.get('.ant-table-row').should('have.length', 0)
  })

  it('can add a filter in Recently Viewed tab, clear the filter when switching to Popular tab, and re-add a filter', () => {
    const addAndCheckAnalysesFilter = () => {
      // Add a used by filter
      cy.get('th')
        .contains('Used by')
        .parent()
        .within(() => {
          cy.get('.antd5-table-filter-trigger').click()
        })
      cy.get('.antd5-tree-title').contains('Analyses').click()
      cy.get('.antd5-table-filter-dropdown-btns').within(() => {
        cy.get('button').contains('OK').click()
      })

      // check that the filter has been added
      cy.get('th')
        .contains('Used by')
        .parent()
        .within(() => {
          cy.get('.antd5-table-filter-trigger').should('have.class', 'active')
        })
    }

    const goToTab = (tabName: string) => {
      cy.getBySel('shared-index-sidebar').within(() => {
        cy.get('.antd5-menu-item').contains(tabName).click()
      })
    }

    // make sure you are on the recently viewed side tab
    goToTab('Recently Viewed')
    cy.url().should('contain', '/recently_viewed')

    // Add a used by filter
    addAndCheckAnalysesFilter()

    // switch to the popular tab
    goToTab('Popular')
    cy.url().should('contain', '/popular')

    // check that the filter has been cleared
    cy.get('th')
      .contains('Used by')
      .parent()
      .within(() => {
        cy.get('.antd5-table-filter-trigger').should('not.have.class', 'active')
      })

    // add used by filter for Popular
    addAndCheckAnalysesFilter()

    // switch back to recently viewed tab
    goToTab('Recently Viewed')
    cy.url().should('contain', '/recently_viewed')

    // check that the filter has been removed
    cy.get('th')
      .contains('Used by')
      .parent()
      .within(() => {
        cy.get('.antd5-table-filter-trigger').should('not.have.class', 'active')
      })

    // add used by filter for Recently Viewed again
    addAndCheckAnalysesFilter()
  })
})

// TODO same as above but for company admin
// describe('Datasets Index - Company Admin', () => {
//   beforeEach(() => {
//     cy.visit('/narratorclient/datasets')
//     cy.loginAuth0({ role: 'company_admin' })
//   })
// })
