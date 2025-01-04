import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { PreventBackContext } from 'components/PreventBack'
import { includes } from 'lodash'
import { useContext, useEffect } from 'react'
import { cancelAllDatasetApiRequests } from 'util/datasets/api'

const PreventBackListener = ({ selectedApiData, groupSlug, controller, runningAllTabs }) => {
  const { setShouldPreventBack, setOnLocationChange } = useContext(PreventBackContext)
  const { machineCurrent } = useContext(DatasetFormContext)
  const { _is_dirty: isDirty } = machineCurrent.context
  const { getTokenSilently } = useAuth0()
  const company = useCompany()

  // Prevent Back if the form is dirty!
  useEffect(() => {
    setShouldPreventBack(isDirty)
  }, [isDirty, setShouldPreventBack])

  // Update PreventBack with BuildDataset api request data so we can cancel when navigating away (no lingering api reqs)
  useEffect(() => {
    // this function will be fired in PreventBack when changing urls
    const cancelDatasetApi = ({ prevLocation, location }) => {
      if (prevLocation && location) {
        // Check to if were on a dataset and are navigating away from BuildDataset (want to cancel lingering api requests)
        const previousUrlIsBuildDataset =
          includes(prevLocation.pathname, 'dataset') &&
          (includes(prevLocation.pathname, 'edit') || includes(prevLocation.pathname, 'new'))
        const currentUrlIsBuildDataset =
          includes(location.pathname, 'dataset') &&
          (includes(location.pathname, 'edit') || includes(location.pathname, 'new'))

        // We are navigating away from build dataset, cancel running queries to Mavis
        if (previousUrlIsBuildDataset && !currentUrlIsBuildDataset) {
          try {
            controller.abort()
            cancelAllDatasetApiRequests({
              selectedApiData,
              getToken: getTokenSilently,
              company,
              groupSlug,
              runningAllTabs,
            })
          } catch (e) {
            // do nothing, this is a nice to have, but shouldn't block user from continuing
          }
        }
      }
    }

    // must save function in object
    setOnLocationChange({ function: cancelDatasetApi })
  }, [selectedApiData, getTokenSilently, company, groupSlug, controller, setOnLocationChange, runningAllTabs])

  return null
}

export default PreventBackListener
