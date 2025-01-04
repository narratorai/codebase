import { EditOutlined, PlusOutlined, RedoOutlined } from '@ant-design/icons'
import type { InputRef } from 'antd/lib/input'
import { Button, Dropdown, Input, Space, Tooltip } from 'antd-next'
import { useBlockOverlayContext } from 'components/BlockOverlay/BlockOverlayProvider'
import { Box, Flex, Typography } from 'components/shared/jawns'
import Fuse from 'fuse.js'
import { compact, filter, isEmpty, isNull, isObject, isString, map } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useField, useForm } from 'react-final-form'
import styled from 'styled-components'
import { findAllBlockContentByType, getAllDependentFields, getDependentFieldsForField } from 'util/blocks/helpers'
import { BlockContent, FieldConfig, GenericBlockOption, JsonContent } from 'util/blocks/interfaces'
import { colors } from 'util/constants'
import useOnClickOutside from 'util/useOnClickOutside'
import usePrevious from 'util/usePrevious'

import { useBuildNarrativeContext } from './BuildNarrativeProvider'
import FieldConfigItem from './FieldConfigItem'

const FIELDS_DROPDOWN_ID = 'fieldsDropdown'

const StyledFieldsBox = styled(Box)`
  position: absolute;
  left: 16px;
  top: 0;
  min-width: 800px;
  max-height: 70vh;
  overflow: auto;
  will-change: opacity, transform;
  transition: all 0.1s ease-in-out;
`
interface Props {
  handleRefreshNarrative: () => void
  refreshing: boolean
  refreshed: boolean
}

