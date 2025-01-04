// import '@cypress/code-coverage/support'
import './commands'

// https://github.com/cypress-io/cypress/issues/8418#issuecomment-681648392
const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/

Cypress.on('uncaught:exception', (err) => {
  // returning false here prevents Cypress from
  // failing the test
  if (resizeObserverLoopErrRe.test(err.message)) {
    return false
  }

  // when the exception originated from an unhandled promise
  // rejection, the promise is provided as a third argument
  // you can turn off failing the test in this case
  // if (promise) {
  //   // returning false here prevents Cypress from
  //   // failing the test
  //   return false
  // }

  return true
})
