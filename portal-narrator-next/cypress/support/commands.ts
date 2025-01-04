import 'cypress-wait-until'
import '@4tw/cypress-drag-drop'
import './auth0'

/**
 * Select an element from the DOM using a data-test attribute
 */
Cypress.Commands.add('getBySel', (selector, ...args) => {
  if (Array.isArray(selector)) {
    const chain = []
    for (let i = 0; i < selector.length - 1; i++) {
      chain.push(`[data-test=${selector[i]}]`)
    }

    return cy.get(chain.join(' '), ...args)
  }

  return cy.get(`[data-test=${selector}]`, ...args)
})

/**
 * Wait for loading state to end via all spinners dissapearing
 */
Cypress.Commands.add('waitForSpinners', (times?: number) => {
  const wait = () =>
    cy.waitUntil(
      () => {
        const $spinners = Cypress.$('.antd5-spin')
        return !$spinners || !$spinners.length
      },
      {
        description: 'waitForSpinners',
        timeout: 20000,
      }
    )

  // wait n times to catch flicker on page load (defaults to 3)
  Cypress._.times(times || 3, () => wait())

  // return [...Array(times || 2)].reduce<Cypress.Chainable<undefined>>((memo) => {
  //   return memo.then(() => wait())
  // }, Promise.resolve() as unknown as Cypress.Chainable<undefined>)
})
