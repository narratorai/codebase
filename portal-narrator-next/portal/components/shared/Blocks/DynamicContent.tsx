import { BasicEditor } from '@narratorai/the-sequel'
import { Space } from 'antd-next'
import AnalyzeSimulator from 'components/Narratives/Narrative/ContentWidget/AnalyzeSimulator'
import MetricGraphic from 'components/Narratives/Narrative/ContentWidget/MetricGraphic'
import NarrativeBlockPlot from 'components/Narratives/Narrative/ContentWidget/NarrativeBlockPlot'
import NarrativeDataTable from 'components/Narratives/Narrative/ContentWidget/NarrativeDataTable'
import { AlertBox, Box, Flex } from 'components/shared/jawns'
import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import { isArray } from 'lodash'
import React, { lazy, ReactElement } from 'react'
import { COPY_MAXWIDTH, METRIC_MAXWIDTH } from 'util/analyses/constants'
import { BlockContent } from 'util/blocks/interfaces'

interface DynamicContentProps {
  content: BlockContent
}

const DynamicContent: React.FC<DynamicContentProps> = ({ content }) => {
  let component: ReactElement

  switch (content.type) {
    case 'json': {
      component = (
        <Box className="dc-basic-editor">
          <BasicEditor
            language="json"
            height="600px"
            defaultValue={JSON.stringify(content.value, null, 2)}
            options={{ readOnly: true }}
          />
        </Box>
      )
      break
    }
    case 'markdown': {
      component = (
        <Box className="dc-markdown" style={{ overflowWrap: 'break-word', maxWidth: 700, margin: 'auto' }}>
          <MarkdownRenderer source={content.value} />
        </Box>
      )
      break
    }
    case 'block_plot':
    case 'plot': {
      component = (
        <Box maxWidth={METRIC_MAXWIDTH} mx="auto">
          <NarrativeBlockPlot config={content} />
        </Box>
      )
      break
    }
    case 'table': {
      component = (
        <Box maxWidth={METRIC_MAXWIDTH} mb={3} mx="auto" style={{ height: '450px' }}>
          <NarrativeDataTable content={content.value} columnOrder={content?.column_order} />
        </Box>
      )
      break
    }
    case 'analyze_simulator': {
      component = (
        <Box maxWidth={COPY_MAXWIDTH} mx="auto">
          <AnalyzeSimulator {...(content.value as any)} />
        </Box>
      )
      break
    }
    case 'raw_metric': {
      // Raw Metric can return an array of values (to show multiple boxes
      // next to each other). So we need to handle the array case
      const metricValues = isArray(content.value) ? content.value : [content.value]

      component = (
        <Box mx="auto">
          <Flex flexWrap="wrap" justifyContent="center">
            {metricValues.map((value, i) => (
              <MetricGraphic key={i} mt={2} {...(value as any)} />
            ))}
          </Flex>
        </Box>
      )
      break
    }
    default: {
      const JsonField = lazy(
        () => import(/* webpackChunkName: "json-field" */ 'components/shared/jawns/forms/JsonField')
      )

      component = (
        <Space size="small">
          <AlertBox kind="warn">
            Could not find a component to render content of type <b>{content.type}</b>
          </AlertBox>
          <JsonField value={JSON.stringify(content.value, null, 4)} readOnly />
        </Space>
      )
    }
  }

  return component
}

export default DynamicContent
