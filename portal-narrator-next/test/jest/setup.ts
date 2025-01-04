/* eslint-env jest */

/* eslint-disable @typescript-eslint/ban-ts-comment */

// testing-library assertions https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// mocks
import 'jest-canvas-mock'
import { server } from '../mockServer'
import { enableFetchMocks } from 'jest-fetch-mock'
import 'jest-styled-components'

// Needed for monaco / the-sequel
document.queryCommandSupported = jest.fn().mockReturnValue(false)

// helps pino out in jsdom test env
// @ts-ignore
global.setImmediate = jest.useRealTimers

// Needed for monaco / the-sequel
// From https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: '',
    pathname: '/',
    search: '',
    hash: '',
  },
})

enableFetchMocks()

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
