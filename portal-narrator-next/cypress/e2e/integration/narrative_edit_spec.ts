const DATASET_NAME_FOR_TESTING_V2 = 'DO NOT DELETE - TESTING NARRATIVE V2'
const DATASET_NAME_FOR_TESTING_V2_METRIC = 'DO NOT DELETE - TESTING NARRATIVE V2 METRIC'
const DATASET_NAME_FOR_TESTING_V3_TABLE = 'DO NOT DELETE - TESTING NARRATIVE V3 TABLE'

describe('Edit Narrative - Company Admin', () => {
  const NEW_NARRATIVE_NAME = `New Cypress Narrative Testing - ${Date.now()}`

  before(() => {
    // Log in and create a new narrative
    cy.login({
      role: 'company_admin',
      company: 'narratorclient',
    })
    cy.visit('narratorclient/narratives')

    // click create new narrative
    cy.getBySel('create-narrative-cta').first().click()
    cy.getBySel('narrative-from-scratch-option').click()

    // check that you are directed to /new url
    cy.url().should('contain', '/narratives/new')

    // wait for the add goal button to show (we know the page has fully loaded at that point)
    cy.getBySel('add-goal-button').should('have.have.length', 1)

    // click save button to open the overlay
    cy.getBySel('narrative-save-cta').click()
    cy.waitForSpinners()

    // add new name
    cy.getBySel('save-narrative-overlay').within(() => {
      cy.getBySel('save-overlay-name-input').type(NEW_NARRATIVE_NAME)
      cy.getBySel('create-new-narrative-button').click()
    })

    cy.waitForSpinners()
    cy.url().should('contain', '/narratives/edit/new_cypress_narrative_testing')
  })

  const deleteNarrative = () => {
    cy.getBySel('narrative-item-options').first().click()
    cy.getBySel('delete-narrative-menu-item').first().click()
    cy.getBySel('confirm-delete-narrative').first().click()
  }

  after(() => {
    // Reset auth state
    cy.login({
      role: 'company_admin',
      company: 'narratorclient',
    })
    cy.visit('narratorclient/narratives')

    // search for the narrative
    cy.getBySel('search-narratives-filter-icon').click()
    cy.getBySel('search-narratives-dropdown').within(() => {
      cy.get('input').type(NEW_NARRATIVE_NAME)
      cy.get('button').contains('Search').click()
    })

    // there should only be one match for the narrative
    cy.get('.antd5-table-row').should('have.length', 1)
    cy.waitForSpinners()

    // delete the narrative (do this after checking that there is only one match)
    deleteNarrative()
  })

  beforeEach(() => {
    // reset auth state and go to narratives index
    cy.login({
      role: 'company_admin',
      company: 'narratorclient',
    })
    cy.visit('narratorclient/narratives')

    // find test narrative
    cy.getBySel('resource-search-select').type(`${NEW_NARRATIVE_NAME}{enter}`)
    cy.waitForSpinners()

    // confirm you are on the narrative created for these tests
    cy.url().should('contain', '/narratives/edit/new_cypress_narrative_testing')

    // close the loading modal to allow for click events
    cy.getBySel('narrative-assembling-modal').within(() => {
      cy.get('.antd5-modal-close-x').click()
    })
  })

  const deleteLastBasicContentSection = () => {
    cy.getBySel('icon-actions')
      .last()
      .within(() => {
        cy.get('.antd5-dropdown-trigger').last().trigger('mouseover')
      })

    cy.getBySel('delete-content-item').last().parent().click()
    // confirm delete
    cy.getBySel('confirm-delete-section-content-cta').click()
  }

  const addMetric = () => {
    // add basic metric
    cy.getBySel('add-menu-cta').last().click()
    cy.getBySel('add-menu-item').contains('Metric').click()

    // check that metric was added
    cy.getBySel('basic-content').contains('Metric').should('have.length', 1)

    // select a dataset (that contains a metric)
    cy.getBySel('resource-search-select').last().click()
    cy.getBySel('resource-search-select').last().type(DATASET_NAME_FOR_TESTING_V2_METRIC)
    cy.get('.antd5-select-item-option-content').contains(DATASET_NAME_FOR_TESTING_V2_METRIC).click()

    // wait for group options to be returned
    cy.waitForSpinners()

    // select available group
    cy.getBySel('metric-content-group-select').click()
    // select last b/c cypress still sees the selected dataset above
    cy.get('.antd5-select-item-option').last().click()
    // wait for metric options
    cy.waitForSpinners()

    // select available metric
    cy.getBySel('metric-content-metric-select').click()
    // select last b/c cypress still sees the selected group above
    cy.get('.antd5-select-item-option').last().click()

    // wait for content to compile
    cy.waitForSpinners()
    cy.getBySel('metric-graphic').should('have.length', 1)
  }

  const addTable = () => {
    cy.getBySel('add-menu-cta').last().click()
    cy.getBySel('add-menu-item').contains('Table').click()

    // check that table was added
    cy.getBySel('basic-content').contains('Table').should('have.length', 1)

    // select a dataset (that contains a group)
    cy.getBySel('resource-search-select').last().type(`${DATASET_NAME_FOR_TESTING_V3_TABLE}{enter}`)
    // cy.get('.antd5-select-item-option-content').contains(DATASET_NAME_FOR_TESTING_V3_TABLE).click()
    // wait for group options to be returned
    cy.waitForSpinners()

    // limit the rows before selecting group so it doesn't take forever
    cy.getBySel('limit-table-rows-text').last().click()
    cy.getBySel('table-content-limit-rows-input').last().type('10')

    // select available group
    cy.getBySel('table-content-group-select').click()
    // select last b/c cypress still sees the selected dataset above
    cy.get('.antd5-select-item-option').last().click()
    // wait for table content (defaults to markdown form)

    cy.waitUntil(() => {
      return cy.getBySel('table-content-markdown-preview', { timeout: 40000 }).should('exist')
    })

    // check that markdown version is visible in preview
    cy.getBySel('table-content-markdown-preview').should('have.length', 1)
  }

  const addPlot = () => {
    // add basic plot
    cy.getBySel('add-menu-cta').last().click()
    cy.getBySel('add-menu-item').contains('Plot').click()

    cy.waitForSpinners(4)

    // check that plot was added
    cy.getBySel('basic-content').contains('Plot').should('have.length', 1)

    // select a dataset (that contains a plot)
    cy.getBySel('resource-search-select').last().click()
    cy.getBySel('resource-search-select').last().type(DATASET_NAME_FOR_TESTING_V2)
    cy.get('.antd5-select-item-option').contains(DATASET_NAME_FOR_TESTING_V2).click()
    // wait for plot options to be returned
    cy.waitForSpinners()

    // select first plot
    cy.getBySel('plot-content-plot-select').first().click()
    // select last b/c cypress still sees the selected dataset above
    cy.get('.antd5-select-item-option').last().click()

    // wait for content to compile
    cy.waitForSpinners(6)
    cy.getBySel('plot-content-preview').should('have.length', 1)
  }

  it('can create a section and remove a section if there are more than one', () => {
    // click Add Section cta
    cy.getBySel('narrative-add-section-cta').click()
    cy.getBySel('narrative-section-content').should('have.length.above', 1)

    // remove the section
    cy.getBySel('section-options-container')
      .first()
      .within(() => {
        cy.get('button').click()
      })

    cy.getBySel('section-option-delete').click()

    cy.get('.antd5-popover-content')
      .first()
      .within(() => {
        cy.get('button').contains('OK').click()
      })

    // check that it was deleted
    cy.getBySel('narrative-section-content').should('have.length', 1)

    // try to delete again, but you shouldn't be able to
    cy.getBySel('section-options-container')
      .first()
      .within(() => {
        cy.get('button').click()
      })

    cy.getBySel('section-option-delete').parentsUntil('.antd5-dropdown-menu-item-disabled').should('exist')
  })

  it('can add and delete question and goal, recommendations and takeaways', () => {
    const QUESTION = 'question'
    const GOAL = 'goal'
    const TITLE = 'Recommendation Title'
    const EXPLANATION = 'Recommendation Explanation'

    const addQuestionAndGoal = () => {
      // add markdown to the question
      cy.getBySel('narrative-section-question').within(() => {
        cy.getBySel('basic-editor-wrapper').click()
        cy.getBySel('basic-editor-wrapper').type(QUESTION)
      })

      // check that question was added to preview
      cy.getBySel('narrative-question-preview').should('contain', QUESTION)
      // check that no question goal UI is no longer visible
      cy.getBySel('narrative-no-question-goal').should('have.length', 0)

      // add markdown to the goal
      cy.getBySel('narrative-section-goal').within(() => {
        cy.getBySel('basic-editor-wrapper').click()
        cy.getBySel('basic-editor-wrapper').type(GOAL)
      })
      cy.getBySel('narrative-goal-preview').should('contain', GOAL)
    }

    const removeQuestionAndGoal = () => {
      // click delete question and goal button
      cy.getBySel('delete-question-goal-button').click()
      // confirm delete
      cy.get('.antd5-popover-content').within(() => {
        cy.get('button').contains('OK').parent().click()
      })

      // check that the question and goal are no longer visible
      cy.getBySel('narrative-question-preview').should('have.length', 0)
      // check that no question goal UI is now visible
      cy.getBySel('narrative-no-question-goal').should('have.length', 1)
    }

    const addRecommendationAndTakeaways = () => {
      cy.getBySel('narrative-recommendation-title').click()
      cy.getBySel('narrative-recommendation-title').type(TITLE)
      cy.getBySel('narrative-recommendation-title-preview').should('contain', TITLE)

      cy.getBySel('narrative-recommendation-explanation').click()
      cy.getBySel('narrative-recommendation-explanation').type(EXPLANATION)
      cy.getBySel('narrative-recommendation-explanation-preview').should('contain', EXPLANATION)
    }

    const removeRecommendationAndTakeaways = () => {
      // click delete recommendation and takeaway button
      cy.getBySel('delete-recommendation-takeaway-button').click()
      // confirm delete
      cy.getBySel('confirm-delete-recommendation-takeaway-button').click()

      // check that title is no longer visible
      cy.getBySel('narrative-recommendation-title-preview').should('have.length', 0)
      // check explanation is no longer visible

      cy.getBySel('narrative-recommendation-explanation-preview').should('have.length', 0)
    }

    // check that question and goal are not default visible
    cy.getBySel('narrative-section-question').should('have.length', 0)

    // add question and goal
    cy.getBySel('add-goal-button').click()

    // add question and goal button should no longer be visible
    cy.getBySel('add-goal-button').should('have.length', 0)

    // check that no question goal UI is visible
    cy.getBySel('narrative-no-question-goal').should('have.length', 1)
    // check that there is markdown to edit question
    cy.getBySel('narrative-section-question').should('have.length', 1)

    addQuestionAndGoal()
    addRecommendationAndTakeaways()
    removeQuestionAndGoal()
    // check that add goal button is still not visible
    // (it is only visible if both goal and recs are removed)
    cy.getBySel('add-goal-button').should('have.length', 0)
    removeRecommendationAndTakeaways()
    // check that add goal button is now available
    cy.getBySel('add-goal-button').should('have.length', 1)
  })

  it('can add and delete metric content', () => {
    addMetric()

    // get the value of the metric
    cy.getBySel('metric-graphic-value')
      .invoke('text')
      .then((originalValue) => {
        // update the filter and make sure that the value has changed
        cy.getBySel('metric-content-filter-select').click()
        // select last b/c ant still sees the selected metric above
        cy.get('.antd5-select-item-option').last().click()

        cy.waitForSpinners()

        // check that the value was updated by changing the filter
        cy.getBySel('metric-graphic-value').should('not.contain', originalValue)
      })

    // get the value of the title
    cy.getBySel('metric-graphic-title')
      .invoke('text')
      .then((originalTitle) => {
        cy.get('.antd5-collapse-header-text').contains('Advanced Editing').first().click()

        cy.getBySel('metric-content-rename-input').type('Brand new title')

        // wait for the metric content to compile
        cy.waitForSpinners()

        // check that the title has been updated
        cy.getBySel('metric-graphic-title').should('not.contain', originalTitle)
      })

    // delete the metric
    deleteLastBasicContentSection()

    // check that the metric was deleted
    cy.getBySel('basic-content').should('have.length', 0)
  })

  it('can add and delete plot content', () => {
    // add basic plot
    addPlot()

    // delete the plot
    deleteLastBasicContentSection()

    // check that the plot was deleted
    cy.getBySel('basic-content').should('have.length', 0)
  })

  it('can add and delete table content', () => {
    // add basic table
    addTable()
    cy.waitForSpinners()

    // change type to data table
    cy.getBySel('table-content-use-data-table-checkbox').click()

    // check that the table is now visible and the markdown is gone
    cy.getBySel('table-content-table-preview').should('have.length', 1)
    cy.getBySel('table-content-markdown-preview').should('have.length', 0)

    // change the title
    cy.get('.antd5-collapse').contains('Title').first().click()

    const NEW_TITLE_NAME = 'This is a brand new title and there is no way this is the default; 99% sure of that'
    cy.getBySel('table-content-title-input').type(NEW_TITLE_NAME)
    cy.waitForSpinners()

    // check that the title has changed
    cy.getBySel('table-content-table-preview').should('contain', NEW_TITLE_NAME)

    // delete the table
    deleteLastBasicContentSection()

    // check that the table was deleted
    cy.getBySel('basic-content').should('have.length', 0)
  })

  it('can create markdown content', () => {
    const MARKDOWN_TEXT = 'Look at this markdown'

    // add markdown
    cy.getBySel('add-menu-cta').last().click()
    cy.getBySel('add-menu-item').contains('Markdown').click()
    cy.waitForSpinners()

    // write in the editor
    cy.getBySel('mardown-content')
      .last()
      .within(() => {
        cy.getBySel('basic-editor-wrapper').click()
        cy.getBySel('basic-editor-wrapper').type(MARKDOWN_TEXT)
      })
    cy.waitForSpinners()

    // check that markdown is visible in the preview
    cy.getBySel('content-box').last().should('contain', MARKDOWN_TEXT)

    // delete the markdown
    deleteLastBasicContentSection()

    // check that the table was deleted
    cy.getBySel('basic-content').should('have.length', 0)
  })

  it('can add and delete a section conclusion', () => {
    const CONCLUSION_TEXT = 'This is a section conclusion'

    // click add section conclusion button
    cy.getBySel('add-section-conclusion-button').click()

    // add section conclusion
    cy.getBySel('narrative-section-takeaway').within(() => {
      cy.getBySel('basic-editor-wrapper').click()
      cy.getBySel('basic-editor-wrapper').type(CONCLUSION_TEXT)
    })

    // check that conclusion is visible in the preview
    cy.getBySel('section-conclusion-takweaway').should('contain', CONCLUSION_TEXT)

    // delete the section conclusion
    cy.getBySel('delete-section-conclusion-button').click()

    // check that the section conclusion preview is no longer visible
    cy.getBySel('section-conclusion-takweaway').should('have.length', 0)
  })

  it('can move content up', () => {
    // add metric, then the table
    addMetric()
    addTable()

    // move table up
    cy.getBySel('icon-actions')
      .last()
      .within(() => {
        cy.getBySel('move-content-up-button').parent().parent().click()
      })

    // metric should now be last basic content
    cy.getBySel('basic-content').last().contains('Metric').should('have.length', 1)
    cy.getBySel('basic-content').last().contains('Table').should('have.length', 0)

    // delete the metric and table
    deleteLastBasicContentSection()
    deleteLastBasicContentSection()

    // check that all basic content was removed
    cy.getBySel('basic-content').should('have.length', 0)
  })

  it('can add a plot, assemble, and go to the dataset associated with the plot with correct params', () => {
    // add basic plot
    addPlot()
    cy.waitForSpinners(4)

    // check that plot in edit preview does not have upload_key and narrative_slug params
    cy.getBySel('link-to-dataset')
      .first()
      .should('have.attr', 'href')
      .and('not.include', 'upload_key=')
      .and('not.include', 'narrative_slug=')

    // click assemble button
    cy.getBySel('narrative-assemble-cta').click()
    cy.waitForSpinners()

    // click the View Narrative button
    cy.getBySel('view-assembled-narrative-link').parent().invoke('removeAttr', 'target')
    cy.getBySel('view-assembled-narrative-link').click()
    cy.waitForSpinners()

    // make sure that you are on the assembled narrative view
    cy.url().should('contain', '/narratives/a/new_cypress_narrative_testing')

    // check that plot in assembled view does have upload_key and narrative_slug params
    cy.getBySel('link-to-dataset')
      .first()
      .should('have.attr', 'href')
      .and('include', 'upload_key=')
      .and('include', 'narrative_slug=')

    // click the dataset link
    cy.getBySel('link-to-dataset').first().invoke('removeAttr', 'target').click()
    cy.waitForSpinners()

    // check that you are on edit dataset with the correct query params
    cy.url().should('contain', '/datasets/edit')
    cy.url().should('contain', 'upload_key=')
    cy.url().should('contain', 'narrative_slug=')

    // check that you can't save the dataset
    cy.getBySel('save-dataset-cta').should('be.disabled')
    cy.getBySel('dataset-manage-dropdown-target').click()
    cy.getBySel('edit-properties-dataset-option')
      .parent()
      .parent()
      .should('have.class', 'antd5-dropdown-menu-item-disabled')
  })

  it.skip('changing a metric dataset, removes the group', () => {
    // TODO
  })
  it.skip('changing a metric group, removes the metric', () => {
    // TODO
  })
  it.skip('changing a table dataset, removes the group', () => {
    // TODO
  })
  it.skip('changing a plot dataset, removes the plot', () => {
    // TODO
  })
})
