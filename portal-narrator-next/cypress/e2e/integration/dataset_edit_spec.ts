const getNewDataset = (datasetName: string) => {
  // find test dataset
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
    cy.get('input').type(`${datasetName}{enter}`)
  })

  // there should only be one match for the dataset
  cy.get('.antd5-table-row').should('have.length', 1)
  cy.waitForSpinners()
}

const createNewDataset = (datasetName: string) => {
  const COHORT_ACTIVITY = 'Marketing Session'

  // click create new dataset
  cy.getBySel('create-new-dataset-cta').click()
  cy.url().should('contain', '/narratorclient/datasets/new')
  cy.waitForSpinners()

  // choose activity_stream datasource
  cy.getBySel('activity-stream-select').click()
  cy.get('.antd5-select-item').contains('dw.activity_stream').first().click()
  cy.waitForSpinners()

  // Select "marketing session"
  cy.getBySel('activity-select').first().parent().type(COHORT_ACTIVITY)
  cy.getBySel('activity-select-option').contains(COHORT_ACTIVITY).first().click()
  cy.waitForSpinners()

  // click submit button
  cy.getBySel('dataset-definition-submit').click()
  cy.waitForSpinners()

  // click save icon
  cy.getBySel('save-dataset-cta').click()
  cy.waitForSpinners()

  // fill out save form
  cy.getBySel('dataset-form-fields').waitForSpinners().get('input[name="name"]').type(datasetName)

  // save dataset
  cy.getBySel('save-dataset-modal').within(() => {
    cy.get('button').contains('Save').click()
  })
  cy.waitForSpinners()
}

const deleteDataset = () => {
  cy.getBySel('dataset-actions-dropdown').first().click()
  cy.getBySel('dataset-actions-delete-option').first().click()
  cy.getBySel('confirm-delete-dataset').first().click()
}

