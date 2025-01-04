import { Badge, Button } from 'antd-next'
import { Box, Flex } from 'components/shared/jawns'
import React from 'react'
import { colors } from 'util/constants'

import { useBuildNarrativeContext } from './BuildNarrativeProvider'
import QuestionAndGoal from './QuestionAndGoal'
import RecommendationAndKeyTakeaways from './RecommendationAndKeyTakeaways'
import Sections from './Sections/Sections'
import { EditorBox, PreviewBox } from './Sections/SharedLayout'

interface Props {
  showQuestionGoalKeyTakeaways: boolean
}

const BuildNarrativeContent = ({ showQuestionGoalKeyTakeaways }: Props) => {
  const { assembledFieldsResponse, saving, handleToggleQuestionGoalKeyTakeaways } = useBuildNarrativeContext()
  const fields = assembledFieldsResponse?.fields

  // Wait until assembled `fields` have loaded
  if (!fields) {
    return null
  }

  return (
    <Box mt={'105px'} relative>
      <Flex>
        <EditorBox style={{ padding: 0, height: '32px' }}>
          <Badge.Ribbon text="Edit" />
        </EditorBox>

        <PreviewBox style={{ height: '32px' }}>
          <Badge.Ribbon text="Preview" />
        </PreviewBox>
      </Flex>

      {!showQuestionGoalKeyTakeaways && (
        <Flex>
          <EditorBox style={{ height: '64px' }}>
            <Flex justifyContent="flex-end">
              <Button size="small" onClick={handleToggleQuestionGoalKeyTakeaways} data-test="add-goal-button">
                Add Goal
              </Button>
            </Flex>
          </EditorBox>
          <PreviewBox style={{ height: '64px' }} />
        </Flex>
      )}

      <fieldset disabled={saving}>
        {showQuestionGoalKeyTakeaways && (
          <>
            <QuestionAndGoal />
            <RecommendationAndKeyTakeaways />
          </>
        )}

        {/* Dark line separator mimics the styling of SectionContent */}
        <Box mb={'30px'} style={{ borderBottom: `2px solid ${colors.gray600}`, backgroundColor: 'white' }} />

        <Sections />
      </fieldset>
    </Box>
  )
}

export default BuildNarrativeContent
