/* eslint-env jest */

// DOMPurify does not like being run in jsdom / node, so we mock it in tests as an identity function

const mock = jest.createMockFromModule('dompurify')
mock.sanitize = jest.fn().mockImplementation((str) => str)

export default mock
