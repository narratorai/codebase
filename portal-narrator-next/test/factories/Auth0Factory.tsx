import { makeFactory } from 'factory.ts'

export default makeFactory({
  isAuthenticated: true,
  authCompany: '',
  getTokenSilently: () => Promise.resolve(''),
  logout: () => Promise.resolve(''),

  // TODO: add these attrs
  // user
})
