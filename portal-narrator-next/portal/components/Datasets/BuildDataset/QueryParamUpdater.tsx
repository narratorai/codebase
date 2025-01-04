import { App } from 'antd-next'
import _ from 'lodash'
import queryString from 'query-string'
import { useContext, useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { useHistory } from 'react-router-dom'
import { getGroupFromContext } from 'util/datasets'
import { viewTypeConstants } from 'util/datasets/interfaces'

import DatasetFormContext from './DatasetFormContext'

interface Props {
  groupIndex: number | null
  onUpdateIndex: (arg: any) => void
}

const QueryParamUpdater = ({ groupIndex, onUpdateIndex }: Props) => {
  const { notification } = App.useApp()
  const { push } = useHistory()
  const { machineCurrent, machineSend } = useContext(DatasetFormContext)
  const { _group_slug: groupSlug, all_groups: allGroups, _plot_slug: plot, _view: view } = machineCurrent.context
  const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })

  const location = useLocation()
  const didMountRef = useRef(false)
  const hasSetInitialPlot = useRef(false)

  // Check for plot slug in params once machine is 'ready' and set in machine
  // only do this on load (hence the hasSetInitialPlot ref)
  useEffect(() => {
    const { plot: plotParams } = queryString.parse(location.search)

    if (plotParams && !plot && groupSlug && view === viewTypeConstants.PLOT && !hasSetInitialPlot.current) {
      // check if the plot exists
      const foundPlot = _.find(group?.plots, ['slug', plotParams])

      // select plot if it exists
      if (foundPlot) {
        machineSend('SELECT_PLOT', { groupSlug, plotSlug: plotParams })
        hasSetInitialPlot.current = true
        return
      }

      // if you can't find the plot, but plots exist
      // redirect user to first plot available
      if (!foundPlot && !_.isEmpty(group?.plots)) {
        machineSend('SELECT_PLOT', { groupSlug, plotSlug: group?.plots?.[0].slug })
        hasSetInitialPlot.current = true
        notification.warning({
          key: 'plot-not-found-redirect-warning',
          message: 'Plot from URL not Found',
          description: 'Redirected to first available plot',
        })

        return
      }
    }

    // we know it's loaded if there was ever a plot set in the machine
    if (plot && !hasSetInitialPlot.current) {
      hasSetInitialPlot.current = true
    }
  }, [location.search, plot, groupSlug, group, view, machineCurrent, machineSend, hasSetInitialPlot])

  useEffect(() => {
    // If groupSlug is updated
    // - update parent state's groupIndex to match the groupSlug that was just selected
    if (groupSlug) {
      const selectedGroupIndex = _.findIndex(allGroups, ['slug', groupSlug])

      if (groupIndex !== selectedGroupIndex) {
        onUpdateIndex(selectedGroupIndex)
      }
    }
  }, [allGroups, groupIndex, groupSlug, onUpdateIndex])

  // handle query params: ?group, ?view, ?plot
  useEffect(() => {
    const existingSearch = queryString.parse(location.search)
    // don't add table to view (it's the default)
    const viewType = view === viewTypeConstants.TABLE ? undefined : view

    // NOTE this is wrapped in didMountRef so on first page load we don't cause
    // an unnecessary page change
    if (didMountRef.current) {
      // on a Group
      if (groupSlug) {
        const newSearch = {
          ...existingSearch,
          group: groupSlug, // add ?group
          view: viewType, // add ?view
          plot, // add ?plot
        }

        if (!_.isEqual(location.search, newSearch)) {
          push({
            search: `?${queryString.stringify(newSearch)}`,
          })
        }
      }

      // on Parent
      if (!groupSlug) {
        // add view (for sql) and remove plot and group (no plot or group on Parent)
        const newSearch = _.omit({ ...existingSearch, view: viewType }, ['group', 'plot'])

        if (!_.isEqual(location.search, newSearch)) {
          push({
            search: `?${queryString.stringify(newSearch)}`,
          })
        }
      }
    } else {
      didMountRef.current = true
    }
  }, [group, groupSlug, location.search, push, view, plot])

  return null
}

export default QueryParamUpdater
