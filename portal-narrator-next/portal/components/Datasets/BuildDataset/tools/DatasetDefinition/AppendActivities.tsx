import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'
import DatasetDefinitionContext from 'components/Datasets/BuildDataset/tools/DatasetDefinition/DatasetDefinitionContext'
import { IDatasetDefinitionContext } from 'components/Datasets/BuildDataset/tools/DatasetDefinition/interfaces'
import { Box } from 'components/shared/jawns'
import { isEmpty } from 'lodash'
import React, { lazy, Suspense, useContext, useState } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import analytics from 'util/analytics'
import { DEFAULT_APPEND_ACTIVITY, OCCURRENCE_TIME } from 'util/datasets'
import { makeShortid } from 'util/shortid'

import AppendActivityContent from './AppendActivityContent'

export const ADD_JOIN_ACTIVITY_BUTTON_ID = 'add_join_activity_button'

const RelationshipAnimationModal = lazy(
  () =>
    import(
      /* webpackChunkName: "relationship-animation-modal" */ './RelationshipAnimationModal/RelationshipAnimationModal'
    )
)

export interface AppendActivitiesProps {
  processing: boolean
  drawerVisible: boolean
  isViewMode?: boolean
}

const AppendActivities: React.FC<AppendActivitiesProps> = ({ processing, drawerVisible, isViewMode }) => {
  const [showRelationshipModal, setShowRelationshipModal] = useState(false)
  const [appendActivityFieldName, setAppendActivityFieldName] = useState('')
  const { watch, control } = useFormContext()

  const { datasetSlug } = useContext<IDatasetDefinitionContext>(DatasetDefinitionContext)

  const cohortValue = watch('cohort.activity_ids')
  const hasCohort = !isEmpty(cohortValue)

  const occurrenceValue = watch('cohort.occurrence_filter.occurrence')
  const isTimeOccurrence = occurrenceValue === OCCURRENCE_TIME

  const appendActivities = watch('append_activities')
  const { append: addAppendActivity } = useFieldArray({
    control,
    name: 'append_activities',
  })

  const handleAddAppendActivity = () => {
    addAppendActivity({
      ...DEFAULT_APPEND_ACTIVITY,
      // make sure the new activity has unique key
      _unique_key: makeShortid(),
    })
  }

  if (!hasCohort && !isTimeOccurrence) {
    return null
  }

  return (
    <Box>
      {showRelationshipModal && (
        <Suspense fallback={null}>
          <RelationshipAnimationModal
            appendActivityFieldName={appendActivityFieldName}
            visible={showRelationshipModal}
            onClose={() => setShowRelationshipModal(false)}
          />
        </Suspense>
      )}

      <Box>
        {/* per https://github.com/react-hook-form/react-hook-form/issues/1564#issuecomment-875566912
        map over values - rather than fields to avoid outdated state
      */}
        {appendActivities?.map((appendActivity: any, index: number) => {
          const openRelationshipModal = () => {
            setAppendActivityFieldName(`append_activities.${index}`)
            setShowRelationshipModal(true)

            // Track when users open the relationship wizard:
            analytics.track('opened_relationship_wizard', {
              dataset_slug: datasetSlug,
              relationship_slug: appendActivity?.relationship_slug,
            })
          }

          // key helps activities stay unique, especially when reordering
          const key = appendActivity._unique_key
          return (
            <AppendActivityContent
              key={key}
              openRelationshipModal={openRelationshipModal}
              index={index}
              appendActivity={appendActivity}
              processing={processing}
              drawerVisible={drawerVisible}
              isViewMode={isViewMode}
            />
          )
        })}

        <Box mt={2}>
          <Button onClick={handleAddAppendActivity} data-test="append-activity-cta" id={ADD_JOIN_ACTIVITY_BUTTON_ID}>
            <PlusOutlined /> Join Activity
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default AppendActivities
