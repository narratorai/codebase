import { formatLocalTimeToUTC } from 'components/Activities/v2/helpers'
import moment from 'moment-timezone'

const dateTimeOne = moment('2020-10-12T07:00:00')
const dateTimeTwo = moment('2015-09-17T15:30:25')

describe('src/components/antd', () => {
  describe('formatLocalTimeToUTC', () => {
    describe('date_time resolution', () => {
      it('takes a moment value in company time (LA) and returns the UTC string', () => {
        const formattedTime = formatLocalTimeToUTC({
          value: dateTimeOne,
          resolution: 'date_time',
          timezone: 'America/Los_Angeles',
        })
        expect(formattedTime).toBe('2020-10-12T14:00:00.000Z')
      })
      it('takes a moment value in company time (NY) and returns the UTC string', () => {
        const formattedTime = formatLocalTimeToUTC({
          value: dateTimeTwo,
          resolution: 'date_time',
          timezone: 'America/New_York',
        })
        expect(formattedTime).toBe('2015-09-17T19:30:25.000Z')
      })
    })

    describe('no resolution (defaults to date_time)', () => {
      it('takes a moment value in company time (LA) and defaults to date_time if no resolution is passed and returns the UTC string', () => {
        const formattedTime = formatLocalTimeToUTC({
          value: dateTimeOne,
          timezone: 'America/Los_Angeles',
        })
        expect(formattedTime).toBe('2020-10-12T14:00:00.000Z')
      })
      it('takes a moment value in company time (NY) and defaults to date_time if no resolution is passed and returns the UTC string', () => {
        const formattedTime = formatLocalTimeToUTC({
          value: dateTimeTwo,
          timezone: 'America/New_York',
        })
        expect(formattedTime).toBe('2015-09-17T19:30:25.000Z')
      })
    })

    describe('week resolution', () => {
      it('takes a moment value in company time (LA) and returns UTC string at start of week', () => {
        const formattedTime = formatLocalTimeToUTC({
          value: dateTimeTwo,
          resolution: 'week',
          timezone: 'America/Los_Angeles',
        })
        expect(formattedTime).toBe('2015-09-13T07:00:00.000Z')
      })
      it('takes a moment value in company time (NY) and returns UTC string at start of week', () => {
        const formattedTime = formatLocalTimeToUTC({
          value: dateTimeTwo,
          resolution: 'week',
          timezone: 'America/New_York',
        })
        expect(formattedTime).toBe('2015-09-13T04:00:00.000Z')
      })
    })

    describe('month resolution', () => {
      it('takes a moment value in company time (LA) and returns UTC string at start of month', () => {
        const formattedTime = formatLocalTimeToUTC({
          value: dateTimeTwo,
          resolution: 'month',
          timezone: 'America/Los_Angeles',
        })
        expect(formattedTime).toBe('2015-09-01T07:00:00.000Z')
      })
      it('takes a moment value in company time (NY) and returns UTC string at start of month', () => {
        const formattedTime = formatLocalTimeToUTC({
          value: dateTimeTwo,
          resolution: 'month',
          timezone: 'America/New_York',
        })
        expect(formattedTime).toBe('2015-09-01T04:00:00.000Z')
      })
    })

    describe('quarter resolution', () => {
      it('takes a moment value in company time (LA) and returns UTC string at start of quarter', () => {
        const formattedTime = formatLocalTimeToUTC({
          value: dateTimeTwo,
          resolution: 'quarter',
          timezone: 'America/Los_Angeles',
        })
        expect(formattedTime).toBe('2015-07-01T07:00:00.000Z')
      })
      it('takes a moment value in company time (NY) and returns UTC string at start of quarter', () => {
        const formattedTime = formatLocalTimeToUTC({
          value: dateTimeTwo,
          resolution: 'quarter',
          timezone: 'America/New_York',
        })
        expect(formattedTime).toBe('2015-07-01T04:00:00.000Z')
      })
    })

    describe('year resolution', () => {
      it('takes a moment value in company time (LA) and returns UTC string at start of year', () => {
        const formattedTime = formatLocalTimeToUTC({
          value: dateTimeTwo,
          resolution: 'year',
          timezone: 'America/Los_Angeles',
        })
        expect(formattedTime).toBe('2015-01-01T08:00:00.000Z')
      })
      it('takes a moment value in company time (NY) and returns UTC string at start of year', () => {
        const formattedTime = formatLocalTimeToUTC({
          value: dateTimeTwo,
          resolution: 'year',
          timezone: 'America/New_York',
        })
        expect(formattedTime).toBe('2015-01-01T05:00:00.000Z')
      })
    })
  })
})
