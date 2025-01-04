import { SearchProps } from 'antd/es/input'
import { RadioChangeEvent } from 'antd/lib/radio/interface'
import { Button, Card, Input, Radio } from 'antd-next'
import { ProtectedRoleLink } from 'components/context/auth/protectedComponents'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { debounce, isEmpty, map, noop } from 'lodash'
import React, { MouseEventHandler, useEffect, useRef } from 'react'

import { GROUPING_RECENT } from './services/constants'
import { IGroupConfig } from './services/helpers'

const { Search } = Input

interface Props {
  title?: string
  header?: React.ReactNode
  ctaTo?: string
  ctaLabel?: string
  ctaProtected?: boolean
  ctaOnClick?: MouseEventHandler
  ctaSize?: 'large' | 'middle' | 'small'
  // ctaOverride is a custom element used instead of default behavior
  // (all other cta props will be ignored i.e. ctaTo, ctaLabel...)
  ctaOverride?: React.ReactNode
  onRadioToggle?(key: string): void
  selectedGroup?: string
  groupConfigs?: IGroupConfig[]
  extra?: React.ReactNode
  onSearchChange?: React.Dispatch<React.SetStateAction<string>>
  searchProps?: SearchProps
  searchExtra?: React.ReactNode
  showSearch?: boolean
  isSidebar?: boolean
  raised?: boolean
  'data-public'?: boolean
}

const GroupedIndexHeader = ({
  title,
  header,
  ctaTo,
  ctaLabel,
  ctaProtected,
  ctaOnClick = noop,
  ctaSize = 'middle',
  ctaOverride,
  onRadioToggle,
  selectedGroup,
  groupConfigs,
  extra,
  onSearchChange,
  searchProps = {},
  searchExtra,
  showSearch = true,
  isSidebar = false,
  raised = false,
  ...props
}: Props) => {
  const debouncedSetSearchChange = useRef<any>(null)

  const radioGroupOptions = groupConfigs ? [...groupConfigs, { label: 'New', group: GROUPING_RECENT }] : []

  const WrapperElement = raised ? Card : Box

  const onToggleGroup = (event: RadioChangeEvent) => {
    if (onRadioToggle) {
      onRadioToggle(event.target.value)
    }
  }

  const onChange = (event: any) => {
    debouncedSetSearchChange.current(event.target?.value)
  }

  useEffect(() => {
    if (showSearch && onSearchChange) {
      debouncedSetSearchChange.current = debounce(onSearchChange, 500)
    }
  }, [showSearch, onSearchChange])

  return (
    <Box p={3} data-public={props['data-public']}>
      <Box>
        {header}

        {!isSidebar && (
          <Flex justifyContent="space-between" alignItems="center" mt={1}>
            <Typography type="title300">{title}</Typography>

            {ctaOverride && ctaOverride}

            {/* Do not show default behavior below if ctaOverride is present */}
            {!ctaOverride && ctaTo && ctaLabel && ctaProtected && (
              <Box onClick={ctaOnClick}>
                <ProtectedRoleLink to={ctaTo}>
                  <Button type="primary" size={ctaSize} data-test="primary-cta">
                    {ctaLabel}
                  </Button>
                </ProtectedRoleLink>
              </Box>
            )}
            {!ctaOverride && ctaTo && ctaLabel && !ctaProtected && (
              <Link unstyled to={ctaTo} onClick={ctaOnClick}>
                <Button type="primary" size={ctaSize} data-test="primary-cta">
                  {ctaLabel}
                </Button>
              </Link>
            )}
          </Flex>
        )}
      </Box>

      {extra && (
        <Box my={2} style={{ maxHeight: '320px', overflowY: 'auto' }}>
          {extra}
        </Box>
      )}

      {showSearch && (
        <WrapperElement
          style={{
            boxShadow: raised ? 'rgba(0, 0, 0, 0.1) -5px 6px 15px -9px, rgba(0, 0, 0, 0.05) 5px 6px 15px -9px' : 'none',
          }}
        >
          <Box>
            <Search
              data-test="group-index-header-search"
              allowClear
              placeholder="Search..."
              size="large"
              style={{ width: '100%' }}
              {...searchProps}
              onChange={onChange}
            />
          </Box>
          {!isEmpty(radioGroupOptions) && (
            <Box mt={2} data-test="index-header-group-ctas">
              <Radio.Group onChange={onToggleGroup} value={selectedGroup} buttonStyle="solid">
                {map(radioGroupOptions, (groupOption) => (
                  <Radio.Button key={groupOption.group} value={groupOption.group}>
                    {groupOption.label}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Box>
          )}

          {searchExtra && <Box mt={3}>{searchExtra}</Box>}
        </WrapperElement>
      )}
    </Box>
  )
}

export default GroupedIndexHeader