describe('Edit Dataset - Company Admin', () => {
  const NEW_DATASET_NAME = `New Cypress Dataset - ${Date.now()}`
  const NEW_IFTTT_COLUMN_NAME = 'new ifttt column name'
  const NEW_MATH_COLUMN_NAME = 'new math column name'

  before(() => {
    // login and create a dataset to edit
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit('narratorclient/datasets')

    createNewDataset(NEW_DATASET_NAME)
  })

  beforeEach(() => {
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit('narratorclient/datasets')
    cy.waitForSpinners()

    // find test dataset
    getNewDataset(NEW_DATASET_NAME)

    // navigate to the dataset
    cy.getBySel('dataset-index-name-link').first().click()
    cy.url().should('contain', '/datasets/edit/new_cypress_dataset')

    cy.waitForSpinners()
  })

  after(() => {
    // Reset auth state
    cy.login({ role: 'company_admin', company: 'narratorclient' })
    cy.visit('narratorclient/datasets')

    // find test dataset
    getNewDataset(NEW_DATASET_NAME)

    // delete it
    deleteDataset()
  })

  it('redirects from old edit.v2 route', () => {
    cy.url().then((url) => {
      const v2EditUrl = url.replace('/edit/', '/edit.v2/')
      cy.visit(v2EditUrl)
    })

    cy.waitForSpinners()

    cy.url().should('not.contain', 'edit.v2')
    cy.url().should('contain', '/datasets/edit/new_cypress_dataset')
  })

  it('can add an activity/save and remove the activity/save', () => {
    const APPEND_ACTIVITY = 'Email Clicked'

    // open edit definition modal
    cy.getBySel('dataset-edit-definition-cta').click()
    cy.waitForSpinners()

    // click add append/join activity
    cy.getBySel('append-activity-cta').click()

    // search for activity (some activities in narratorclient are broken)
    cy.getBySel('activity-select').contains('Select an activity').parent().type(APPEND_ACTIVITY)

    // Select APPEND_ACTIVITY option in select
    cy.getBySel('activity-select-option')
      .first()
      .getBySel('activity-name')
      .first()
      // grab its text
      .invoke('text')
      .then((text) => {
        // select first option
        cy.getBySel('activity-select-option').first().click()

        // click submit button
        cy.getBySel('dataset-definition-submit').click()
        cy.waitForSpinners()

        // click save
        cy.getBySel('dataset-manage-menu-ctas').first().click()
        cy.waitForSpinners(4)

        // check for success messaging
        cy.get('.antd5-notification-notice').should('contain', 'Saved successfully')

        // refresh page to make sure the actiivty has saved
        cy.reload()
        cy.waitForSpinners()

        // check if info panel title matches activity selected after refresh
        cy.getBySel('dataset-info-panel-activity-append').should('contain', text)

        // CLEANUP // - delete activity and save again
        cy.getBySel('dataset-edit-definition-cta').click()
        cy.getBySel('remove-append-activity').click()
        // click submit button
        cy.getBySel('dataset-definition-submit').click()
        cy.waitForSpinners()
        // click save
        cy.getBySel('dataset-manage-menu-ctas').first().click()
        cy.get('.antd5-notification-notice').should('contain', 'Saved successfully')

        // refresh page to make sure the actiivty has been removed
        cy.reload()
        cy.waitForSpinners()
        cy.getBySel('dataset-info-panel-activity')
        cy.getBySel('dataset-info-panel-activity-append').should('not.exist')
      })
  })

  it('can add a filter/save and remove the filter/save', () => {
    // click filter icon
    cy.getBySel('column-row-filter').first().click()
    // add test value for filter input
    cy.getBySel('filter-value-input-string').type('Test Filter Value')
    // apply filter
    cy.getBySel('apply-column-filter-cta').click()

    // save dataset with filter
    cy.getBySel('dataset-manage-menu-ctas').first().click()
    cy.get('.antd5-notification-notice').should('contain', 'Saved successfully')

    // refresh page to make sure the filter has saved
    cy.reload()
    cy.waitForSpinners()

    // check if filter is still there
    cy.getBySel('column-row-filter').first().click()
    cy.get('[data-test="filter-value-input-string"] input').should('have.value', 'Test Filter Value')

    // clean up filter
    cy.getBySel('list-item-card-close').click()
    cy.getBySel('apply-column-filter-cta').click()

    // save without filter
    cy.getBySel('dataset-manage-menu-ctas').first().click()
    cy.get('.antd5-notification-notice').should('contain', 'Saved successfully')

    // refresh page to make sure the actiivty has been removed
    cy.reload()
    cy.waitForSpinners()

    // check that filter is gone
    cy.getBySel('column-row-filter').first().click()
    cy.get('[data-test="filter-value-input-string"] input').should('have.value', '')
  })

  // TODO: can't login until we get the new login flow set up for cypress
  // test this when it's functional again
  it('can add a column filter that is a no value filter - i.e. is null', () => {
    // click filter icon to open filter popover
    cy.getBySel('column-row-filter').first().click()

    // change the operator to "is Null"
    cy.getBySel('filter-operator-select').click()
    cy.get('.antd5-select-item').contains('is Null').click()

    // check that you can add a no value filter
    cy.getBySel('apply-column-filter-cta').should('not.be.disabled')
  })

  it('can add a filter to did/did not occur columns', () => {
    // add an append/join column
    cy.getBySel('dataset-edit-definition-cta').click()
    cy.getBySel('append-activity-cta').click()
    cy.getBySel('activity-select').last().click()
    cy.getBySel('activity-select-option').last().click()
    cy.waitForSpinners()
    cy.getBySel('dataset-definition-submit').click()
    cy.waitForSpinners()

    // find an append/join column that starts with "Did"
    cy.getBySel('dataset-info-panel-activity-append').within(() => {
      cy.contains('[data-test="column-row"]', 'Did ')
        .invoke('index')
        .then((index) => {
          cy.getBySel('column-row-filter').eq(index).click()
        })
    })

    // add a filter to that column
    cy.getBySel('column-filter-modal').within(() => {
      cy.get('.antd5-select').first().click()
    })
    cy.waitForSpinners()

    cy.get('.antd5-select-item-option-content').contains('Did Not').first().click()
    cy.getBySel('apply-column-filter-cta').click()

    // save and reload page
    cy.getBySel('dataset-manage-menu-ctas').first().click()
    cy.get('.antd5-notification-notice').should('contain', 'Saved successfully')
    cy.reload()
    cy.waitForSpinners(4)

    // check if filter is still there
    cy.getBySel('dataset-info-panel-activity-append').within(() => {
      cy.contains('[data-test="column-row"]', 'Did ')
        .invoke('index')
        .then((index) => {
          cy.getBySel('column-row-filter').eq(index).click()
        })
    })

    cy.getBySel('column-filter-modal').within(() => {
      cy.get('.antd5-select').first().should('contain', 'Did Not')

      // remove filter
      cy.getBySel('list-item-card-close').click()
      cy.getBySel('apply-column-filter-cta').click()
    })

    // save without filter
    cy.getBySel('dataset-manage-menu-ctas').first().click()
    cy.get('.antd5-notification-notice').should('contain', 'Saved successfully')
  })

  it('can rename a column', () => {
    const NEW_NAME = 'new column name'
    // grab first column's name (rename it back to original name in cleanup)
    cy.getBySel('column-row')
      .first()
      .invoke('text')
      .then((text) => {
        // open the options
        cy.getBySel('column-row').first().click()
        // select rename option
        cy.getBySel('rename-column-option').click()
        // clear name and type new name
        cy.getBySel('edit-label-field-renaming')
          .first()
          .within(() => {
            cy.get('input').type(`${NEW_NAME}{enter}`)
          })

        // save dataset and refresh
        cy.getBySel('dataset-manage-menu-ctas').first().click()
        cy.get('.antd5-notification-notice').should('contain', 'Saved successfully')
        cy.reload()
        cy.waitForSpinners()

        // check that new name persisted
        cy.getBySel('column-row').first().should('contain', NEW_NAME)

        //////////////////////////////////////////////
        //// cleanup by renaming to original name ////
        //////////////////////////////////////////////
        // open the options
        cy.getBySel('column-row').first().click()
        // select rename option
        cy.getBySel('rename-column-option').click()
        // clear name and type new name
        cy.getBySel('edit-label-field-renaming')
          .first()
          .within(() => {
            cy.get('input').clear()
            cy.get('input').type(text)
          })

        // save dataset and refresh
        cy.getBySel('dataset-manage-menu-ctas').first().click()
        cy.get('.antd5-notification-notice').should('contain', 'Saved successfully')
        cy.reload()
        cy.waitForSpinners()
        cy.getBySel('column-row').first().should('contain', text)
      })
  })

  it('can rename a column via double click', () => {
    const NEW_NAME = 'new column name dblclick'
    // grab first column's name (rename it back to original name in cleanup)
    cy.getBySel('column-row')
      .first()
      .invoke('text')
      .then((text) => {
        // double click
        cy.getBySel('column-row').first().dblclick()
        // clear name and type new name
        cy.getBySel('edit-label-field-renaming')
          .first()
          .within(() => {
            cy.get('input').clear()
            cy.get('input').type(`${NEW_NAME}{enter}`, { timeout: 1000 })
          })

        // save dataset and refresh
        cy.getBySel('dataset-manage-menu-ctas').first().click()
        cy.get('.antd5-notification-notice').should('contain', 'Saved successfully')
        cy.reload()
        cy.waitForSpinners()

        // check that new name persisted
        cy.getBySel('column-row').first().should('contain', NEW_NAME)

        //////////////////////////////////////////////
        //// cleanup by renaming to original name ////
        //////////////////////////////////////////////
        // double click
        cy.getBySel('column-row').first().dblclick()
        // clear name and type new name
        cy.getBySel('edit-label-field-renaming')
          .first()
          .within(() => {
            cy.get('input').clear()
            cy.get('input').type(`${text}{enter}`, { timeout: 1000 })
          })

        // save dataset and refresh
        cy.getBySel('dataset-manage-menu-ctas').first().click()
        cy.get('.antd5-notification-notice').should('contain', 'Saved successfully')
        cy.reload()
        cy.waitForSpinners()
        cy.getBySel('column-row').first().should('contain', text)
      })
  })

  it('can hide and show a column', () => {
    // change first column's name to be unique for more accurate text matching later
    const UNIQUE_COLUMN_NAME = '23nkj91vb'
    // open the options
    cy.getBySel('column-row').first().click()
    // select rename option
    cy.getBySel('rename-column-option').click()
    // clear name and type new name
    cy.getBySel('edit-label-field-renaming')
      .first()
      .within(() => {
        cy.get('input').clear()
        cy.get('input').type(`${UNIQUE_COLUMN_NAME}{enter}`)
      })

    // open the options
    cy.getBySel('column-row').first().click()
    // select hide option
    cy.getBySel('hide-column-option').click()

    // click run and wait for results
    cy.getBySel('run-dataset-cta').click()
    cy.waitForSpinners()

    // add a longer timeout to help make sure there is enough time for data to come back
    cy.getBySel('run-dataset-cta', { timeout: 40000 })

    // check that header column does not exist in table anymore
    cy.get('.ag-header')
      .first()
      .within(() => {
        // make sure column rows have loaded in the header before checking if this column is hidden
        cy.getBySel('column-row')
        cy.getBySel('column-row').contains(UNIQUE_COLUMN_NAME).should('not.exist')
      })

    // show column again
    cy.getBySel('column-row').first().click()
    cy.getBySel('hide-column-option').click()
    // click run and wait for results
    cy.getBySel('run-dataset-cta').click()
    cy.waitForSpinners()
    cy.getBySel('run-dataset-cta', { timeout: 30000 })

    // check that header column exists in table now
    cy.get('.ag-header')
      .first()
      .within(() => {
        // make sure column rows have loaded in the header before checking if this column is hidden
        cy.getBySel('column-row')
        cy.getBySel('column-row').should('include.text', UNIQUE_COLUMN_NAME)
      })
  })

  it('can delete a column and re-add it', () => {
    // grab first column's name
    // (check that it's removed in dataset table after delete and added after)
    cy.getBySel('column-row')
      .first()
      .invoke('text')
      .then((text) => {
        // open the options
        cy.getBySel('column-row').first().click()
        // select hide option
        cy.getBySel('delete-column-option').click()

        // check that column is not there
        cy.getBySel('column-row').contains(text).should('not.exist')

        // re-add column
        cy.getBySel('dataset-edit-definition-cta').click()
        cy.waitForSpinners()
        cy.getBySel('dataset-info-panel-activity').within(() => {
          // click add button
          cy.getBySel('add-button').first().click()
        })

        //  re-select the original column
        cy.getBySel('additional-column-select').type(text)
        cy.getBySel('additional-column-option').first().click()
        cy.get('.antd5-popover button').contains('Add').click({ force: true })
        // submit changes
        cy.getBySel('dataset-definition-submit').click()
        cy.waitForSpinners()

        // check that column is re-added
        cy.getBySel('column-row').contains(text).should('exist')
      })
  })

  it('can delete multiple columns at once', () => {
    // click multuple delete toggle
    cy.getBySel('toggle-delete-columns').click()

    cy.waitForSpinners()

    cy.getBySel('column-row').then((rows) => {
      // get column count to see that it's less after delete
      const columnCount = Cypress.$(rows).length
      // get checkboxes inside of the first info panel
      cy.getBySel('dataset-info-panel-activity').within(() => {
        // click first and last checkbox
        cy.getBySel('delete-column-checkbox').first().click()
        cy.getBySel('delete-column-checkbox').last().click()
      })

      // submit delete
      cy.getBySel('delete-columns-cta').click()
      cy.waitForSpinners()
      // check that the length of columns is now less after delete
      cy.getBySel('column-row').should('have.length.lessThan', columnCount)
    })
  })

  it('can group by only column, day, week, month, and year', () => {
    // create new group tab by only column
    cy.getBySel('column-row').first().click()
    cy.getBySel('column-multi-option-menu').contains('Group by').trigger('mouseover')
    cy.getBySel('column-sub-option').contains('Only Column').click()
    cy.waitForSpinners()
    cy.url().should('contain', 'group=')

    // return to parent column
    cy.getBySel('parent-tab').click()
    cy.waitForSpinners()
    cy.url().should('not.contain', 'group=')

    // create new groub tab by day
    cy.getBySel('column-row').first().click()
    cy.getBySel('column-multi-option-menu').contains('Group by').trigger('mouseover')
    cy.getBySel('column-sub-option').contains('By Day').click()
    cy.waitForSpinners()
    cy.url().should('contain', 'group=')

    // return to parent column
    cy.getBySel('parent-tab').click()
    cy.waitForSpinners()
    cy.url().should('not.contain', 'group=')

    // create new groub tab by week
    cy.getBySel('column-row').first().click()
    cy.getBySel('column-multi-option-menu').contains('Group by').trigger('mouseover')
    cy.getBySel('column-sub-option').contains('By Week').click()
    cy.waitForSpinners()
    cy.url().should('contain', 'group=')

    // return to parent column
    cy.getBySel('parent-tab').click()
    cy.waitForSpinners()
    cy.url().should('not.contain', 'group=')
    // create new groub tab by month
    cy.getBySel('column-row').first().click()
    cy.getBySel('column-multi-option-menu').contains('Group by').trigger('mouseover')
    cy.getBySel('column-sub-option').contains('By Month').click()
    cy.waitForSpinners()
    cy.url().should('contain', 'group=')
  })

  it('can cascade rename of column', () => {
    const NEW_COLUMN_NAME = 'new column name'
    //// create a group off of first column ////
    cy.getBySel('column-row').first().click()
    cy.getBySel('column-multi-option-menu').contains('Group by').trigger('mouseover')
    cy.getBySel('column-sub-option').contains('Only Column').click()
    cy.waitForSpinners()
    cy.url().should('contain', 'group=')

    // return to parent column
    cy.getBySel('parent-tab').click()
    cy.waitForSpinners()
    cy.url().should('not.contain', 'group=')

    //// rename first column ////
    // open the column options
    cy.getBySel('column-row').first().click()

    // select rename option
    cy.getBySel('rename-column-option').click()

    // clear name and type new name
    cy.getBySel('edit-label-field-renaming')
      .first()
      .within(() => {
        cy.get('input').clear()
        cy.get('input').type(`${NEW_COLUMN_NAME} {enter}`)
      })

    //// cascase rename ////
    // open the column options
    cy.getBySel('column-row').first().click()

    // select cascade rename option
    cy.getBySel('column-option').contains('Cascade Name').click()
    cy.waitForSpinners()

    // go to group
    cy.getBySel('group-tab').last().click()
    cy.waitForSpinners()

    // check that first column in group has been renamed
    cy.getBySel('column-row').first().should('contain', NEW_COLUMN_NAME)
  })

  it('can delete dependent metrics', () => {
    // create new group
    cy.getBySel('group-by-cta').click()
    cy.waitForSpinners()

    // FIXME: use selectors
    // getPopupContainer on popover solution causes content to enlarge
    cy.get('.antd5-popover-content').within(() => {
      cy.get('.antd5-select').first().click()
    })
    cy.getBySel('column-select-label-enabled').last().click()
    cy.getBySel('create-group-cta').click({ force: true })
    cy.url().should('contain', 'group=')

    // create new metric column
    cy.getBySel('info-panel-metrics').within(() => {
      cy.getBySel('add-button').click()
    })

    cy.getBySel('group-metric-modal').within(() => {
      cy.get('.antd5-select').last().click()
    })

    // grab name of column selected
    cy.getBySel('column-select-label-enabled')
      .last()
      .invoke('text')
      .then((text) => {
        cy.getBySel('column-select-label-enabled').last().click()
        cy.getBySel('add-group-metric-cta').click()

        // make sure column was added
        cy.getBySel('info-panel-metrics').within(() => {
          cy.getBySel('column-row').should('contain', text)
        })

        // return to parent tab
        cy.getBySel('parent-tab').click()
        cy.url().should('not.contain', 'group=')

        // select parent column that was chosen in the group metric
        cy.getBySel('column-row').contains(text).first().click()

        // click it's delete dependent metric option
        cy.getBySel('column-option').contains('Delete Dependent Metrics').click()

        // go to the group and check that the metric is deleted
        cy.getBySel('group-tab').last().click()
        cy.url().should('contain', 'group=')
        cy.getBySel('info-panel-metrics').within(() => {
          cy.getBySel('column-row').contains(text).should('not.exist')
        })
      })
  })

  it('can add a metric column to groups column option', () => {
    // create new group
    cy.getBySel('group-by-cta').click()
    cy.waitForSpinners()

    // FIXME: use selectors
    // getPopupContainer on popover solution causes content to enlarge
    cy.get('.antd5-popover-content').within(() => {
      cy.get('.antd5-select').first().click()
    })
    cy.getBySel('column-select-label-enabled').last().click()
    cy.getBySel('create-group-cta').click()
    cy.url().should('contain', 'group=')

    // return to parent tab
    cy.getBySel('parent-tab').click()
    cy.url().should('not.contain', 'group=')

    // grab column rows text to make sure a metric column is created from it
    cy.getBySel('column-row')
      .first()
      .invoke('text')
      .then((text) => {
        // add metric column from options
        cy.getBySel('column-row').first().click()
        cy.getBySel('column-multi-option-menu').contains('Add a Metric Column to groups').click()
        cy.getBySel('column-sub-option').first().click()

        // go to the group and check that the metric is deleted
        cy.getBySel('group-tab').last().click()
        cy.url().should('contain', 'group=')
        cy.getBySel('info-panel-metrics').within(() => {
          cy.getBySel('column-row').contains(text).should('exist')
        })
      })
  })

  it('can order the dataset', () => {
    // select first column's option for reordering
    cy.getBySel('column-row').first().click()
    cy.getBySel('order-column-option').click()
    cy.getBySel('order-column-by-modal').within(() => {
      cy.getBySel('column-select').first().click()
    })

    // select last column to be ordered
    cy.getBySel('column-select-label-enabled')
      .last()
      .invoke('text')
      .then((text) => {
        cy.getBySel('column-select-label-enabled').last().click()
        cy.getBySel('order-column-by-modal').within(() => {
          cy.get('button').contains('Update Order').click()
        })
        cy.waitForSpinners()

        // find the column that was ordered
        cy.getBySel('column-row')
          .contains(text)
          .parentsUntil('[data-test="column-row"]')
          .parent()
          .first()
          .within(() => {
            // and make sure that it has the ordered icon
            cy.getBySel('order-by-column-icon').should('exist')
          })
      })
  })

  it('can create and delete a computation column', () => {
    const NEW_COMPUTED_COLUMN_NAME = 'new computed column name'

    // click the add computation column button
    cy.getBySel('info-panel-computation').within(() => {
      cy.getBySel('add-button').click()
    })

    // add a computed column in the modal
    cy.getBySel('edit-computed-column-modal').within(() => {
      // first column is Time Add
      cy.getBySel('edit-computed-column-label').first().click()
      // add a name
      cy.getBySel('edit-computed-column-name').within(() => {
        cy.get('input').type(NEW_COMPUTED_COLUMN_NAME)
      })

      cy.getBySel('add-computed-column-cta').click()
    })

    // check that the column is there
    cy.getBySel('info-panel-computation').within(() => {
      cy.getBySel('column-row').contains(NEW_COMPUTED_COLUMN_NAME).should('exist')
    })
  })

  it('can create a compute column, update to a freehand function, validate and create', () => {
    const NON_FREEHAND_COLUMN_NAME = 'change me to a freehand function'
    const NOW_A_FREEHAND_COLUMN_NAME = 'now I am a freehand function'

    // click the add computation column button
    cy.getBySel('info-panel-computation').within(() => {
      cy.getBySel('add-button').click()
    })

    // add a computed column in the modal
    cy.getBySel('edit-computed-column-modal').within(() => {
      // first column is Time Add
      cy.getBySel('edit-computed-column-label').first().click()
      // add a name
      cy.getBySel('edit-computed-column-name').within(() => {
        cy.get('input').type(NON_FREEHAND_COLUMN_NAME)
      })

      cy.getBySel('add-computed-column-cta').click()
    })

    // check that the column is there
    cy.getBySel('info-panel-computation').within(() => {
      cy.getBySel('column-row').contains(NON_FREEHAND_COLUMN_NAME).should('exist')
      cy.getBySel('column-row').contains(NON_FREEHAND_COLUMN_NAME).click()
    })

    // edit the non-freehand column
    cy.getBySel('column-menu').within(() => {
      cy.getBySel('edit-column-option').click({ force: true })
    })

    cy.getBySel('edit-computed-column-modal').within(() => {
      cy.getBySel('edit-computed-column-label').contains('Freehand Function').first().click()

      // the label should already be pre-focused
      cy.getBySel('edit-computed-column-name').within(() => {
        cy.get('input').should('be.focused')
        cy.get('input').type(NOW_A_FREEHAND_COLUMN_NAME)
      })

      // add a freehand function to the editor
      cy.getBySel('basic-editor-wrapper').click()
      cy.getBySel('basic-editor-wrapper').type('1')

      // validate the freehand function
      cy.getBySel('validate-freehand-cta').click()
      cy.waitForSpinners()

      cy.getBySel('add-computed-column-cta').should('be.enabled')
      cy.getBySel('add-computed-column-cta').click()
    })

    // now make sure that the freehand function persisted
    cy.getBySel('info-panel-computation').within(() => {
      cy.getBySel('column-row').contains(NOW_A_FREEHAND_COLUMN_NAME).should('exist')
      cy.getBySel('column-row').contains(NOW_A_FREEHAND_COLUMN_NAME).click()
    })

    // open the edit modal
    cy.getBySel('column-menu').within(() => {
      cy.getBySel('edit-column-option').click({ force: true })
    })

    cy.getBySel('basic-editor-wrapper').should('contain', '1')
  })

  it('can validate and create a freehand function', () => {
    const FREEHAND_FUNCTION_NAME = 'new freehand function'

    // click the add computation column button
    cy.getBySel('info-panel-computation').within(() => {
      cy.getBySel('add-button').click()
    })

    // first add a math computation column
    cy.getBySel('edit-computed-column-modal').within(() => {
      cy.getBySel('edit-computed-column-label').contains('Freehand Function').first().click()

      // add a name
      cy.getBySel('edit-computed-column-name').within(() => {
        cy.get('input').type(FREEHAND_FUNCTION_NAME)
      })

      // add a failing entry
      cy.getBySel('basic-editor-wrapper').click()
      cy.getBySel('basic-editor-wrapper').type('a')
      // click on title to close the autocomplete menu that covers the validate button
      cy.getBySel('computed-column-form-title').click()
      cy.getBySel('validate-freehand-cta').click()
      cy.waitForSpinners()

      // check that errors were visible
      cy.getBySel('machine-error-alert').should('exist')
      // check that you can't add the compute column when invalid
      cy.getBySel('add-computed-column-cta').should('not.exist')

      // update wrapper with valid entry
      cy.getBySel('basic-editor-wrapper').click()
      cy.getBySel('basic-editor-wrapper').type('{cmd+a}{del}')
      cy.getBySel('basic-editor-wrapper').click()
      cy.getBySel('basic-editor-wrapper').type('1')
      cy.getBySel('validate-freehand-cta').click()
      cy.waitForSpinners()

      // adding the compute column should be available now
      cy.getBySel('add-computed-column-cta').should('exist')
      cy.getBySel('add-computed-column-cta').should('be.enabled')
      cy.getBySel('add-computed-column-cta').click()
      cy.waitForSpinners()
    })

    // check that column exists in the sidebar of dataset
    cy.getBySel('info-panel-computation').within(() => {
      cy.getBySel('column-row').contains(FREEHAND_FUNCTION_NAME).should('exist')
    })
  })

  const checkIftttColumnType = () => {
    // click the add computation column button
    cy.getBySel('info-panel-computation').within(() => {
      cy.getBySel('add-button').click()
    })

    // first add a math computation column
    cy.getBySel('edit-computed-column-modal').within(() => {
      cy.getBySel('edit-computed-column-label').contains('Math Operation').first().click()

      // add a name
      cy.getBySel('edit-computed-column-name').within(() => {
        cy.get('input').type(NEW_MATH_COLUMN_NAME)
      })
      cy.getBySel('add-computed-column-cta').click()
    })

    // click the add computation column button
    cy.getBySel('info-panel-computation').within(() => {
      cy.getBySel('add-button').click()
    })

    // then add a ifttt column targeting the math column
    cy.getBySel('edit-computed-column-modal').within(() => {
      cy.getBySel('edit-computed-column-label').contains('Conditional IF Statement (IFTTT)').click()

      // add a name
      cy.getBySel('edit-computed-column-name').within(() => {
        cy.get('input').type(NEW_IFTTT_COLUMN_NAME)
      })

      // select the math column
      cy.getBySel('column-select').first().click()
      cy.getBySel('column-select').type(NEW_MATH_COLUMN_NAME)
    })

    // escape modal to target dropdown items
    cy.getBySel('column-select-label-enabled').contains(NEW_MATH_COLUMN_NAME).click({ force: true })
    cy.getBySel('filter-value-input-string').first().type('1')

    // change "then" and "else" value type to number
    cy.getBySel('edit-computed-column-modal').within(() => {
      cy.getBySel('value-output-type-select').first().type('Number')
    })
    cy.get('.antd5-select-dropdown')
      .not('.antd5-select-dropdown-hidden')
      .within(() => {
        cy.get('.antd5-select-item-option-active').contains('Number').first().click()
      })

    cy.getBySel('edit-computed-column-modal').within(() => {
      cy.getBySel('value-output-type-select').last().type('Number')
    })

    cy.get('.antd5-select-dropdown')
      .not('.antd5-select-dropdown-hidden')
      .within(() => {
        cy.get('.antd5-select-item-option-active').contains('Number').first().click()
      })

    // add the ifttt column
    cy.getBySel('add-computed-column-cta').click()

    // open the computation column modal up again
    cy.getBySel('info-panel-computation').within(() => {
      cy.getBySel('add-button').click()
    })

    // and check that the new column is a math column
    cy.getBySel('edit-computed-column-modal').within(() => {
      cy.getBySel('edit-computed-column-label').contains('Math Operation').first().click()

      cy.getBySel('column-select').type(NEW_IFTTT_COLUMN_NAME)
    })

    // escape modal to check dropdown option
    cy.getBySel('column-select-label-enabled').first().should('not.be.disabled')
  }

  it('can reorder ifttt cases', () => {
    const NEW_TIME_ADD_COLUMN_NAME = 'new time add column'
    const SECOND_CASE_OUTPUT_VALUE = 'output value for time add'

    // add initial IFTTT column
    checkIftttColumnType()

    // close the modal
    cy.get('.antd5-modal-close-x').click()

    // click the add computation column button
    cy.getBySel('info-panel-computation').within(() => {
      cy.getBySel('add-button').click()
    })

    // add "Time Add" compute column to taget later
    cy.getBySel('edit-computed-column-modal').within(() => {
      cy.getBySel('edit-computed-column-label').contains('Time Add').first().click()

      // add a name
      cy.getBySel('edit-computed-column-name').within(() => {
        cy.get('input').type(NEW_TIME_ADD_COLUMN_NAME)
      })
      cy.getBySel('add-computed-column-cta').click()
    })

    // reopen the IFTTT column overlay
    cy.getBySel('info-panel-computation').within(() => {
      cy.getBySel('column-row').contains(NEW_IFTTT_COLUMN_NAME).click()
    })
    cy.getBySel('column-menu').within(() => {
      cy.getBySel('edit-column-option').click()
    })

    // make sure first ifttt case is targeting new math column
    cy.getBySel('ifttt-case')
      .first()
      .within(() => {
        cy.getBySel('column-select').first().should('contain', NEW_MATH_COLUMN_NAME)
      })

    // add another IFTTT case
    cy.getBySel('add-ifttt-case-cta').click()

    // select last case
    cy.getBySel('ifttt-case')
      .last()
      .within(() => {
        // select the new time add column
        cy.getBySel('value-output-field').first().type(SECOND_CASE_OUTPUT_VALUE)
        cy.getBySel('column-select').first().click()
        cy.getBySel('column-select').first().type(NEW_TIME_ADD_COLUMN_NAME)
      })

    cy.get('.antd5-select-dropdown')
      .not('.antd5-select-dropdown-hidden')
      .within(() => {
        cy.get('.antd5-select-item-option-active').contains(NEW_TIME_ADD_COLUMN_NAME).first().click()
      })

    cy.getBySel('ifttt-case')
      .last()
      .within(() => {
        cy.getBySel('company-timezone-date-picker').click()
      })
    // escape within to click the today button in antd overlay
    cy.get('.ant-picker-today-btn').click()

    // move first case down
    cy.getBySel('ifttt-case')
      .first()
      .within(() => {
        cy.getBySel('move-ifttt-case-down').click()
      })

    // check that first case now has SECOND_CASE values
    cy.getBySel('ifttt-case')
      .first()
      .within(() => {
        cy.getBySel('column-select').first().should('contain', NEW_TIME_ADD_COLUMN_NAME)
        cy.getBySel('company-timezone-date-picker').invoke('val').should('not.be.empty')
        cy.getBySel('value-output-field')
          .first()
          .within(() => {
            cy.get('input').invoke('val').should('contain', SECOND_CASE_OUTPUT_VALUE)
          })
      })

    // check that second case has the original first case
    cy.getBySel('ifttt-case')
      .last()
      .within(() => {
        cy.getBySel('column-select').first().should('contain', NEW_MATH_COLUMN_NAME)
      })

    // move second case up
    cy.getBySel('ifttt-case')
      .last()
      .within(() => {
        cy.getBySel('move-ifttt-case-up').click()
      })

    // check that first case now has original values
    cy.getBySel('ifttt-case')
      .first()
      .within(() => {
        cy.getBySel('column-select').first().should('contain', NEW_MATH_COLUMN_NAME)
      })

    // check that second case now has its original values
    cy.getBySel('ifttt-case')
      .last()
      .within(() => {
        cy.getBySel('column-select').first().should('contain', NEW_TIME_ADD_COLUMN_NAME)
        cy.getBySel('company-timezone-date-picker').invoke('val').should('not.be.empty')
        cy.getBySel('value-output-field')
          .first()
          .within(() => {
            cy.get('input').invoke('val').should('contain', SECOND_CASE_OUTPUT_VALUE)
          })
      })
  })

  it('can create a computation column ifttt in parent with the correct column type', () => {
    checkIftttColumnType()
  })

  it('can create a computation column ifttt in group with the correct column type', () => {
    // open create new group popover
    cy.getBySel('group-by-cta').click()
    cy.waitForSpinners()

    // don't add any columns - just click to create group
    cy.getBySel('create-group-cta').click({ force: true })

    // make sure you are redirected to a group
    cy.url().should('contain', 'group=')

    checkIftttColumnType()
  })

  it('can create a IFTTT compute column using a field', () => {
    const IFTTT_COLUMN_WITH_FIELD_NAME = 'ifttt-column-with-field'

    // click the add computation column button
    cy.getBySel('info-panel-computation').within(() => {
      cy.getBySel('add-button').click()
    })

    // then add a ifttt column
    cy.getBySel('edit-computed-column-modal').within(() => {
      cy.getBySel('edit-computed-column-label').contains('Conditional IF Statement (IFTTT)').click()

      // add a name
      cy.getBySel('edit-computed-column-name').within(() => {
        cy.get('input').type(IFTTT_COLUMN_WITH_FIELD_NAME)
      })

      // select the first available column
      cy.getBySel('column-select').first().click()
    })
    cy.getBySel('column-select-label-enabled').first().click()

    // change column kind to "field"
    cy.getBySel('value-kind-select').first().click()
    cy.get('.antd5-select-item').contains('field').click()

    // add a made up field
    cy.getBySel('field-slug-input').first().click()
    cy.getBySel('field-slug-input').first().type('abc')

    // add a output value
    cy.getBySel('value-output-field')
      .first()
      .within(() => {
        cy.get('input').type('abcd')
      })

    // add else value output
    cy.getBySel('value-output-field')
      .last()
      .within(() => {
        cy.get('input').type('abcde')
      })

    // check that cta is no longer disabled
    cy.getBySel('add-computed-column-cta').should('not.be.disabled')
    cy.getBySel('add-computed-column-cta').click()

    // check that ifttt column is in left sidebar
    cy.getBySel('info-panel-computation').within(() => {
      cy.getBySel('column-row').contains(IFTTT_COLUMN_WITH_FIELD_NAME).should('exist')
    })
  })

  it('can create an ifttt column only when all output types are the same (excluding null and column types and )', () => {
    // click the add computation column button
    cy.getBySel('info-panel-computation').within(() => {
      cy.getBySel('add-button').click()
    })

    // then add a ifttt column targeting the math column
    cy.getBySel('edit-computed-column-modal').within(() => {
      cy.getBySel('edit-computed-column-label').contains('Conditional IF Statement (IFTTT)').click()

      // add a name
      cy.getBySel('edit-computed-column-name').within(() => {
        cy.get('input').type('ifttt output type test')
      })

      // select first column available
      cy.getBySel('column-select').first().click()
    })

    // escape modal to click on dropdown content (selecting first column)
    cy.get('.antd5-select-item-option-content').first().click({ force: true })

    // add value for first case
    cy.getBySel('filter-value-input-string').first().type('value should equal this')

    // first value type defaults to string
    // add an output value for it for now
    cy.getBySel('value-output-field').first().type('first value output')

    // else value type also defaults to string
    // add an output value for it now to check if form is valid
    cy.getBySel('value-output-field').last().type('last value output')

    // check that form is valid
    cy.getBySel('add-computed-column-cta').should('not.be.disabled')

    // update first output type to be null
    cy.getBySel('column-type-select')
      .first()
      .within(() => {
        // cy.get('.antd5-select').click()
        cy.get('.antd5-select').type('Null')
      })

    cy.get('.antd5-select-dropdown')
      .not('.antd5-select-dropdown-hidden')
      .within(() => {
        cy.get('.antd5-select-item-option-active').contains('Null').first().click()
      })

    // check that form is valid (null doesn't count as mismatch)
    cy.getBySel('add-computed-column-cta').should('not.be.disabled')

    // update first output type to be a number
    cy.getBySel('column-type-select')
      .first()
      .within(() => {
        // cy.get('.antd5-select').click()
        cy.get('.antd5-select').type('Number')
      })
    cy.get('.antd5-select-dropdown')
      .not('.antd5-select-dropdown-hidden')
      .within(() => {
        cy.get('.antd5-select-item-option-active').contains('Number').first().click()
      })

    // check that form is invalid (number and string don't match)
    cy.getBySel('add-computed-column-cta').should('be.disabled')

    // update the else type output to number
    cy.getBySel('column-type-select')
      .last()
      .within(() => {
        // cy.get('.antd5-select').click()
        cy.get('.antd5-select').type('Number')
      })

    cy.get('.antd5-select-dropdown')
      .not('.antd5-select-dropdown-hidden')
      .within(() => {
        cy.get('.antd5-select-item-option-active').contains('Number').first().click()
      })

    // check that form is valid (number and number match)
    cy.getBySel('add-computed-column-cta').should('not.be.disabled')

    // update the else type output to column
    cy.getBySel('column-type-select')
      .last()
      .within(() => {
        // cy.get('.antd5-select').click()
        cy.get('.antd5-select').type('Column Value')
      })

    cy.get('.antd5-select-dropdown')
      .not('.antd5-select-dropdown-hidden')
      .within(() => {
        cy.get('.antd5-select-item-option-active').contains('Column Value').first().click()
      })

    // select first column available
    cy.getBySel('value-output-field')
      .last()
      .within(() => {
        cy.get('.antd5-select').click()
      })

    // escape modal to click on dropdown content (selecting first column)
    cy.get('.antd5-select-item-option-content').last().click({ force: true })

    // check that form is valid (column values don't count as mismatch)
    cy.getBySel('add-computed-column-cta').should('not.be.disabled')
  })

  it('can reconcile when deleting dependent activities', () => {
    // open edit definition modal
    cy.getBySel('dataset-edit-definition-cta').click()

    // add an append/join activity
    cy.getBySel('append-activity-cta').click()
    cy.getBySel('activity-select').last().click()
    cy.getBySel('activity-select-option').last().click()
    cy.waitForSpinners()
    cy.getBySel('dataset-definition-submit').click()
    cy.waitForSpinners()

    // go to the added append/join activity and create a group from first column
    cy.getBySel('dataset-info-panel-activity-append').within(() => {
      cy.getBySel('column-row')
        .first()
        .invoke('text')
        .then((text) => {
          // set columnText to variable so
          // we can break out of within() and maintain text
          cy.wrap(text).as('reconcileColumnText')
          // click last column row inside of append
          cy.getBySel('column-row').last().click()
        })
    })

    // create a group from first append/join column
    cy.getBySel('column-multi-option-menu').contains('Group by').click()
    cy.getBySel('column-sub-option').contains('Only Column').click()
    cy.waitForSpinners()
    cy.url().should('contain', 'group=')

    // return to parent column
    cy.getBySel('parent-tab').click()
    cy.waitForSpinners()
    cy.url().should('not.contain', 'group=')

    // open edit definition modal
    cy.getBySel('dataset-edit-definition-cta').click()

    // delete the added append/join activity
    cy.getBySel('remove-append-activity').first().click()

    // click submit button
    cy.getBySel('dataset-definition-submit').click()
    cy.waitForSpinners()

    // accept the reconcilier changes
    cy.getBySel('reconciler-drawer-footer').get('button').contains('Apply').click()

    // go to recently created group
    cy.getBySel('group-tab').last().click()
    cy.waitForSpinners()
    cy.url().should('contain', 'group=')

    // check that text was saved to variable
    cy.get('@reconcileColumnText').should('have.length.above', 0)
    cy.get('@reconcileColumnText').then((columnText) => {
      // cypress thinks columnText is a JQuery object, but it is a string
      const text = columnText as unknown as string
      cy.getBySel('column-row').contains(text).should('not.exist')
    })
  })

  it('can add and remove an integration', () => {
    // click the integrations button
    cy.getBySel('dataset-manage-dropdown-target').click()
    cy.getBySel('integrations-dataset-option').click()

    // add integration
    cy.getBySel('add-integrations-cta').first().click()
    cy.getBySel('integrations-menu-option').first().click()

    // add name for integration
    cy.getBySel('integration-form-field-label-input').type('pretty new name')
    cy.getBySel('integration-save-cta').click()
    cy.waitForSpinners()

    // refresh the page
    cy.reload()
    cy.waitForSpinners()

    // check that integration is still there
    cy.getBySel('dataset-manage-dropdown-target').click()
    cy.getBySel('integrations-dataset-option').click()
    cy.getBySel('no-integrations-warning').should('not.exist')

    // delete the integration and save
    cy.getBySel('delete-integration-cta').click()
    cy.getBySel('confirm-delete-integration-cta').click()
    cy.getBySel('integration-save-cta').click()
    cy.waitForSpinners()

    // refresh the page
    cy.reload()
    cy.waitForSpinners()

    // check that integration is no longer there
    cy.getBySel('dataset-manage-dropdown-target').click()
    cy.getBySel('integrations-dataset-option').click()
    cy.getBySel('no-integrations-warning').should('exist')
  })

  // on success duplicate we open a new window with the duplicated dataset
  // cypress can't switch between tabs
  it.skip('can duplicate a dataset', () => {
    const DUPLICATE_DATASET_NAME = NEW_DATASET_NAME.replace('New', 'DUPE')

    // grab url
    cy.url().then((startingUrl) => {
      // click the duplicate button
      cy.getBySel('dataset-manage-dropdown-target').click()
      cy.getBySel('duplicate-dataset-option').click()

      // type and apply new name for new duplicated dataset
      cy.getBySel('copy-from-narrative-dataset-name-input').clear()
      cy.getBySel('copy-from-narrative-dataset-name-input').type(DUPLICATE_DATASET_NAME)
      cy.getBySel('confirm-duplicate-dataset').click()
      cy.waitForSpinners()

      // check that url is different
      cy.url().should('not.eq', startingUrl)

      // check that title is different
      cy.getBySel('dataset-title').should('not.contain.text', NEW_DATASET_NAME)
      cy.getBySel('dataset-title').should('contain.text', DUPLICATE_DATASET_NAME)

      // delete the duplicated dataset
      cy.getBySel('dataset-manage-dropdown-target').click()
      cy.getBySel('delete-dataset-option').click()
      cy.getBySel('confirm-delete-dataset').first().click()
      cy.waitForSpinners()
      cy.url().should('not.contain', '/datasets/edit')
      cy.url().should('contain', '/datasets')
    })
  })

  it('can create, rename, duplicate, and delete a group', () => {
    // check that the parent has SQL
    cy.getBySel('dataset-tab-sql-cta').click()
    // check that there is at least a 'SELECT' in sql
    cy.getBySel('basic-editor-wrapper').should('contain', 'SELECT')
    // check that url is update with view=sql param
    cy.url().should('contain', 'view=sql')
    // try to click on plots, but shouldn't work
    cy.getBySel('dataset-tab-plot-cta').click()
    cy.url().should('not.contain', 'view=plot')

    // create a group
    cy.getBySel('group-by-cta').click()
    cy.waitForSpinners()
    // FIXME: use selectors
    // getPopupContainer on popover solution causes content to enlarge
    cy.get('.antd5-popover-content').within(() => {
      cy.get('.antd5-select').first().click()
    })
    cy.getBySel('column-select-label-enabled').last().click()
    cy.getBySel('create-group-cta').click({ force: true })
    cy.url().should('contain', 'group=')
    // view params should be cleared (start on table view)
    cy.url().should('not.contain', 'view=')

    // check that group has SQL
    cy.getBySel('dataset-tab-sql-cta').click()
    // check that there is at least a 'SELECT' in sql
    cy.getBySel('basic-editor-wrapper').should('contain', 'SELECT')
    // check that url is update with view=sql param
    cy.url().should('contain', 'view=sql')

    // check that you can make a plot on group
    cy.getBySel('dataset-tab-plot-cta').click()
    cy.getBySel('edit-plots-modal').within(() => {
      cy.get('button').contains('Save').click()
    })

    // check that there is a plotter component
    cy.getBySel('dataset-plotter').should('exist')
    cy.url().should('contain', 'view=plot')

    // rename the group
    cy.getBySel('dataset-tab-menu').last().click()
    cy.getBySel('rename-group-option').click()
    cy.getBySel('rename-group-input').clear()
    cy.getBySel('rename-group-input').type('123 {enter}')
    cy.getBySel('group-tab').last().should('contain', '123')

    // duplicate the group
    // get this groups name to check if it was updated after duplicate
    cy.getBySel('group-tab')
      .last()
      .invoke('text')
      .then((groupName) => {
        cy.getBySel('dataset-tab-menu').last().click()
        cy.getBySel('duplicate-group-option').click()

        // check newly created tab through duplication
        cy.getBySel('group-tab').last().should('contain', `${groupName} 1`)
      })

    // delete group
    cy.getBySel('dataset-tab-menu').last().click()
    cy.getBySel('delete-group-option').click()
    cy.getBySel('delete-group-cta').click()

    // check that you are back on the parent tab
    cy.url().should('not.contain', 'group=')
    // check that you are in table view
    cy.url().should('not.contain', 'view=')
  })

  it('can create a group with no columns selected', () => {
    // open create new group popover
    cy.getBySel('group-by-cta').click()

    // don't add any columns - just click to create group
    cy.getBySel('create-group-cta').click()

    // make sure you are redirected to a group
    cy.url().should('contain', 'group=')
  })

  // First discovered in: https://app.shortcut.com/narrator/story/3926/if-you-run-a-tab-in-the-backgorund-the-new-columns-don-t-show-up
  it('can add a compute column, run it in the background, and show it in the table', () => {
    const COLUMN_NAME_TO_BE_PERSISTED = 'run in background'
    // wait until the parent dataset is done running
    cy.waitUntil(() => {
      return cy.getBySel('tab-headers-dataset-not-loading').should('have.length', 1)
    })

    // create a group
    // open create new group popover
    cy.getBySel('group-by-cta').click()
    cy.waitForSpinners()

    // don't add any columns - just click to create group
    cy.getBySel('create-group-cta').click()

    // make sure you are redirected to a group
    cy.url().should('contain', 'group=')

    // return to the parent
    cy.getBySel('parent-tab').click()
    cy.url().should('not.contain', 'group=')

    // add a compute column
    cy.getBySel('info-panel-computation').within(() => {
      // click the add computation column button
      cy.getBySel('add-button').click()
    })

    // add a computed column in the modal
    cy.getBySel('edit-computed-column-modal').within(() => {
      // first column is Time Add
      cy.getBySel('edit-computed-column-label').first().click()
      // add a name
      cy.getBySel('edit-computed-column-name').within(() => {
        cy.get('input').type(COLUMN_NAME_TO_BE_PERSISTED)
      })

      cy.getBySel('add-computed-column-cta').click()
    })

    // check that the column is in the sidebar
    cy.getBySel('info-panel-computation').within(() => {
      cy.getBySel('column-row').contains(COLUMN_NAME_TO_BE_PERSISTED).should('exist')
    })

    // hit run
    cy.getBySel('run-dataset-cta').click()
    // immediately switch to new group
    cy.getBySel('group-tab').last().click()
    cy.url().should('contain', 'group=')

    // check that parent dataset is still running
    cy.getBySel('tab-headers-dataset-loading').should('have.length', 1)

    // wait until the parent dataset is done running
    cy.waitUntil(() => {
      return cy.getBySel('tab-headers-dataset-not-loading').should('have.length', 1)
    })

    // return to parent tab and make sure the column is in the table header
    cy.getBySel('parent-tab').click()
    cy.getBySel('dataset-table-header-wrapper').within(() => {
      cy.getBySel('column-row').contains(COLUMN_NAME_TO_BE_PERSISTED).should('exist')
    })
  })

  it('can change and save column order', () => {
    // Drag first column to second column
    cy.getBySel('dataset-table-header-wrapper').within(() => {
      // get and set first column name
      cy.getBySel('column-row')
        .first()
        .invoke('text')
        .then((firstColumn) => {
          // set column name to variable so
          // we can break out of within() and maintain text
          cy.wrap(firstColumn).as('firstColumnName')
        })

      // get and set second column name
      cy.getBySel('column-row')
        .eq(1)
        .invoke('text')
        .then((secondColumn) => {
          // set column name to variable so
          // we can break out of within() and maintain text
          cy.wrap(secondColumn).as('secondColumnName')
        })

      // drag first column to right of the second column
      cy.getBySel('column-row')
        .eq(1)
        .then(($secondColumn) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: cypress drag and drop has bad types
          cy.getBySel('column-row').first().drag($secondColumn, { target: 'right' })
        })
    })

    // save the dataset and reload the page to make sure the order has been maintained
    cy.getBySel('dataset-manage-menu-ctas').first().click()
    cy.get('.antd5-notification-notice').should('contain', 'Saved successfully')
    cy.reload()
    cy.waitForSpinners()

    cy.getBySel('dataset-table-header-wrapper').within(() => {
      // check that the first column has text that was in the second column
      cy.getBySel('column-row')
        .first()
        .invoke('text')
        .then((newFirstColumn) => {
          cy.get('@secondColumnName').should('eq', newFirstColumn)
        })

      // check that the second column has text that was in the first column
      cy.getBySel('column-row')
        .eq(1)
        .invoke('text')
        .then((newSecondColumn) => {
          cy.get('@firstColumnName').should('eq', newSecondColumn)
        })
    })
  })

  // TODO: drag events causing error:
  // Uncaught Invariant Violation: Cannot call hover while not dragging.
  it.skip('can change column order and maintain it after switching tabs', () => {
    // create a group
    cy.getBySel('group-by-cta').click()
    cy.waitForSpinners()
    cy.getBySel('create-group-cta').parent().click()
    cy.waitForSpinners()
    cy.url().should('contain', 'group=')

    // go to parent tab
    cy.getBySel('parent-tab').click()
    cy.waitForSpinners()
    cy.url().should('not.contain', 'group=')

    // Drag first column to second column
    cy.getBySel('dataset-table-header-wrapper').within(() => {
      // get and set first column name
      cy.getBySel('column-row')
        .first()
        .invoke('text')
        .then((firstColumn) => {
          // set column name to variable so
          // we can break out of within() and maintain text
          cy.wrap(firstColumn).as('firstColumnName')
        })

      // get and set second column name
      cy.getBySel('column-row')
        .eq(1)
        .invoke('text')
        .then((secondColumn) => {
          // set column name to variable so
          // we can break out of within() and maintain text
          cy.wrap(secondColumn).as('secondColumnName')
        })

      // drag first column to right of the second column
      cy.getBySel('column-row')
        .eq(1)
        .then(($secondColumn) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: cypress drag and drop has bad types
          cy.getBySel('column-row').first().drag($secondColumn, { target: 'right' })
        })
    })

    // go to a group
    cy.getBySel('group-tab').last().click()
    cy.waitForSpinners()
    cy.url().should('contain', 'group=')

    // return to parent column
    cy.getBySel('parent-tab').click()
    cy.waitForSpinners()
    cy.url().should('not.contain', 'group=')

    // check that the drag and drop has persisted
    cy.getBySel('dataset-table-header-wrapper').within(() => {
      // check that the first column has text that was in the second column
      cy.getBySel('column-row')
        .first()
        .invoke('text')
        .then((newFirstColumn) => {
          cy.get('@secondColumnName').should('eq', newFirstColumn)
        })

      // check that the second column has text that was in the first column
      cy.getBySel('column-row')
        .eq(1)
        .invoke('text')
        .then((newSecondColumn) => {
          cy.get('@firstColumnName').should('eq', newSecondColumn)
        })
    })
  })

  // originally discovered in: https://app.shortcut.com/narrator/story/3911/order-is-lost-when-you-duplicate-a-dataset
  // TODO: drag events causing error:
  // Uncaught Invariant Violation: Cannot call hover while not dragging.
  it.skip('can change column order and maintain it after switching tabs to duplicate parent', () => {
    // create a duplicate parent group
    cy.getBySel('dataset-tab-menu').first().click()
    cy.getBySel('duplicate-parent-option').click()

    // run the query
    cy.getBySel('run-dataset-cta').click()
    cy.waitForSpinners()

    // Drag first column to second column
    cy.getBySel('dataset-table-header-wrapper').within(() => {
      // get and set first column name
      cy.getBySel('column-row')
        .first()
        .invoke('text')
        .then((firstColumn) => {
          // set column name to variable so
          // we can break out of within() and maintain text
          cy.wrap(firstColumn).as('firstColumnName')
        })

      // get and set second column name
      cy.getBySel('column-row')
        .eq(1)
        .invoke('text')
        .then((secondColumn) => {
          // set column name to variable so
          // we can break out of within() and maintain text
          cy.wrap(secondColumn).as('secondColumnName')
        })

      // drag first column to right of the second column
      cy.getBySel('column-row')
        .eq(1)
        .then(($secondColumn) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: cypress drag and drop has bad types
          cy.getBySel('column-row').first().drag($secondColumn, { target: 'right' })
        })
    })

    // go back to the parent tab
    // return to parent column
    cy.getBySel('parent-tab').click()
    cy.waitForSpinners()
    cy.url().should('not.contain', 'group=')

    // Drag first column to second column
    cy.getBySel('dataset-table-header-wrapper').within(() => {
      // get and set first column name
      cy.getBySel('column-row')
        .first()
        .invoke('text')
        .then((firstParentColumn) => {
          // set column name to variable so
          // we can break out of within() and maintain text
          cy.wrap(firstParentColumn).as('firstParentColumnName')
        })

      // get and set second column name
      cy.getBySel('column-row')
        .eq(1)
        .invoke('text')
        .then((secondParentColumn) => {
          // set column name to variable so
          // we can break out of within() and maintain text
          cy.wrap(secondParentColumn).as('secondParentColumnName')
        })

      // drag first column to right of the second column
      cy.getBySel('column-row')
        .eq(1)
        .then(($secondParentColumn) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: cypress drag and drop has bad types
          cy.getBySel('column-row').first().drag($secondParentColumn, { target: 'right' })
        })
    })

    // save the dataset and refresh
    cy.getBySel('save-dataset-cta').click()
    cy.reload()
    cy.waitForSpinners()
    cy.waitUntil(() => {
      return cy.getBySel('run-dataset-cta').contains('Cancel').should('have.length', 0)
    })

    // check that the parent tab order was maintained
    cy.getBySel('dataset-table-header-wrapper').within(() => {
      // check that the first column has text that was in the second column
      cy.getBySel('column-row')
        .first()
        .invoke('text')
        .then((newFirstColumn) => {
          cy.get('@secondParentColumnName').should('eq', newFirstColumn)
        })

      // check that the second column has text that was in the first column
      cy.getBySel('column-row')
        .eq(1)
        .invoke('text')
        .then((newSecondColumn) => {
          cy.get('@firstParentColumnName').should('eq', newSecondColumn)
        })
    })

    // go back to the duplcate tab and make sure that order is also maintained
    cy.getBySel('group-tab-parent-duplicate').first().click()
    // run the query
    cy.getBySel('run-dataset-cta').click()
    cy.waitForSpinners()

    cy.getBySel('dataset-table-header-wrapper').within(() => {
      // check that the first column has text that was in the second column
      cy.getBySel('column-row')
        .first()
        .invoke('text')
        .then((newFirstColumn) => {
          cy.get('@secondColumnName').should('eq', newFirstColumn)
        })

      // check that the second column has text that was in the first column
      cy.getBySel('column-row')
        .eq(1)
        .invoke('text')
        .then((newSecondColumn) => {
          cy.get('@firstColumnName').should('eq', newSecondColumn)
        })
    })
  })

  it('can hide/show columns in duplicate parent group', () => {
    // create duplicate parent tab
    cy.getBySel('dataset-tab-menu').first().click()
    cy.getBySel('duplicate-parent-option').click()

    // run the query
    cy.getBySel('run-dataset-cta').click()
    cy.waitForSpinners()

    // open hide/show column modal
    cy.getBySel('hide-show-duplicate-parent-columns-button').click()

    // hide a column
    cy.getBySel('hide-show-duplicate-parent-columns-container').within(() => {
      cy.getBySel('hide-show-duplicate-parent-columns-toggle').should('contain', 'Hide')

      cy.getBySel('column-select').click()
    })

    cy.getBySel('column-select-label-enabled')
      .first()
      .invoke('text')
      .then((text) => {
        cy.wrap(text).as('hiddenColumnName')
      })

    // select first available column
    cy.getBySel('column-select-label-enabled').first().click()

    // click on the header of the modal to close the dropdown (otherwise it covers the "Apply" button)
    cy.get('.antd5-popover-title').first().click({ force: true })
    cy.getBySel('hide-show-duplicate-parent-columns-apply-cta').click({ force: true })

    // run the dataset
    cy.getBySel('run-dataset-cta').click()
    cy.waitForSpinners()

    // check that the column doesn't exist in the dataset table
    cy.getBySel('dataset-table-header-wrapper').within(() => {
      cy.get('@hiddenColumnName').then((hiddenName) => {
        cy.getBySel('column-row').contains(hiddenName.toString()).should('not.exist')
      })
    })

    // open hide/show column modal
    cy.getBySel('hide-show-duplicate-parent-columns-button').click()

    cy.getBySel('hide-show-duplicate-parent-columns-container').within(() => {
      // remove hidden column
      cy.getBySel('column-select').click()
    })
    cy.get('.antd5-select-item-option-selected').first().click()

    // click on the header of the modal to close the dropdown (otherwise it covers the "Apply" button)
    cy.get('.antd5-popover-title').first().click()

    // switch to show mode
    cy.getBySel('hide-show-duplicate-parent-columns-toggle').should('contain', 'Hide')
    cy.getBySel('hide-show-duplicate-parent-columns-toggle').click()
    cy.getBySel('hide-show-duplicate-parent-columns-toggle').should('contain', 'Show')

    // select a column
    cy.getBySel('hide-show-duplicate-parent-columns-container').within(() => {
      // remove hidden column
      cy.getBySel('column-select').click()
    })
    cy.getBySel('column-select-label-enabled').first().click()

    // click on the header of the modal to close the dropdown (otherwise it covers the "Apply" button)
    cy.get('.antd5-popover-title').first().click()
    cy.getBySel('hide-show-duplicate-parent-columns-apply-cta').click()

    // run the dataset
    cy.getBySel('run-dataset-cta').click()
    cy.waitForSpinners()

    // check that only that column exists in the dataset table
    cy.getBySel('dataset-table-header-wrapper').within(() => {
      cy.getBySel('column-row').should('have.length', 1)

      cy.get('@hiddenColumnName').then((hiddenName) => {
        cy.getBySel('column-row').contains(hiddenName.toString()).should('exist')
      })
    })
  })

  it('can use quick reorder columns overlay to reorder columns', () => {
    cy.getBySel('dataset-table-header-wrapper').within(() => {
      // get and set first column name
      cy.getBySel('column-row')
        .first()
        .invoke('text')
        .then((firstParentColumn) => {
          // set column name to variable so
          // we can break out of within() and maintain text
          cy.wrap(firstParentColumn).as('firstColumnName')
        })

      // get and set second column name
      cy.getBySel('column-row')
        .eq(1)
        .invoke('text')
        .then((secondParentColumn) => {
          // set column name to variable so
          // we can break out of within() and maintain text
          cy.wrap(secondParentColumn).as('secondColumnName')
        })
    })

    // open quick reorder columns overlay
    cy.getBySel('dataset-tab-menu').first().click()
    cy.getBySel('quick-reorder-columns-option').click()

    // move first column down to second column
    cy.getBySel('quick-reorder-columns-content').within(() => {
      cy.getBySel('quick-reorder-columns-item')
        .eq(1)
        .then(($secondColumn) => {
          cy.getBySel('quick-reorder-columns-item')
            .first()
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: cypress drag and drop has bad types
            .drag($secondColumn, { target: { position: 'bottom' } })
        })
    })

    // accept changes and close modal
    cy.getBySel('quick-reorder-columns-cta').click()

    // save changes
    cy.getBySel('save-dataset-cta').click()
    cy.waitForSpinners()

    // reload the page
    cy.reload()

    cy.getBySel('dataset-table-header-wrapper').within(() => {
      // check that the first column now has the second column name
      cy.getBySel('column-row')
        .first()
        .invoke('text')
        .then((newFirstColumn) => {
          cy.get('@secondColumnName').should('eq', newFirstColumn)
        })

      // check that the second column now has the first column name
      cy.getBySel('column-row')
        .eq(1)
        .invoke('text')
        .then((newSecondColumn) => {
          cy.get('@firstColumnName').should('eq', newSecondColumn)
        })
    })
  })

  const checkBetweenAppendRelationships = (cohortOccurrence: string) => {
    // open edit definition modal
    cy.getBySel('dataset-edit-definition-cta').click()

    // make sure the cohort filter is cohortOccurrence
    cy.getBySel('cohort-occurrence-filter').click()
    cy.get('.antd5-select-item').contains(cohortOccurrence).click()
    cy.waitForSpinners()

    // add an append/join activity
    cy.getBySel('append-activity-cta').click()

    // check that the append/join relationship options don't include "in_between"
    cy.getBySel('append-relationship-select').last().click()
    cy.get('.antd5-select-item').contains('First In Between').should('not.exist')
    cy.get('.antd5-select-item').contains('Last In Between').should('not.exist')
    cy.get('.antd5-select-item').contains('Aggregate In Between').should('not.exist')

    // change the cohort filter to all
    cy.getBySel('cohort-occurrence-filter').click()
    cy.get('.antd5-select-item').contains('All').click()

    // check that the append/join relationship options include "in_between"
    cy.getBySel('append-relationship-select').last().click()
    cy.get('.antd5-select-item').contains('First In Between').should('exist')
    cy.get('.antd5-select-item').contains('Last In Between').should('exist')
    cy.get('.antd5-select-item').contains('Aggregate In Between').should('exist')

    // select "First In Between"
    cy.get('.antd5-select-item').contains('First In Between').click()

    // change cohort filter to cohortOccurrence again
    cy.getBySel('cohort-occurrence-filter').click()
    cy.get('.antd5-select-item').contains(cohortOccurrence).click()
    cy.waitForSpinners()

    // check that the append/join relationshp has been changed to "First After"
    cy.getBySel('append-relationship-select').last().should('contain', 'First After')

    // close the modal for the next relationshp check
    cy.getBySel('cancel-edit-definition-changes').click()
    cy.waitForSpinners()
  }

  it('can limit between append relationships for first, last, and nth cohort occurrences in edit definition', () => {
    checkBetweenAppendRelationships('First')
    checkBetweenAppendRelationships('Last')
    checkBetweenAppendRelationships('Nth')
  })
})

