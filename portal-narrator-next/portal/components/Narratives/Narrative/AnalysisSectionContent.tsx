import { Box, Flex } from 'components/shared/jawns'
import { includes, isArray, isEmpty, map } from 'lodash'
import React from 'react'
import { METRIC_MAXWIDTH } from 'util/analyses/constants'
import { CONTENT_TYPE_DATASET_METRIC, CONTENT_TYPE_IMAGE_UPLOAD, CONTENT_TYPE_RAW_METRIC } from 'util/narratives'

import ContentWidget from './ContentWidget/ContentWidget'

interface Props {
  content: any[]
}

const AnalysisSectionContent = ({ content }: Props) => {
  let datasetMetrics: React.ReactNode[] = []

  return (
    <Box data-private>
      {map(content, (config, index) => {
        const contentConfig = isArray(config) ? config : [config]

        return contentConfig.map((config) => {
          const key = index.toString()

          // This madness is to keep consecutive dataset metric graphics stacked horizontally instead of vertically
          // if it's a dataset metric, let's save it until the next one isn't a dataset metric
          // (that way we can stack them together)
          if (includes([CONTENT_TYPE_DATASET_METRIC, CONTENT_TYPE_RAW_METRIC], config.type)) {
            datasetMetrics.push(
              <Box mb={2} key={key}>
                <ContentWidget config={config} />
              </Box>
            )
          }

          // if datasetMetrics is empty and this isn't a dataset metric, then just return the content widget
          if (
            isEmpty(datasetMetrics) &&
            !includes([CONTENT_TYPE_DATASET_METRIC, CONTENT_TYPE_RAW_METRIC], config.type)
          ) {
            // center image content
            if (config.type === CONTENT_TYPE_IMAGE_UPLOAD) {
              return (
                <Flex justifyContent="center" mb={2} key={key}>
                  <ContentWidget config={config} />
                </Flex>
              )
            }

            // non-image/metric content
            return (
              <Box mb={2} key={key}>
                <ContentWidget config={config} />
              </Box>
            )
          }

          // if it isn't a dataset metric and there were previous datasetMetrics that we haven't returned yet
          // return them with the current content widget
          if (
            !isEmpty(datasetMetrics) &&
            !includes([CONTENT_TYPE_DATASET_METRIC, CONTENT_TYPE_RAW_METRIC], config.type)
          ) {
            const tempDatasetMetrics = datasetMetrics
            datasetMetrics = []

            return (
              <Box mx="auto" maxWidth={METRIC_MAXWIDTH} key={`${key}_including_dataset_metrics`}>
                {/* wrap all the metrics together */}
                <Flex flexWrap="wrap" justifyContent="center">
                  {tempDatasetMetrics}
                </Flex>

                {/* then display current content */}
                {config.type === CONTENT_TYPE_IMAGE_UPLOAD ? (
                  // center image content
                  <Flex justifyContent="center" mb={2} key={key}>
                    <ContentWidget config={config} />
                  </Flex>
                ) : (
                  <Box mb={2} key={key}>
                    <ContentWidget config={config} />
                  </Box>
                )}
              </Box>
            )
          }

          // if it's the last content widget and it's a dataset metric, return it and all previous consecutive dataset metrics
          if (
            content.length - 1 === index &&
            includes([CONTENT_TYPE_DATASET_METRIC, CONTENT_TYPE_RAW_METRIC], config.type)
          ) {
            return (
              <Box mx="auto" maxWidth={METRIC_MAXWIDTH} key={`${key}_including_dataset_metrics`}>
                <Flex flexWrap="wrap" justifyContent="center">
                  {datasetMetrics}
                </Flex>
              </Box>
            )
          }

          // it's a dataset metric, but there may be more!
          return null
        })
      })}
    </Box>
  )
}

export default AnalysisSectionContent
