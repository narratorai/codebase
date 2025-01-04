import appendQuery from 'append-query'
import moment from 'moment'

/**
 * See https://docs.honeycomb.io/api/direct-trace-links/
 * @returns {string} - Honeycomb trace link
 */
export function makeHoneycombTraceLink(
  traceId: string,
  startTime: string,
  endTime: string,
  dataset = 'mavis',
  team = 'narrator-ai'
): string {
  // Some tasks have a very short execution time, so we add 5 seconds to the start
  // and end time to make sure we get the trace
  const traceStart = moment(startTime).subtract(5, 'seconds').unix()
  const traceEnd = moment(endTime).add(5, 'seconds').unix()

  return appendQuery(`https://ui.honeycomb.io/${team}/datasets/${dataset}/trace`, {
    trace_id: traceId,
    trace_start_ts: traceStart,
    trace_end_ts: traceEnd,
  })
}
