import { WidgetProps } from '@rjsf/core'
import { Spin } from 'antd-next'
import { SearchSelect } from 'components/antd/staged'
import { useBlockOverlayContext } from 'components/BlockOverlay/BlockOverlayProvider'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import AddNewDropdown from 'components/shared/CompanyCategory/AddNewDropdown'
import DynamicFormContext from 'components/shared/DynamicForm/DynamicFormContext'
import { Typography } from 'components/shared/jawns'
import { JSONSchema7 } from 'json-schema'
import { isEmpty, isNil, isString, map, toNumber } from 'lodash'
import { SizeType } from 'node_modules/antd/lib/config-provider/SizeContext'
import { ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import GenericBlockService from 'util/blocks/GenericBlockService'
import { triggerSchemaAndDataUpdates } from 'util/blocks/helpers'
import { BlockService, FieldValue, SelectOption } from 'util/blocks/interfaces'

function SelectWidget({
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
}: WidgetProps) {
  const { asAdmin } = useContext(DynamicFormContext)

  const { enumOptions, enumDisabled } = options // we get the list of select Options from ui:options. Naming is confusing unfortunately
  const [selectOptions, setSelectOptionsImpl] = useState<SelectOption[]>(enumOptions as SelectOption[])
  const [selectedValue, setSelectedValue] = useState<FieldValue>(value)
  const [dropdownOpened, setDropdownOpened] = useState(false)
  const [error, setError] = useState<string>()

  // dynamic block service for loading on open
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()
  const service = useRef<BlockService>()
  const [loadingDropdown, setLoadingDropdown] = useState(false)
  const loadingDropdownRef = useRef<boolean>(false)
  const hasBlurred = useRef<boolean>(true)

  const selectRef = useRef<any>()

  const setSelectOptions = (newValue: SelectOption[]) => {
    setSelectOptionsImpl(newValue)
  }

  // if visible, this widget is being rendered inside of the BlockOverlay
  // if so, make the dropdown menu stick to the input, rather than body
  const { visible: popupContainerOnInput } = useBlockOverlayContext()

  useEffect(() => {
    setSelectedValue(processValue(value, schema))
  }, [value, schema])

  // Turns the value string from the input into the proper form
  // If type is 'number' and we return a string the json schema library will crash
  // This is unfortunately handled in the select component instead of in the library itself
  // NOTE: our implementation doesn't (yet) process types like arrays (multi select), booleans
  //       Their full implementation is here for reference
  //       https://github.com/rjsf-team/react-jsonschema-form/blob/master/packages/core/src/components/widgets/SelectWidget.js#L12
  const processValue = (rawValue: FieldValue, schema: JSONSchema7): FieldValue => {
    const { type } = schema

    if (isNil(rawValue)) {
      return ''
    }

    let value = rawValue as string | number

    if (type === 'number') {
      const num = toNumber(rawValue)
      if (isFinite(num)) {
        value = num
      }
    }

    return value
  }

  const onSelectChanged = useCallback(
    (rawValue: string) => {
      const newValue = processValue(rawValue, schema)
      setSelectedValue(newValue)
      onChange(newValue)

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
      onBlur(id, selectedValue)
    }
  }, [onBlur, onChange, selectedValue, formContext, options, id, multiple])

  const handleDeselect = () => {
    // force a focus on when a multi-selected item is removed.
    // if the user clicks directly on the 'x' of an item without opening the dropdown the
    // select will never get focus and we'll not be able to call to the backend on blur
    if (multiple) {
      selectRef.current.focus()
    }
  }

  //
  // Support adding new items - tags mode for multiple, custom dropdown for single
  //
  const allowNew = options.allows_new_items
  const mode = typeof multiple !== 'undefined' ? (allowNew ? 'tags' : 'multiple') : undefined

  const handleAddItem = useCallback(
    (newValue: string) => {
      const newItem = { value: newValue, label: newValue }
      const updateOptions = [newItem, ...selectOptions]
      setSelectOptions(updateOptions)
      onSelectChanged(newValue)
      setDropdownOpened(false)
    },
    [selectOptions, onSelectChanged]
  )

  const dropdownWithAddNew = useMemo(() => {
    return !multiple && allowNew
      ? (menu: ReactNode) => <AddNewDropdown menu={menu} onAddItem={handleAddItem} />
      : undefined
  }, [multiple, allowNew, handleAddItem])

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

        const newOptions = result?.data?.values
        setSelectOptions(newOptions)
      } catch (e) {
        setError((e as Error).message)
        setSelectOptions([])
      }

      setLoadingDropdown(false)
      loadingDropdownRef.current = false
    }
  }, [formContext, id, asAdmin])

  // Update dropdown options either by getting it from enumOptions or loading it from the backend
  useEffect(() => {
    const asyncCallback = async () => {
      // load the dropdown options if the enums are ever empty
      if (loadOnOpen && value && (enumOptions as SelectOption[]).length === 0) {
        await handleLoadDropdown()
      } else {
        // on enumOptions change need to update selectOptions
        setSelectOptions(enumOptions as SelectOption[])
      }
    }

    asyncCallback()
  }, [enumOptions, handleLoadDropdown, loadOnOpen, value])

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

  const selectOptionsWithState = map(selectOptions, (option) => ({
    label: option.label,
    key: String(option.value),
    value: option.value,
    disabled: !!(enumDisabled && (enumDisabled as string).indexOf(value) !== -1),
  }))

  // when searching in the select
  const notFoundContent = useMemo(() => {
    // if done loading and no error - but there aren't any options
    if (!loadingDropdown && !error && isEmpty(selectOptionsWithState)) {
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
  }, [loadOnOpen, error, loadingDropdown, selectOptionsWithState])

  return (
    <SearchSelect
      selectRef={selectRef}
      id={id}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      showSearch
      mode={mode}
      size={selectSize}
      value={selectedValue || (multiple ? [] : ' ')}
      loading={loadingDropdown}
      open={dropdownOpened}
      placeholder={placeholder || 'Select...'}
      onChange={onSelectChanged}
      onBlur={handleOnBlur}
      onFocus={
        onFocus &&
        (() => {
          onFocus(id, selectedValue)
        })
      }
      onDeselect={handleDeselect}
      onDropdownVisibleChange={handleDropdownChange}
      notFoundContent={notFoundContent}
      filterOption
      optionFilterProp="children" // filter by the option label, not the value when typing
      dropdownRender={dropdownWithAddNew}
      style={{ width: '100%' }}
      popupMatchSelectWidth={false}
      getPopupContainer={popupContainerOnInput ? (trigger) => trigger.parentNode : undefined} // make menu stick to select on scroll if in BlockOverlay
      options={selectOptionsWithState}
    />
  )
}

export default SelectWidget
