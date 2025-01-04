import { GoogleOutlined } from '@ant-design/icons'
import { Popover } from 'antd-next'
import BiIcons from 'components/Datasets/BiLogos'
import { DatasetFromQuery } from 'components/Datasets/interfaces'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { IMaterialization_Type_Enum } from 'graph/generated'
import { INarrative_Types_Enum } from 'graph/generated'
import { compact, each, filter, includes, isEmpty, isString, keys, map, some, startCase, toLower } from 'lodash'
import React from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'
import {
  ALL_BI_OPTIONS,
  ALL_KNOWN_BI_OPTIONS,
  BI_OTHER,
  INTEGRATION_TYPE_MATERIALIZED,
  INTEGRATION_TYPE_VIEW,
  INTEGRATIONS_CONFIG,
} from 'util/datasets/v2/integrations/constants'
import { makeBiToolLabel } from 'util/datasets/v2/integrations/helpers'
import { BiToolType } from 'util/datasets/v2/integrations/interfaces'

const HoverBox = styled(Box)`
  &:hover {
    cursor: default;
  }
`

type DatasetIntegrations = DatasetFromQuery['materializations']
type DatasetNarratives = DatasetFromQuery['dependent_narratives']

interface Props {
  integrations: DatasetIntegrations
  narratives: DatasetNarratives
}

const UsedByCell = ({ integrations, narratives }: Props) => {
  if (isEmpty(integrations) && isEmpty(narratives)) {
    return null
  }

  const nonDashboardNarratives = filter(narratives, (nar) => nar.narrative?.type !== INarrative_Types_Enum.Dashboard)
  const dashboards = filter(narratives, (nar) => nar.narrative?.type === INarrative_Types_Enum.Dashboard)

  const integrationsByType: { [key: string | IMaterialization_Type_Enum]: DatasetIntegrations } = {}
  each(integrations, (int) => {
    const intType: string = int.type

    // initialize integation type if empty
    if (isString(intType) && isEmpty(integrationsByType[intType])) {
      integrationsByType[intType] = []
    }

    // add integration to its type
    if (isString(intType)) {
      integrationsByType[intType] = [...integrationsByType[intType], int]
    }
  })

  const allTypeKeys = keys(integrationsByType)

  // TODO: update any to DatasetIntegrations and fix type error (thinks it's a number?)
  const allBiToolsByType: { [key: BiToolType | string]: any } = {}
  each(ALL_BI_OPTIONS, (biOp: string) => {
    const matchingIntegrations = filter(integrations, (int) => {
      // only Materialized Views and Views have BI Tool urls (as webhook_url)
      const isCorrectType = int.type === INTEGRATION_TYPE_MATERIALIZED || int.type === INTEGRATION_TYPE_VIEW
      if (isCorrectType && int.webhook_url) {
        // check for known BI Integrations (i.e. Looker/Metabase)
        if (biOp !== BI_OTHER && includes(toLower(int.webhook_url as string), toLower(biOp))) {
          return int
        }

        // check for Other BI Integrations (has webhook_url, but not known/no match)
        if (biOp === BI_OTHER && !some(ALL_KNOWN_BI_OPTIONS, (knownOp) => includes(int.webhook_url, knownOp))) {
          return int
        }
      }
    })

    if (!isEmpty(matchingIntegrations)) {
      allBiToolsByType[biOp] = matchingIntegrations
    }
  })

  const allBiTools = keys(allBiToolsByType) as BiToolType[]

  return (
    <Flex style={{ maxWidth: '240px' }} flexWrap="wrap">
      {/* Show all Integration Types */}
      {map(allTypeKeys, (intType, index) => {
        // for G Sheets, show Google Icon and links for the sheets
        if (intType === IMaterialization_Type_Enum.Gsheets) {
          return (
            <Flex key={intType}>
              <HoverBox mr={1}>
                <Popover
                  trigger={['hover', 'click']}
                  title="Google Sheets"
                  content={
                    <Box>
                      {compact(
                        map(integrationsByType[intType], (integration) => {
                          if (integration.external_link) {
                            return (
                              <Typography key={`${integration.label}_${integration.external_link}`}>
                                <a href={integration.external_link} target="_blank" rel="noopener noreferrer">
                                  {startCase(integration.label)}
                                </a>
                              </Typography>
                            )
                          }
                          return null
                        })
                      )}
                    </Box>
                  }
                >
                  <Flex alignItems="center">
                    <Box mr="4px">
                      <GoogleOutlined style={{ color: colors.blue500 }} />
                    </Box>
                    <Typography>
                      {allTypeKeys.length - 1 === index ? startCase(intType) : `${startCase(intType)}, `}
                    </Typography>
                  </Flex>
                </Popover>
              </HoverBox>
            </Flex>
          )
        }

        // For all other integration types, give them a popover with the different labels
        return (
          <Flex key={intType}>
            <HoverBox>
              <Popover
                trigger={['hover', 'click']}
                title={INTEGRATIONS_CONFIG[intType]?.displayName || startCase(intType)}
                content={
                  <Box>
                    {map(integrationsByType[intType], (integration) => (
                      <Typography key={integration.label}>{startCase(integration.label)}</Typography>
                    ))}
                  </Box>
                }
              >
                {allTypeKeys.length - 1 === index ? (
                  <span>{startCase(intType)}</span>
                ) : (
                  <span style={{ marginRight: '4px' }}>{`${startCase(intType)}, `}</span>
                )}
              </Popover>
            </HoverBox>
          </Flex>
        )
      })}

      {/* Add Hover for BI Tools */}
      {!isEmpty(allBiTools) && (
        <Flex flexWrap="wrap">
          {map(allBiTools, (biTool) => (
            <HoverBox ml={1} key={biTool}>
              <Popover
                trigger={['hover', 'click']}
                title={makeBiToolLabel(biTool)}
                content={
                  <Box>
                    {map(allBiToolsByType[biTool], (integration) => (
                      <Box key={integration.id}>
                        <a href={integration.webhook_url} target="_blank" rel="noopener noreferrer">
                          {integration.webhook_url}
                        </a>
                      </Box>
                    ))}
                  </Box>
                }
              >
                {/* {biTool} */}
                <BiIcons biType={toLower(biTool) as BiToolType} height="24px" width="24px" />
              </Popover>
            </HoverBox>
          ))}
        </Flex>
      )}

      {/* Add Hover for Dataset Narratives */}
      {!isEmpty(nonDashboardNarratives) && (
        <HoverBox ml={1}>
          <Popover
            trigger={['hover', 'click']}
            title="Analyses"
            content={
              <Box>
                {map(nonDashboardNarratives, (narrative) => (
                  <Box key={narrative.id}>
                    <Link to={`/narratives/a/${narrative.narrative.slug}`} target="_blank">
                      {narrative.narrative.name}
                    </Link>
                  </Box>
                ))}
              </Box>
            }
          >
            Analyses
          </Popover>
        </HoverBox>
      )}

      {/* Add Hover for Dashboards */}
      {!isEmpty(dashboards) && (
        <HoverBox ml={1}>
          <Popover
            trigger={['hover', 'click']}
            title="Dashboards"
            content={
              <Box>
                {map(dashboards, (dashboard) => (
                  <Box key={dashboard.id}>
                    <Link to={`/dashboards/a/${dashboard.narrative.slug}`} target="_blank">
                      {dashboard.narrative.name}
                    </Link>
                  </Box>
                ))}
              </Box>
            }
          >
            Dashboards
          </Popover>
        </HoverBox>
      )}
    </Flex>
  )
}

export default UsedByCell