const FieldConfigs = ({ refreshed, refreshing, handleRefreshNarrative }: Props) => {
  const { initialize } = useForm()
  const { handleOpenOverlay, visible: overlayOpen } = useBlockOverlayContext()
  const { setFieldConfigOverlayVisible, doAssembleFields, assembledFieldsResponse, blockOptions } =
    useBuildNarrativeContext()
  const fieldBlocks = blockOptions?.field_blocks as GenericBlockOption[]
  const basicFieldBlocks = filter(fieldBlocks, (block) => !block.advanced)
  const advancedFieldBlocks = filter(fieldBlocks, (block) => !!block.advanced)

  const fields = assembledFieldsResponse?.fields

  const {
    input: { value: fieldConfigs = [], onChange: onChangeFieldConfig },
  } = useField<FieldConfig[]>('field_configs', {
    subscription: { value: true },
    format: (value) => {
      try {
        return isString(value) ? JSON.parse(value) : value
      } catch (_err) {
        return value
      }
    },
  })

  const {
    input: { value: dynamicFilters },
  } = useField('dynamic_filters', { subscription: { value: true } })

  // on successful refresh
  // re-initialize form values with refresh response
  const prevRefreshed = usePrevious(refreshed)
  useEffect(() => {
    if (!prevRefreshed && refreshed && assembledFieldsResponse) {
      initialize(assembledFieldsResponse)
    }
  }, [prevRefreshed, refreshed, assembledFieldsResponse, initialize])

  const [searchActive, setSearchActive] = useState(false)
  const [fieldIndex, setFieldIndex] = useState<number>()
  const [currentFieldConfig, setCurrentFieldConfig] = useState<FieldConfig>()

  const [showResults, setShowResults] = useState(false)
  const [filteredFieldConfigs, setFilteredFieldConfigs] = useState<(FieldConfig & { noMatch?: boolean })[]>()

  // We pass this down into the `FieldConfigItem`
  // child component so all of the popups and popovers
  // work properly and don't register a "click outside"
  const containerRef = useRef<HTMLDivElement | null>(null)

  // get a ref to the search input so we can handle
  // the "escape" key to hide the results dropdown
  const inputRef = useRef<InputRef | null>(null)

  // We keep track of dependentFields so we don't delete them (would break other fields that depend on them)
  const dependentFields = getAllDependentFields(fieldConfigs)

  // useMemo to avoid re-renders
  const fuseSearch = useMemo(() => {
    const list = fieldConfigs?.map((fc) => {
      const fieldValue = isNull(fields?.[fc.name]) ? '' : fields?.[fc.name]
      const assembledFieldValue = isObject(fieldValue) ? JSON.stringify(fieldValue) : `${fieldValue}`

      return {
        name: fc.name,
        assembledValue: assembledFieldValue,
      }
    })

    const fuseOptions = {
      includeScore: true,
      shouldSort: true,
      includeMatches: true,
      threshold: 0.1,
      ignoreLocation: true,
      useExtendedSearch: true,
      keys: ['name', 'assembledValue'],
    }

    const fuseIndex = Fuse.createIndex(fuseOptions.keys, list)
    return new Fuse(list, fuseOptions, fuseIndex)
  }, [fieldConfigs, fields])

  const handleSearch = useCallback(
    (value: string) => {
      if (isEmpty(value)) {
        setFilteredFieldConfigs(fieldConfigs)
        return
      }

      const results = fuseSearch?.search(value)
      const filteredResults = fieldConfigs?.map((fc) => {
        return {
          ...fc,
          searchValue: value,
          // We use this to show/hide the resulting row (vs not rendering it completely).
          // The reason we do this is b/c we want to maintain the index value for each
          // row when adding/removing fields
          noMatch: !results?.map((res) => res.item.name).some((name) => name === fc.name),
        }
      })

      const scrollContainer = document.getElementById(FIELDS_DROPDOWN_ID)

      scrollContainer?.scroll({
        top: 0,
      })

      setFilteredFieldConfigs(filteredResults)
    },
    [fieldConfigs, fuseSearch]
  )

  const submitCallback = useCallback(
    ({ content }: { content: BlockContent[] }) => {
      if (!content) return null

      // Find and add the json response(s) (not the markdown response for preview)
      const jsonResponses = findAllBlockContentByType<JsonContent[]>('json', content)
      const newFieldConfigs = (map(jsonResponses, 'value') || []) as FieldConfig[]

      // Copy field configs and mutate the copy
      let updatedFieldConfigs = [...(fieldConfigs || [])]

      // when "editing", we have `fieldIndex`,
      // so we want to replace the exisint field
      if (fieldIndex || fieldIndex === 0) {
        // fieldConfig at fieldIndex gets replaced by first newFieldConfigs
        // all the other newFieldConfigs get inserted after replaced field
        updatedFieldConfigs.splice(fieldIndex, 1, ...(newFieldConfigs as FieldConfig[]))
      } else {
        // otherwise, we are creating "new" or "duplicating",
        // so we just add it to the existing fields
        updatedFieldConfigs = [...newFieldConfigs, ...fieldConfigs]
      }

      // Update FieldConfigs (left side JSON)
      onChangeFieldConfig(updatedFieldConfigs)

      // trigger compile fields (preview on right side JSON)
      doAssembleFields({
        config: {
          field_configs: fieldConfigs,
          field_configs_changed: newFieldConfigs,
          fields,
          dynamic_filters: dynamicFilters,
        },
      })
    },
    [fieldIndex, fields, fieldConfigs, dynamicFilters, onChangeFieldConfig, doAssembleFields]
  )

  const openCreateNewOverlay = useCallback(
    ({ key }: any) => {
      const fieldBlock = fieldBlocks?.find((fb) => fb.slug === key)
      const version = fieldBlock?.version || 1

      handleOpenOverlay({
        formSlug: fieldBlock?.slug,
        submitCallback: { callback: submitCallback },
        closeOnSubmit: true,
        showPreview: true,
        justify: 'center',
        version,
        fields,
        previewTypes: ['markdown'],
      })
    },
    [fields, fieldBlocks, submitCallback, handleOpenOverlay]
  )

  const openEditOverlay = useCallback(
    (field: FieldConfig) => {
      // Hacky: formattedValue is used to convert string values into the accepted content format (for fields that are input/equation)
      // Newly created field configs will be in the correct format (backwards compatability below)
      const formattedValue = isString(field.value) && field.kind === 'value' ? { content: field.value } : field.value

      // TODO: just use `field.kind` as `formSlug` once Mavis is fixed and
      // accepts `value` as formSlug
      const formSlug = field.kind === 'value' ? 'value_field' : field.kind

      const formData = {
        ...field,
        value: formattedValue,
      }

      const fieldBlock = fieldBlocks?.find((fb) => fb.slug === field.kind)
      const version = fieldBlock?.version || 1

      handleOpenOverlay({
        formSlug,
        version,
        submitCallback: { callback: submitCallback },
        closeOnSubmit: true,
        showPreview: true,
        justify: 'center',
        formData,
        fields,
        previewTypes: ['markdown'],
      })
    },
    [fields, fieldBlocks, handleOpenOverlay, submitCallback]
  )

  const escFunction = useCallback(
    (event: KeyboardEvent) => {
      // hide results and clear out input
      // if/when user hits the "escape" key
      if (event.keyCode === 27) {
        setShowResults(false)
        setSearchActive(false)

        handleSearch('')
      }
    },
    [handleSearch]
  )

  const handleEditField = (fieldConfig: FieldConfig, index: number) => {
    setFieldIndex(index)
    setCurrentFieldConfig(fieldConfig)
  }

  const handleDuplicateField = (fieldConfig: FieldConfig) => {
    const duplicatedField = {
      ...fieldConfig,
      name: `${fieldConfig.name}_copy`,
      previous_names: [],
    }

    setFieldIndex(undefined)
    setCurrentFieldConfig(duplicatedField)
  }

  const handleRemoveField = (index: number) => {
    const updatedFieldConfigs = [...fieldConfigs]
    const removed = updatedFieldConfigs.splice(index, 1)

    onChangeFieldConfig(updatedFieldConfigs)

    doAssembleFields({
      remove: true,
      config: {
        field_configs: fieldConfigs,
        field_configs_changed: removed,
        fields,
        dynamic_filters: dynamicFilters,
      },
    })
  }

  // used to hide the fields dropdown if/when
  // user clicks outside of the results container.
  useOnClickOutside(containerRef, (event) => {
    // if user clicks anywhere outside of the results contianer
    // AND the block overlay isn't visible/open, we hide results.
    //
    // The reason we also check for `overlayOpen`, is so it is easier
    // to interact with the results container and not have to keep
    // opening it up by focusing in on the search bar
    if (event.target !== inputRef.current?.input && !overlayOpen) {
      setShowResults(false)
    }
  })

  useEffect(() => {
    document.addEventListener('keydown', escFunction, false)

    return () => {
      document.removeEventListener('keydown', escFunction, false)
    }
  }, [escFunction])

  // since `fieldConfigs` starts out empty, we need
  // this useEffect to set `filteredFieldConfigs`
  // once `fieldConfigs` have loaded
  useEffect(() => {
    if (!isEmpty(fieldConfigs)) {
      setFilteredFieldConfigs(fieldConfigs)
    }
  }, [fieldConfigs])

  // `fieldIndex` and `currentFieldConfig` must be defined before
  // opening overlay with `submitCallback`
  useEffect(() => {
    if (currentFieldConfig) {
      openEditOverlay(currentFieldConfig)
      setFieldIndex(undefined)
      setCurrentFieldConfig(undefined)
    }
  }, [fieldIndex, currentFieldConfig, openEditOverlay])

  // If we have results, show the Field Configs dropdown
  useEffect(() => {
    setFieldConfigOverlayVisible(showResults)
  }, [setFieldConfigOverlayVisible, showResults])

  const menuItems = compact([
    ...basicFieldBlocks.map((fb) => ({
      key: fb.slug,
      onClick: openCreateNewOverlay,
      label: fb.title,
    })),

    !isEmpty(advancedFieldBlocks)
      ? {
          key: 'advanced',
          label: 'Advanced',
          children: advancedFieldBlocks.map((fb) => ({
            key: fb.slug,
            onClick: openCreateNewOverlay,
            label: fb.title,
          })),
        }
      : null,
  ])

  return (
    <>
      <Flex justifyContent="flex-start" alignItems="center" px={3} py={1}>
        <Space>
          {searchActive ? (
            <Input.Search
              ref={inputRef}
              allowClear
              autoFocus
              size="small"
              placeholder="Search Fields"
              onChange={(event) => handleSearch(event.target.value)}
              onBlur={(event) => handleSearch(event.target.value)}
              onFocus={() => setShowResults(true)}
            />
          ) : (
            <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => setSearchActive(true)}>
              Variables
            </Button>
          )}

          <Dropdown
            menu={{
              items: menuItems,
            }}
          >
            <Button size="small">
              <PlusOutlined />
            </Button>
          </Dropdown>

          <Tooltip
            title={
              <Box>
                <Typography>Refresh data</Typography>
                <Typography>1. Recompiles all fields </Typography>
                <Typography>2. Updates the Narrative form and preview with any necessary field changes</Typography>
              </Box>
            }
          >
            <Button
              disabled={refreshing}
              size="small"
              onClick={handleRefreshNarrative}
              icon={
                <Flex justifyContent="center">
                  <RedoOutlined spin={refreshing} style={{ color: colors.green500 }} />
                </Flex>
              }
            ></Button>
          </Tooltip>
        </Space>
      </Flex>
      <div ref={containerRef}>
        {(filteredFieldConfigs || []).length > 0 && (
          <StyledFieldsBox
            id={FIELDS_DROPDOWN_ID}
            // use the antd select dropdown class
            // to make the fields dropdown inherit
            // the same look and feel
            className="antd5-select-dropdown"
            style={{
              pointerEvents: showResults ? 'all' : 'none',
              opacity: showResults ? 1 : 0,
              transform: `translateY(${showResults ? '116px' : '75px'})`,
            }}
          >
            {filteredFieldConfigs?.map((fieldConfig, idx) => {
              const dependentFieldsForField = getDependentFieldsForField({ fieldConfig, fieldConfigs: fieldConfigs })

              return (
                <FieldConfigItem
                  key={`${fieldConfig.name}`}
                  index={idx}
                  // pass in the container element so we can handle
                  // the "click outside" functionality properly
                  container={containerRef?.current}
                  fieldConfig={fieldConfig}
                  dependentFields={dependentFields}
                  dependentFieldsForField={dependentFieldsForField}
                  editFieldCallback={handleEditField}
                  duplicateFieldCallback={handleDuplicateField}
                  removeFieldCallback={handleRemoveField}
                  style={{
                    display: fieldConfig?.noMatch ? 'none' : 'block',
                  }}
                />
              )
            })}
          </StyledFieldsBox>
        )}
      </div>
    </>
  )
}

export default FieldConfigs
