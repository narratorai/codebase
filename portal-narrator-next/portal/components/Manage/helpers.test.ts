import { handleParseCsvEmails } from 'components/Manage/helpers'

describe('#handleParseCsvEmails', () => {
  it('removes white space before and after a single entry', () => {
    expect(handleParseCsvEmails([' test@example.com '])).toEqual(expect.arrayContaining(['test@example.com']))
  })
  it('removes white space before and after multiple entries', () => {
    expect(handleParseCsvEmails([' test@example.com ', ' testing@example.com '])).toEqual(
      expect.arrayContaining(['test@example.com', 'testing@example.com'])
    )
  })
  it('removes duplicate emails', () => {
    expect(handleParseCsvEmails([' test@example.com ', 'test@example.com', ' testing@example.com '])).toEqual(
      expect.arrayContaining(['test@example.com', 'testing@example.com'])
    )
  })
  it('removes mulitple duplicate emails', () => {
    expect(
      handleParseCsvEmails([' test@example.com ', 'test@example.com', 'test@example.com  ', ' testing@example.com '])
    ).toEqual(expect.arrayContaining(['test@example.com', 'testing@example.com']))
  })
})