describe('Edit Dataset - Company User', () => {
  const NEW_DATASET_NAME = `New Cypress Dataset - ${Date.now()}`
  before(() => {
    // login and create a dataset to edit
    cy.login({ role: 'company_user', company: 'narratorclient' })
    cy.visit('narratorclient/datasets')

    createNewDataset(NEW_DATASET_NAME)
  })

  beforeEach(() => {
    cy.login({ role: 'company_user', company: 'narratorclient' })
    cy.visit('narratorclient/datasets')
    cy.waitForSpinners()

    // find test dataset
    getNewDataset(NEW_DATASET_NAME)

    // navigate to the dataset
    cy.getBySel('dataset-index-name-link').first().click()
    cy.url().should('contain', '/datasets/edit/new_cypress_dataset')
  })

  after(() => {
    // Reset auth state
    cy.login({ role: 'company_user', company: 'narratorclient' })
    cy.visit('narratorclient/datasets')

    // find test dataset
    getNewDataset(NEW_DATASET_NAME)

    // delete it
    deleteDataset()
  })

  it('can only add a gsheet or csv integration', () => {
    // open integrations modal
    cy.getBySel('dataset-manage-dropdown-target').click()
    cy.getBySel('integrations-dataset-option').click()

    // open integration options
    cy.getBySel('add-integrations-cta').first().click({ force: true })
    // check that only gsheet and csv are non-disabled options
    cy.getBySel('integrations-menu-option').should('have.length', 2)
    cy.getBySel('integrations-menu-option').contains('Google Sheet').should('not.be.disabled')
    cy.getBySel('integrations-menu-option').contains('Email CSV').should('not.be.disabled')
  })

  it.skip('user can not update integration that they do not have access to', () => {
    // const INTEGRATION_DATASET_NAME = 'DO NOT DELETE - INTEGRATIONS TEST'
    cy.visit('narratorclient/datasets/edit/do_not_delete_integrations_testfeb2f831')
    cy.waitForSpinners()

    // open integrations modal
    cy.getBySel('dataset-manage-dropdown-target').click()
    cy.getBySel('integrations-dataset-option').click()

    // check that the user cannot delete the first integration created by admin
    cy.getBySel('delete-integration-cta').first().should('be.disabled')

    // Currently the below will fail b/c mavis-server does not allow
    // a non-admin user to save integrations that have non gsheet/csv integrations
    // (i.e. a admin added a non gsheet/csv and now the reg user cannot update)

    // add a csv integration
    cy.getBySel('add-integrations-cta').first().click({ force: true })
    cy.getBySel('integrations-menu-option').contains('Email CSV').click()
    cy.getBySel('integration-form-field-label-input').last().type('csv integration')

    // save new integration
    cy.getBySel('integration-save-cta').click()
    cy.waitForSpinners()

    // reopen the integrations modal
    cy.getBySel('dataset-manage-dropdown-target').click()
    cy.getBySel('integrations-dataset-option').click()

    // check that the admin integration is still there
    cy.getBySel('delete-integration-cta').first().should('be.disabled')

    // check that the user can delete the integration they created (and delete)
    cy.getBySel('delete-integration-cta').last().should('not.be.disabled')
    cy.getBySel('delete-integration-cta').last().click()
    // FIXME: confirmation is not removing in test, but is locally
    cy.getBySel('confirm-delete-integration-cta').click()

    // make sure that the integration is deleted
    cy.getBySel('integration-form-field').should('have.length', 1)

    // save the integration (only admin integration is left)
    cy.getBySel('integration-save-cta').click()
    cy.waitForSpinners()

    // reopen the integrations modal
    cy.getBySel('dataset-manage-dropdown-target').click()
    cy.getBySel('integrations-dataset-option').click()

    // check that only the admin integration is left
    cy.getBySel('integration-form-field').should('have.length', 1)
    cy.getBySel('delete-integration-cta').first().should('be.disabled')
  })
})
