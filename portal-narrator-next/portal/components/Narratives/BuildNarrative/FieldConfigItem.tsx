import {
  CalendarOutlined,
  CopyOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DeploymentUnitOutlined,
  DotChartOutlined,
  EditOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  FileUnknownOutlined,
  FontColorsOutlined,
  InfoCircleOutlined,
  NumberOutlined,
  PercentageOutlined,
  QuestionCircleOutlined,
  TableOutlined,
} from '@ant-design/icons'
import theme from '@narratorai/theme'
import { Button, Popconfirm, Popover, Space } from 'antd-next'
import { Divider } from 'components/antd/staged'
import { Box, BoxProps, Flex, Typography } from 'components/shared/jawns'
import Mark from 'components/shared/Mark'
import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import { includes, isEmpty, isFinite, isObject, uniq } from 'lodash'
import React from 'react'
import styled from 'styled-components'
import { FieldConfig } from 'util/blocks/interfaces'
import { colors, semiBoldWeight } from 'util/constants'

import { useBuildNarrativeContext } from './BuildNarrativeProvider'

const StyledOptionItem = styled(Box)`
  &:hover {
    background-color: ${colors.gray100};
  }
`

interface Props extends BoxProps {
  index: number
  container?: HTMLDivElement | null
  fieldConfig: FieldConfig & { searchValue?: string }
  dependentFieldsForField: string[]
  dependentFields: string[]
  editFieldCallback: (fieldConfig: FieldConfig, index: number) => void
  duplicateFieldCallback: (fieldConfig: FieldConfig) => void
  removeFieldCallback: (index: number) => void
}

