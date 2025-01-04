import { WidgetProps } from '@rjsf/core'
import { Spin, TreeSelect } from 'antd-next'
import { useBlockOverlayContext } from 'components/BlockOverlay/BlockOverlayProvider'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import DynamicFormContext from 'components/shared/DynamicForm/DynamicFormContext'
import { Typography } from 'components/shared/jawns'
import { isEmpty, isString } from 'lodash'
import { SizeType } from 'node_modules/antd/lib/config-provider/SizeContext'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import GenericBlockService from 'util/blocks/GenericBlockService'
import { triggerSchemaAndDataUpdates } from 'util/blocks/helpers'
import { BlockService } from 'util/blocks/interfaces'

import { cleanTreeData, TreeItem } from './helpers'

const TreeSelectWidget = ({
  schema,
  id,
  options, // the ui:options list
  value,
  disabled,
  readonly,
  placeholder,
  multiple,
  autofocus,
  formContext,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps) => {
  const { asAdmin } = useContext(DynamicFormContext)
  const unfilteredTreeData = options?.tree as TreeItem[]
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: schema form doesn't expect enum to be on items...but that's how it's passed in multiple select mode
  const enumValues = multiple ? schema?.items?.enum : schema.enum

  const [treeData, setTreeData] = useState<TreeItem[] | undefined>(
    cleanTreeData({ treeData: unfilteredTreeData, enumValues })
  )
  const [selectedValue, setSelectedValue] = useState(value)
  const [dropdownOpened, setDropdownOpened] = useState(false)
  const [error, setError] = useState<string>()

  // dynamic block service for loading on open
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()
  const service = useRef<BlockService>()
  const [loadingDropdown, setLoadingDropdown] = useState(false)
  const loadingDropdownRef = useRef<boolean>(false)
  const hasBlurred = useRef<boolean>(true)

  // if visible, this widget is being rendered inside of the BlockOverlay
  // if so, make the dropdown menu stick to the input, rather than body
  const { visible: popupContainerOnInput } = useBlockOverlayContext()

  useEffect(() => {
    setSelectedValue(value)
  }, [value])

  const onSelectChanged = useCallback(
    (value: string) => {
      setSelectedValue(value)
      onChange(value)

      if (!multiple) {
        hasBlurred.current = true // set this here because when we trigger an update it looks like the form reloaded

        // For multi-select wait until onblur to update the backend -- otherwise you can't select multiple items
        // Handle options.process_data and options.update_schema
        triggerSchemaAndDataUpdates(formContext, options, id)
      }
    },
    [onChange, formContext, options, id, multiple, schema]
  )

  const handleOnBlur = useCallback(() => {
    hasBlurred.current = true

    if (multiple) {
      // Handle options.process_data and options.update_schema
      triggerSchemaAndDataUpdates(formContext, options, id)
      onChange(selectedValue)
    }

    if (onBlur) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: schema form doesn't accept array as value?
      onBlur(id, selectedValue)
    }
  }, [onBlur, onChange, selectedValue, formContext, options, id, multiple])

  const handleOnFocus = useCallback(() => {
    if (onFocus) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: schema form doesn't accept array as value?
      onFocus(id, selectedValue)
    }
  }, [onFocus, selectedValue, id])

  //
  // Load options on open
  //
  const loadOnOpen = options.load_values

  useEffect(() => {
    if (loadOnOpen && !service.current) {
      service.current = new GenericBlockService({ getToken, company })
    }
  }, [getToken, company, loadOnOpen])

  const handleLoadDropdown = useCallback(async () => {
    if (!loadingDropdownRef.current && service.current) {
      loadingDropdownRef.current = true
      setLoadingDropdown(true)

      try {
        const result = await service.current.loadDropdown(
          formContext.schemaSlug,
          {
            field_slug: id,
            data: formContext.getFormData(),
          },
          asAdmin
        )

        const newOptions = result?.data?.values as TreeItem[]
        setTreeData(cleanTreeData({ treeData: newOptions, enumValues }))
      } catch (e) {
        setError((e as Error).message)
        setTreeData([])
      }

      setLoadingDropdown(false)
      loadingDropdownRef.current = false
    }
  }, [formContext, id, asAdmin, enumValues])

  // Update dropdown options either by getting it from treeOptions or loading it from the backend
  useEffect(() => {
    // load the dropdown options if treeOptions are ever empty
    if (loadOnOpen && value && isEmpty(unfilteredTreeData)) {
      handleLoadDropdown()
    } else {
      // on treeOptions change need to update treeData
      setTreeData(cleanTreeData({ treeData: unfilteredTreeData, enumValues }))
    }
  }, [unfilteredTreeData, handleLoadDropdown, loadOnOpen, value, enumValues])

  const handleDropdownChange = async (opened: boolean) => {
    setDropdownOpened(opened)

    // only run this once while the form is interactive -- once we blur we can run it again
    if (loadOnOpen && opened && hasBlurred.current) {
      hasBlurred.current = false
      await handleLoadDropdown()
    }
  }

  // set select's size from Blocks ui:options if it is sent
  // (otherwise default to antd's default 'middle')
  const selectSize = (options?.size && isString(options?.size) ? options.size : 'middle') as SizeType

  // when searching in the select
  const notFoundContent = useMemo(() => {
    // if done loading and no error - but there aren't any options
    if (!loadingDropdown && !error && isEmpty(treeData)) {
      // show default "No data"
      return undefined
    }

    // handle error and loading state for load on open
    if (loadOnOpen) {
      if (error) {
        return <Typography>{error}</Typography>
      }

      return <Spin spinning={loadingDropdown} size="small" />
    }

    // there are options, but nothing is matching
    // return null to show show nothing in the dropdown
    // (otherwise it would say "No Data")
    return null
  }, [loadOnOpen, error, loadingDropdown, treeData])

  return (
    <TreeSelect
      id={id}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      multiple={multiple}
      showSearch
      treeDefaultExpandAll
      allowClear
      size={selectSize}
      // FIXME
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: antd's documentation says they should be able to accept string[]
      value={selectedValue || (multiple ? [] : ' ')}
      loading={loadingDropdown}
      open={dropdownOpened}
      placeholder={placeholder || 'Select...'}
      onChange={onSelectChanged}
      onBlur={handleOnBlur}
      onFocus={handleOnFocus}
      onDropdownVisibleChange={handleDropdownChange}
      notFoundContent={notFoundContent}
      style={{ width: '100%' }}
      popupMatchSelectWidth={false}
      getPopupContainer={popupContainerOnInput ? (trigger) => trigger.parentNode : undefined} // make menu stick to select on scroll if in BlockOverlay
      treeData={treeData}
      treeNodeFilterProp="title"
    />
  )
}

export default TreeSelectWidget
