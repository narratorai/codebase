import React, { useEffect, useRef, useState } from 'react'
import { useHistory, useLocation } from 'react-router'
import _ from 'lodash'

export const PreventBackContext = React.createContext({})

// Show alert if you're trying to leave the page and you have changes
// https://github.com/ReactTraining/history/blob/master/docs/Blocking.md
const PreventBack = ({ children }) => {
  let history = useHistory()
  const location = useLocation()

  const self = useRef(null)
  const preventBackRef = useRef(null)
  const locationRef = useRef(location)
  const [shouldPreventBack, setShouldPreventBack] = useState(false)
  // onLocationChange must be an object with {function: actualFunction}
  const [onLocationChange, setOnLocationChange] = useState(null)

  // Prevent close.
  useEffect(() => {
    const preventClose = (e) => {
      if (preventBackRef.current) {
        e.preventDefault()
        return (e.returnValue = 'Are you sure you want to close?')
      }
      return true
    }

    window.addEventListener('beforeunload', preventClose)

    return () => {
      window.removeEventListener('beforeunload', preventClose)
    }
  }, [])

  // Make sure shouldPreventBack is available inside history.block by setting it to a ref
  useEffect(() => {
    preventBackRef.current = shouldPreventBack
  }, [shouldPreventBack])

  // Use locationRef to keep track of previous location
  useEffect(() => {
    // We are changing pages
    if (locationRef.current.pathname !== location.pathname) {
      // If page changes successfully, reset shouldPreventBack so it doesn't stay on there forever
      setShouldPreventBack(false)

      // We are changing location, allow for onLocationChange if set
      if (!_.isEmpty(onLocationChange) && _.isFunction(onLocationChange.function) && locationRef.current) {
        onLocationChange.function({ prevLocation: locationRef.current, location })
        setOnLocationChange(null)
      }
    }

    locationRef.current = location
  }, [location, onLocationChange])

  useEffect(() => {
    if (!self.current) {
      self.current = history.block((targetLocation) => {
        // Add pathname guard to make sure we don't block the user if we're just updating the query params:
        // - like when we persist the group slug in the dataset url
        // - or when we persist filters on customer journey
        if (preventBackRef.current && locationRef.current.pathname !== targetLocation.pathname) {
          return 'You have unsaved changes. Are you sure you want to leave?'
        }
      })
    }

    return () => {
      self.current()
    }
  }, [history])

  return (
    <PreventBackContext.Provider value={{ setShouldPreventBack, setOnLocationChange }}>
      {children}
    </PreventBackContext.Provider>
  )
}

export const connectToPreventBackContext = (Component) => {
  class WrappedWithFormContext extends React.Component {
    static contextType = PreventBackContext

    render() {
      return <Component {...this.props} {...this.context} />
    }
  }
  return WrappedWithFormContext
}

export default PreventBack
