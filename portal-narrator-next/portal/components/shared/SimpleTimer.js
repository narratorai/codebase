import { useState } from 'react'
import PropTypes from 'prop-types'
import useInterval from 'util/useInterval'

// Timer component that renders the passed-in children and provides a 'displayTime' number
//
// Example usage:
// <SimpleTimer requestStartedAt={queryStartedAt}>
// { displayTime => (
//   <Typography type="body200">{displayTime} seconds</Typography>
// )}
// </SimpleTimer>
//

const SimpleTimer = ({ children, requestCompletedAt, requestStartedAt }) => {
  const [count, setCount] = useState(0)

  const loading = requestStartedAt && !requestCompletedAt
  const loaded = requestStartedAt && requestCompletedAt

  // Only force a re-render when loading is true
  useInterval(
    () => {
      setCount(count + 0.1)
    },
    loading ? 100 : null
  )

  if (!loading && !loaded) {
    return null
  }

  const timeSinceStart = (new Date().getTime() - requestStartedAt) / 1000
  const completedTime = (requestCompletedAt - requestStartedAt) / 1000
  const displayTime = loading ? timeSinceStart.toFixed(1) : completedTime.toFixed(1)

  return children(displayTime)
}

SimpleTimer.propTypes = {
  requestStartedAt: PropTypes.number,
  requestCompletedAt: PropTypes.number,
}

export default SimpleTimer
