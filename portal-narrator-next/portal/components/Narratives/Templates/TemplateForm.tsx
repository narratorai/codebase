import { Spin } from 'antd-next'
import TemplateContext from 'components/Narratives/Templates/TemplateContext'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { useContext } from 'react'
import { colors } from 'util/constants'

import MachineError from './MachineError'
import ActivityMapping from './NarrativeFromTemplateForm/ActivityMapping'
import AdditionalContext from './NarrativeFromTemplateForm/AdditionalContext'
import DatasetFeatureMapping from './NarrativeFromTemplateForm/DatasetFeatureMapping'
import WordMappings from './NarrativeFromTemplateForm/WordMappings'
import TemplateSteps from './TemplateSteps'

const TemplateForm = () => {
  const { machineCurrent } = useContext(TemplateContext)
  const assemblingNarrative = machineCurrent.matches({ api: 'assembling_narrative' })
  const loading =
    machineCurrent.matches({ api: 'loading_feature_options' }) ||
    machineCurrent.matches({ api: 'creating_narrative' }) ||
    assemblingNarrative

  const previewData = machineCurrent.context._preview_narrative

  return (
    <Spin spinning={loading} tip={assemblingNarrative ? 'Assembling' : undefined}>
      <Flex
        bg="white"
        p={8}
        flexDirection="column"
        alignItems="center"
        style={{
          border: `2px solid ${colors.gray200}`,
        }}
      >
        <Box width={1} mb={5}>
          <TemplateSteps />
        </Box>

        <Box bg="gray100" py={7} px={8} width={1}>
          <MachineError />

          {machineCurrent.matches({ main: 'activity_mapping' }) && <ActivityMapping />}
          {machineCurrent.matches({ main: 'dataset_feature_mapping' }) && <DatasetFeatureMapping />}
          {machineCurrent.matches({ main: 'word_mappings' }) && <WordMappings />}
          {machineCurrent.matches({ main: 'assembled' }) && (
            <div>
              {previewData && (
                <Typography mb={2}>
                  Success! Go to your new Narrative:
                  <Link to={`/narratives/a/${previewData.narrative_slug}`}>{previewData.narrative_slug}</Link>
                </Typography>
              )}
            </div>
          )}

          <AdditionalContext />
        </Box>
      </Flex>
    </Spin>
  )
}

export default TemplateForm
