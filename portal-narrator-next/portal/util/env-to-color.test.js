import { envToColor } from './env-to-color'
import { colors } from './constants'

describe('envToColor', () => {
  it('handles `null` case', () => {
    expect(envToColor(null)).toBeUndefined()
  })

  it('handles `undefined` case', () => {
    expect(envToColor()).toBeUndefined()
  })

  it('handles `development` string case', () => {
    expect(envToColor('development')).toEqual(colors.red600)
  })

  it('handles `review` string case', () => {
    expect(envToColor('review')).toEqual(colors.yellow600)
  })

  it('handles `staging` string case', () => {
    expect(envToColor('staging')).toEqual(colors.orange600)
  })
})
