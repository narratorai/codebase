import { stringifyWithUndefined } from './forms'

describe('stringifyWithUndefined()', () => {
  it('converts undefined values to null', () => {
    expect(
      stringifyWithUndefined({
        keep: 'this',
        this_too: undefined,
      })
    ).toMatchSnapshot()
  })
})
