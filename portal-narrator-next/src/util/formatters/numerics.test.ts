import { formatCurrency, formatDecimal, formatOrdinal, formatPercent, formatShortDecimal } from './numerics'

describe('formatCurrency', () => {
  it('should return formatted currency', () => {
    const value = 123456789.345
    const options = { currency: 'USD', locale: 'en-US' }
    const expected = '$123,456,789.35'
    const result = formatCurrency(value, options)

    expect(result).toBe(expected)
  })
})

describe('formatDecimal', () => {
  it('should return formatted decimal', () => {
    const value = 123456789.345
    const options = { locale: 'en-US' }
    const expected = '123,456,789.35'
    const result = formatDecimal(value, options)

    expect(result).toBe(expected)
  })
})

describe('formatOrdinal', () => {
  it('should return formatted ordinal', () => {
    const value = 23
    const options = { locale: 'en-US' }
    const expected = '23rd'
    const result = formatOrdinal(value, options)

    expect(result).toBe(expected)
  })
})

describe('formatPercent', () => {
  it('should return formatted percent', () => {
    const value = 0.1025
    const expected = '10.25%'
    const options = { locale: 'en-US' }
    const result = formatPercent(value, options)

    expect(result).toBe(expected)
  })
})

describe('formatShortDecimal', () => {
  it('should return formatted short decimal of a large number', () => {
    const value = 123456789.345
    const options = { locale: 'en-US' }
    const expected = '123M'
    const result = formatShortDecimal(value, options)

    expect(result).toBe(expected)
  })

  it('should return formatted short decimal of a small number', () => {
    const value = 0.12356
    const options = { locale: 'en-US' }
    const expected = '0.12'
    const result = formatShortDecimal(value, options)
    expect(result).toBe(expected)
  })

  it('should return formatted short decimal of a small number', () => {
    const value = 0.0000012356
    const options = { locale: 'en-US' }
    const expected = '0.0000012'
    const result = formatShortDecimal(value, options)
    expect(result).toBe(expected)
  })
})