const FieldConfigItem = ({
  index,
  container,
  fieldConfig,
  dependentFieldsForField = [],
  dependentFields = [],
  editFieldCallback,
  duplicateFieldCallback,
  removeFieldCallback,
  ...props
}: Props) => {
  const { assembledFieldsResponse } = useBuildNarrativeContext()
  const fields = assembledFieldsResponse?.fields

  const mapFieldKindToIcon = (fieldConfig: FieldConfig, color = 'inherit') => {
    let Icon = QuestionCircleOutlined

    switch (fieldConfig.kind) {
      case 'dataset_metric':
        Icon = DatabaseOutlined
        break
      case 'value':
        Icon = FileTextOutlined
        break
      case 'labeled_field':
        Icon = FileUnknownOutlined
        break
      case 'trend':
        Icon = DotChartOutlined
        break
      case 'consistency_checker':
        Icon = FileDoneOutlined
        break
      case 'combined_dataset':
        Icon = DeploymentUnitOutlined
        break
      default:
        break
    }

    return <Icon style={{ color }} />
  }

  const mapFieldFormatToIcon = (fieldConfig: FieldConfig, color = 'inherit') => {
    let Icon = QuestionCircleOutlined

    switch (fieldConfig.format) {
      case 'text':
        Icon = FontColorsOutlined
        break
      case 'number':
        Icon = NumberOutlined
        break
      case 'percent':
        Icon = PercentageOutlined
        break
      case 'time':
        Icon = CalendarOutlined
        break
      case 'table':
        Icon = TableOutlined
        break
      default:
        break
    }

    return <Icon style={{ color }} />
  }

  const getFieldValue = (fieldConfig: FieldConfig) => {
    const originalValue = fields?.[fieldConfig.name]
    const isTable = fieldConfig.format === 'table'

    if (isTable) return <Typography as="pre">{'table'}</Typography>

    if (isObject(originalValue)) return <Typography as="pre">{JSON.stringify(originalValue, null, 2)}</Typography>

    // If it's a number or NOT an empty string/array/object or null/undefined return the value
    if (isFinite(originalValue) || !isEmpty(originalValue)) return originalValue

    // If it wasn't a number or it WAS empty string/array... return the string 'Unknown'
    return 'Unknown'
  }

  const getFormattedFieldValue = (fieldConfig: FieldConfig) => {
    const originalValue = fields?.[`#${fieldConfig.name}`]

    if (isObject(originalValue)) return <Typography as="pre">{'{...}'}</Typography>

    // If it's a number or NOT an empty string/array/object or null/undefined return the value
    if (isFinite(originalValue) || !isEmpty(originalValue)) return originalValue

    // If it wasn't a number or it WAS empty string/array... return the string 'Unknown'
    return 'Unknown'
  }

  // we define a custom popup container so that the "click outside"
  // functionality works properly from the parent `FieldConfigs` component
  const getPopupContainer = () => container || document.body

  // need to set zIndex to same value as
  // https://github.com/narratorai/antd-custom/blob/5c8d7548bb8f82e8b02dc287a6829b6919f29a47/lib/src/components/Select.tsx#L38
  const overlayZindex = theme.zIndex.overlay + 1

  const fieldValue = getFieldValue(fieldConfig)
  const formattedValue = getFormattedFieldValue(fieldConfig)
  const isTable = fieldConfig.format === 'table'

  const uniqPreviousNames = uniq(fieldConfig?.previous_names || [])
  const dependsOn = fieldConfig?.field_depends_on || []

  return (
    <StyledOptionItem py={2} px={2} bg="white" {...props}>
      <Flex justifyContent="space-between" alignItems="flex-start">
        <Box
          width={1}
          onClick={() => editFieldCallback(fieldConfig, index)}
          style={{
            cursor: 'pointer',
          }}
        >
          <Typography type="title400" fontWeight={semiBoldWeight}>
            <Mark value={fieldConfig.name} snippet={fieldConfig.searchValue} />
          </Typography>
          <Box width={1} maxWidth={'800px'} style={{ overflow: 'auto' }}>
            {/(FAILED|ERROR)/.test(`${fieldValue}`) ? (
              <>
                {/(ERROR)/.test(`${fieldValue}`) && <MarkdownRenderer source={`${fieldValue}`} />}
                {/(FAILED)/.test(`${fieldValue}`) && (
                  <Typography as="pre" color="red600" style={{ whiteSpace: 'pre-wrap' }}>
                    {fieldValue}
                  </Typography>
                )}
              </>
            ) : (
              <>
                <Box>
                  {isTable ? (
                    <Popover
                      placement="right"
                      trigger={['click']}
                      title={<Typography type="title300">{fieldConfig.name}</Typography>}
                      content={
                        <Box
                          style={{
                            maxHeight: 600,
                            overflow: 'auto',
                          }}
                        >
                          <MarkdownRenderer source={`${formattedValue}`} />
                        </Box>
                      }
                      getPopupContainer={getPopupContainer}
                      overlayStyle={{
                        zIndex: overlayZindex,
                        minWidth: 400,
                      }}
                    >
                      <Button size="small" type="dashed" icon={<TableOutlined />}>
                        table
                      </Button>
                    </Popover>
                  ) : (
                    <Typography as="pre" type="body100" color="magenta500">
                      <Mark value={formattedValue} snippet={fieldConfig.searchValue} />
                    </Typography>
                  )}
                </Box>
                {!isTable && `${fieldValue}` !== `${formattedValue}` && (
                  <Box>
                    <Typography as="div" type="body100" color="gray600">
                      <Mark value={fieldValue} snippet={fieldConfig.searchValue} />
                    </Typography>
                  </Box>
                )}
              </>
            )}
            {fieldConfig.explanation && (
              <Box maxWidth={'500px'}>
                <Typography fontStyle="italic">{fieldConfig.explanation}</Typography>
              </Box>
            )}
          </Box>
        </Box>
        <Box className="actions">
          <Space size={4}>
            <Button type="text" size="small" onClick={() => editFieldCallback(fieldConfig, index)}>
              <EditOutlined style={{ fontSize: 12 }} />
            </Button>
            <Button type="text" size="small" onClick={() => duplicateFieldCallback(fieldConfig)}>
              <CopyOutlined style={{ fontSize: 12 }} />
            </Button>
            {includes(dependentFields, fieldConfig.name) ? (
              <Popover
                placement="right"
                getPopupContainer={getPopupContainer}
                overlayStyle={{
                  zIndex: overlayZindex,
                  minWidth: 300,
                }}
                // title={'Unable to remove field'}
                content={
                  <Box>
                    <Typography mb={1}>
                      This field config cannot be deleted because
                      <br />
                      it is used by the following other field(s)
                    </Typography>
                    {dependentFieldsForField.map((field) => (
                      <Typography as="pre" type="body50" key={field} color="gray600">
                        {field}
                      </Typography>
                    ))}
                  </Box>
                }
              >
                <Button type="text" size="small">
                  <DeleteOutlined disabled style={{ fontSize: 12, color: colors.gray500, cursor: 'not-allowed' }} />
                </Button>
              </Popover>
            ) : (
              <Popconfirm
                title="Remove field?"
                onConfirm={() => removeFieldCallback(index)}
                getPopupContainer={getPopupContainer}
                overlayStyle={{
                  zIndex: overlayZindex,
                }}
              >
                <Button type="text" size="small">
                  <DeleteOutlined style={{ fontSize: 12, color: colors.red500 }} />
                </Button>
              </Popconfirm>
            )}
            <Popover
              placement="right"
              autoAdjustOverflow={false}
              getPopupContainer={getPopupContainer}
              overlayStyle={{
                zIndex: overlayZindex,
                minWidth: 200,
              }}
              content={
                <>
                  <Box>
                    <Typography fontWeight={semiBoldWeight}>kind</Typography>
                    <Space size={2}>
                      {mapFieldKindToIcon(fieldConfig)}
                      <Typography as="pre" type="body200" color="gray600">
                        {fieldConfig.kind}
                      </Typography>
                    </Space>
                  </Box>
                  <Box mt={1}>
                    <Typography fontWeight={semiBoldWeight}>format</Typography>
                    <Space size={2}>
                      {mapFieldFormatToIcon(fieldConfig)}
                      <Typography as="pre" type="body200" color="gray600">
                        {fieldConfig.format}
                      </Typography>
                    </Space>
                  </Box>
                  <Divider style={{ margin: '8px 0' }} />
                  <Box mt={1}>
                    <Space size={2}>
                      <Typography fontWeight={semiBoldWeight}>depends on</Typography>
                    </Space>
                    {isEmpty(dependsOn) ? (
                      <Typography as="pre" type="body200" color="gray600">
                        []
                      </Typography>
                    ) : (
                      dependsOn.map((dep) => (
                        <Typography as="pre" key={dep} type="body200" color="gray600">
                          {dep}
                        </Typography>
                      ))
                    )}
                  </Box>
                  <Box mt={1}>
                    <Typography fontWeight={semiBoldWeight}>previous names</Typography>
                    {isEmpty(uniqPreviousNames) ? (
                      <Typography as="pre" type="body200" color="gray600">
                        []
                      </Typography>
                    ) : (
                      uniqPreviousNames.map((prevName) => (
                        <Typography as="pre" key={prevName} type="body200" color="gray600">
                          {prevName}
                        </Typography>
                      ))
                    )}
                  </Box>
                </>
              }
            >
              <Button type="text" size="small">
                <InfoCircleOutlined style={{ fontSize: 12 }} />
              </Button>
            </Popover>
          </Space>
        </Box>
      </Flex>
    </StyledOptionItem>
  )
}

export default FieldConfigItem
