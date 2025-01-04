import { getMetricObject, getPrimaryMetric, getSecondaryMetric } from './helpers'
import { mockActivity } from '../../../test/mockStore'

import { METRIC_PAIR_ID_MONTH } from './constants'

describe('Metrics - helpers', () => {
  describe('#getMetricObject', () => {
    it('gets metric object from metricName', () => {
      expect(getMetricObject(mockActivity.metrics, 'total_events')).toMatchSnapshot()
    })
  })

  describe('#getPrimaryMetric', () => {
    it('gets time density specific metric for current metric', () => {
      expect(getPrimaryMetric(mockActivity.metrics, 'total_events', METRIC_PAIR_ID_MONTH)).toMatchSnapshot()
    })
  })

  describe('#getSecondaryMetric', () => {
    it('gets time density specific metric for last metric', () => {
      expect(getSecondaryMetric(mockActivity.metrics, 'total_events', METRIC_PAIR_ID_MONTH)).toMatchSnapshot()
    })
  })
})
