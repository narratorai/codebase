/* eslint-disable react/jsx-max-depth */
import { SearchOutlined } from '@ant-design/icons'
import { RefSelectProps } from 'antd/es/select'
import { Select, Tag } from 'antd-next'
import { SearchSelect, SearchSelectOptionProps } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import AssembledBadge from 'components/Narratives/shared/AssembledBadge'
import { isSharedTag } from 'components/shared/IndexPages/helpers'
import { Box, Flex, Typography } from 'components/shared/jawns'
import Mark from 'components/shared/Mark'
import ResourceStateIcon from 'components/shared/ResourceStateIcon'
import UserAvatar from 'components/shared/UserAvatar'
import { ICompany_User, IUser } from 'graph/generated'
import _ from 'lodash'
import React, { useCallback } from 'react'
import styled, { css } from 'styled-components'
import { colors } from 'util/constants'
import { timeFromNow } from 'util/helpers'

const { Option } = Select

const StyledSearchSelect = styled(SearchSelect).withConfig({
  shouldForwardProp: (prop) => !['withBorder'].includes(prop),
})<{ withBorder?: boolean }>`
  max-width: 100%;
  width: 100%;

  :hover,
  .antd5-select-open {
    background-color: ${colors.gray200};
    border-radius: 8px;
  }

  ${({ withBorder }) =>
    withBorder &&
    css`
      .antd5-select-selector {
        border: solid 1px ${colors.gray400} !important;
      }
    `}

  .antd5-select-selector .resource-tags-pills {
    display: none;
  }
`

interface Props {
  type?: 'dataset' | 'narrative' | 'dashboard' | 'transformation' | 'activity'
  placeholderText?: string
  options: SearchSelectOptionProps[]
  onSelect: (value: string) => void
  onSearchCallback?: (ids: string[], searchValue: string) => void
  shouldGetPopupContainer?: boolean
  selectRef?: RefSelectProps
  isGrouped?: boolean
  asAutoComplete?: boolean
  hideAvatarInOption?: boolean
  extraSelectProps?: {
    withBorder?: boolean
    withTallerMenu?: boolean
    value?: string
    allowClear?: boolean
  }
  extraProps?: Record<string, any>
}

// eslint-disable-next-line max-lines-per-function
const ResourceSearchSelect: React.FC<Props> = ({
  type,
  onSelect,
  onSearchCallback,
  options,
  placeholderText = 'Search',
  shouldGetPopupContainer = true,
  selectRef,
  isGrouped,
  asAutoComplete,
  hideAvatarInOption,
  extraSelectProps = {},
  extraProps = {},
}) => {
  const company = useCompany()
  const { withTallerMenu, ...restExtraSelectProps } = extraSelectProps

  const handleCreateResourceOptionContent = useCallback(
    ({ searchValue, option }: { searchValue: string; option: SearchSelectOptionProps }) => {
      // different resources refer to this as state/status
      // i.e. dataset = "status" and narrative = "state"
      const resourceState = !option.hideResourceStateIcon && (option.resource.state || option.resource.status)

      return (
        <Option key={option.value} label={option.label} value={option.value}>
          <Flex justifyContent="space-between" alignItems="center">
            <Flex>
              <Flex alignItems="center">
                {!hideAvatarInOption && (
                  <Box mr={2}>
                    <UserAvatar
                      user={option?.resource.user as IUser}
                      companyUser={option.resource?.user?.company_users?.[0] as ICompany_User}
                      showName={false}
                      showTooltip={false}
                      size="small"
                    />
                  </Box>
                )}

                <Typography type="body50">
                  <Mark value={option.label} snippet={searchValue} />
                </Typography>

                {!_.isEmpty(resourceState) && (
                  <Box ml={1}>
                    <ResourceStateIcon state={resourceState} hideTooltip />
                  </Box>
                )}
              </Flex>

              {/* Show shared tags - unless is selected */}
              <Flex flexWrap="wrap" style={{ rowGap: '8px' }} ml={2} className="resource-tags-pills">
                {_.compact(
                  _.map(option.resource.tags, (tag) => {
                    if (isSharedTag(tag)) {
                      return (
                        <Tag key={tag.id} color={tag?.company_tag?.color || 'default'}>
                          <Typography
                            fontSize="12px"
                            lineHeight="20px"
                            title={
                              tag?.company_tag?.tag?.length && tag?.company_tag?.tag?.length > 24
                                ? tag?.company_tag?.tag
                                : undefined
                            }
                          >
                            {_.truncate(tag?.company_tag?.tag, { length: 15 })}
                          </Typography>
                        </Tag>
                      )
                    }

                    return null
                  })
                )}
              </Flex>
            </Flex>

            <Flex alignItems="center">
              {option?.resource?.last_config_updated_at && (
                <Box px={1}>
                  <Typography type="body300" color="gray500">
                    updated {timeFromNow(option?.resource?.last_config_updated_at, company.timezone)}
                  </Typography>
                </Box>
              )}

              {/* show status badge if exists */}
              {(type === 'narrative' || type === 'dashboard') && <AssembledBadge narrative={option.resource} />}
            </Flex>
          </Flex>
        </Option>
      )
    },
    [company.timezone, hideAvatarInOption, type]
  )

  return (
    <StyledSearchSelect
      data-test="resource-search-select"
      options={options || []}
      onSelect={onSelect}
      onSearchCallback={onSearchCallback}
      asAutoComplete={asAutoComplete}
      size="large"
      omitKeysFromSearch={['key']}
      isGrouped={isGrouped}
      bordered={false}
      suffixIcon={null} // hide arrow
      popupMatchSelectWidth={false}
      createOptionContent={handleCreateResourceOptionContent}
      listHeight={withTallerMenu && (options.length || 0) > 20 ? 560 : 256}
      placeholder={
        <Flex style={{ fontSize: '18px' }}>
          <Box mr={1}>
            <SearchOutlined style={{ color: colors.gray500 }} />
          </Box>
          {placeholderText}
        </Flex>
      }
      getPopupContainer={
        shouldGetPopupContainer ? (trigger: HTMLElement) => trigger.parentNode as HTMLElement : undefined
      }
      // @ts-ignore
      selectRef={selectRef}
      // make dropdown taller if there are many datasets
      {...restExtraSelectProps}
      {...extraProps}
    />
  )
}

export default ResourceSearchSelect
