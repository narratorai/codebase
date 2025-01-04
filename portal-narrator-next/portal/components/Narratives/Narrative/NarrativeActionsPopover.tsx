import { CaretDownFilled, InfoCircleFilled, PlusOutlined } from '@ant-design/icons'
import { Badge, List, Popover, Radio, Spin, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import NarrativeActionModal from 'components/Narratives/Narrative/NarrativeActionModal'
import { Box, Flex, Typography } from 'components/shared/jawns'
import {
  IGetNarrativeBySlugQuery,
  IListNarrativeActionsSubscription,
  useListNarrativeActionsSubscription,
} from 'graph/generated'
import React, { useState } from 'react'
import styled from 'styled-components'
import { colors, semiBoldWeight } from 'util/constants'
import { timeStampDate } from 'util/helpers'

const StyledListItem = styled(List.Item)`
  cursor: pointer;
  transition: all ease-in-out 300ms;

  .info-icon {
    transition: color ease-in-out 300ms;
  }

  &:hover {
    .info-icon {
      color: ${colors.green500} !important;
    }
  }
`

interface Props {
  narrative: IGetNarrativeBySlugQuery['narrative'][0]
}

const NarrativeActionsPopover = ({ narrative }: Props) => {
  const company = useCompany()

  const [selectedAction, setSelectedAction] =
    useState<IListNarrativeActionsSubscription['narrative'][0]['actions'][0]>()
  const [actionModalVisible, setActionModalVisible] = useState(false)

  const { data: actionsData, loading: actionsLoading } = useListNarrativeActionsSubscription({
    variables: {
      narrative_slug: narrative.slug,
      company_id: company?.id,
    },
  })

  const narrativeActions = actionsData?.narrative[0]?.actions || []

  return (
    <Box style={{ minWidth: '111px' }}>
      <Radio.Group size="small" buttonStyle="solid">
        <Radio.Button>
          <Popover
            content={
              <Spin spinning={actionsLoading}>
                <List
                  style={{
                    backgroundColor: 'white',
                  }}
                  size="small"
                  footer={null}
                  bordered
                  dataSource={narrativeActions}
                  renderItem={(item) => (
                    <StyledListItem
                      onClick={() => {
                        setSelectedAction(item)
                        setActionModalVisible(true)
                      }}
                    >
                      <Flex justifyContent="space-between" alignItems="center" flex={1}>
                        <Box flexGrow={1} mr={2}>
                          <Typography type="body300" color="gray500">
                            {timeStampDate(item.happened_at)}
                          </Typography>
                          <Badge
                            status="success"
                            text={
                              <Typography as="span" fontWeight={semiBoldWeight}>
                                {item.name}
                              </Typography>
                            }
                          />
                        </Box>
                        <Tooltip
                          placement="right"
                          color={colors.green500}
                          title={
                            <>
                              <Box mb={1}>
                                <Typography type="body300" color="gray100">
                                  {timeStampDate(item.happened_at)}
                                </Typography>
                                <Typography fontWeight={semiBoldWeight}>{item.name}</Typography>
                              </Box>
                              <Typography>{item.description}</Typography>
                            </>
                          }
                        >
                          <InfoCircleFilled
                            className="info-icon"
                            style={{
                              color: colors.gray400,
                            }}
                          />
                        </Tooltip>
                      </Flex>
                    </StyledListItem>
                  )}
                />
              </Spin>
            }
          >
            <Flex alignItems="center">
              Actions
              <CaretDownFilled style={{ marginLeft: '8px' }} />
            </Flex>
          </Popover>
        </Radio.Button>

        <Radio.Button
          onClick={() => {
            setSelectedAction(undefined)
            setActionModalVisible(true)
          }}
        >
          <PlusOutlined />
        </Radio.Button>
      </Radio.Group>
      <NarrativeActionModal
        action={selectedAction}
        narrativeId={narrative.id}
        visible={actionModalVisible}
        setVisible={setActionModalVisible}
      />
    </Box>
  )
}

export default NarrativeActionsPopover
