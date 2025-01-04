import { AutoComplete as AntdAutoComplete, Select as AntdSelect } from 'antd-next'
import { RefSelectProps, SelectProps as AntdSelectProps } from 'antd-next/es/select'
import Mark from 'components/shared/Mark'
import Fuse from 'fuse.js'
import { compact, Dictionary, filter, groupBy, includes, isEmpty, isString, map } from 'lodash'
import { DefaultOptionType } from 'rc-select/lib/Select'
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import usePrevious from 'util/usePrevious'

const { Option, OptGroup } = AntdSelect

export type SearchSelectOptionProps =
  | DefaultOptionType
  | (DefaultOptionType & {
      // optGroupBy is the value used when 'isGrouped' flag is present
      optGroupBy?: string
      groupLabelPrefix?: React.ReactElement
      // extraSearchValues is space separated string of values to search
      // useful for searching extra meta data in an option
      // (i.e. column values in AdditionalColumnContent)
      extraSearchValues?: string
      // we add meta data to options to show additional info
      //  outside of key/value/label in the option
      [key: string]: any
    })

interface CreateSearchSelectOptionListProps {
  options: SearchSelectOptionProps[]
  foundValuesIds?: string[]
  // create more complex Options than mere label/value
  // (include meta data, icons...)
  createOptionContent?: ({
    option,
    searchValue,
  }: {
    option: SearchSelectOptionProps
    searchValue: string
  }) => React.ReactNode
  foundValues: { id: string; index: number }[]
  searchValue: string
}

// can't do FC b/c you have to wrap the return in a Fragment
// which disrupts how Antd select handles children
const createSearchSelectOptionList = ({
  options,
  // foundValuesIds are only passed for groupedOptions lookup
  foundValuesIds,
  createOptionContent,
  foundValues,
  searchValue,
}: CreateSearchSelectOptionListProps) => {
  let items = options
  if (!isEmpty(foundValues)) {
    // not grouped options
    if (!foundValuesIds) {
      items = compact(foundValues.map((val) => options[val.index]))
    } else {
      // for grouped options, find values from id b/c
      // fuse returns index found of flat non-grouped options
      // which would get lost here as "options" represent a group of options
      // (not all options)
      items = filter(options, (opt) => includes(foundValuesIds, opt.value))
    }
  }

  return items.map((option) => {
    // some options have more content than a mere label
    // if createOptionContent is passed, construct the option
    // from this function instead of the default below
    if (createOptionContent) {
      return createOptionContent({ option, searchValue })
    }

    // default: used when no createOptionContent is passed
    return (
      <Option label={option.label} value={option.value} key={`${option.value}_${option.key}`}>
        {includes(
          foundValues.map((val) => val.id),
          option.value
        ) ? (
          <Mark value={option.label} snippet={searchValue} />
        ) : (
          option.label
        )}
      </Option>
    )
  })
}

interface BuildOptionsProps extends CreateSearchSelectOptionListProps {
  isGrouped?: boolean
  groupedOptions?: Dictionary<SearchSelectOptionProps[]>
}

const buildOptions = ({
  isGrouped,
  groupedOptions,
  createOptionContent,
  foundValues,
  searchValue,
  foundValuesIds,
  options,
}: BuildOptionsProps) => {
  return isGrouped && !isEmpty(groupedOptions)
    ? map(groupedOptions, (options, groupLabel) => (
        <OptGroup
          label={
            <div>
              {options[0]?.groupLabelPrefix && options[0]?.groupLabelPrefix}
              {groupLabel}
            </div>
          }
          key={groupLabel}
        >
          {createSearchSelectOptionList({
            options,
            createOptionContent,
            foundValues,
            searchValue,
            foundValuesIds,
          })}
        </OptGroup>
      ))
    : createSearchSelectOptionList({ options, createOptionContent, foundValues, searchValue })
}

export interface SearchSelectProps<VT> extends Omit<AntdSelectProps<VT>, 'options'> {
  options: SearchSelectOptionProps[]
  // createOptionContent: create more complex Options than mere label/value
  // (include meta data, icons...)
  createOptionContent?: ({ option, searchValue }: { option: SearchSelectOptionProps; searchValue: string }) => ReactNode
  // if isGrouped, check the options for a "optGroupBy" field and group by that
  isGrouped?: boolean
  selectRef?: React.RefObject<RefSelectProps>
  onSearchCallback?: (ids: string[], searchValue: string) => void
  asAutoComplete?: boolean

  // https://fusejs.io/examples.html#weighted-search
  // like extraSearchValues - but allows assigning weight to keys
  // (now you can priorize the order of matches returned i.e.
  // matching a word in object's "title" may be more important than object's "description")
  weightedSearchKeys?: {
    name: string
    weight: number
  }[]
  omitKeysFromSearch?: string[]
}

const SearchSelect = ({
  createOptionContent,
  options = [],
  isGrouped,
  weightedSearchKeys,
  omitKeysFromSearch,
  onSearchCallback,
  asAutoComplete,
  ...props
}: SearchSelectProps<any>) => {
  const [searchValue, setSearchValue] = useState('')
  const [foundValues, setFoundValues] = useState<{ id: string; index: number }[]>([])

  const hasWeightedKeys = !!weightedSearchKeys
  let keys = hasWeightedKeys
    ? [{ name: 'label', weight: 6 }, 'key', 'extraSearchValues', ...weightedSearchKeys]
    : ['label', 'key', 'extraSearchValues']

  // we default search for label, key, extraSearchValues
  // allow user to omit any one of these default from search
  if (!isEmpty(omitKeysFromSearch)) {
    keys = filter(keys, (key) => {
      // key can be a string
      if (isString(key)) {
        return !includes(omitKeysFromSearch, key)
      }

      // or object {name: string, weight: number}
      return !includes(omitKeysFromSearch, key?.name)
    })
  }

  const prevOptions = usePrevious(options)

  // useMemo to avoid re-renders
  const fuseSearch = useMemo(() => {
    const fuseOptions = {
      includeScore: hasWeightedKeys,
      shouldSort: true,
      threshold: 0.1,
      ignoreLocation: true,
      useExtendedSearch: true,
      ignoreFieldNorm: hasWeightedKeys,
      keys,
    }

    const fuseIndex = Fuse.createIndex(fuseOptions.keys, options)
    return new Fuse(options, fuseOptions, fuseIndex)
  }, [options, hasWeightedKeys, keys])

  const handleSearch = useCallback(
    (value: string) => {
      // fuse handles the search
      // Select's filterOption uses fuse's results to filter which options are seen
      const results = fuseSearch?.search(value)
      // searchValue is used to highlight option labels
      setSearchValue(value)

      const formattedResults = results.map((result) => ({ id: result.item.value as string, index: result.refIndex }))

      // save list of foundValues (id and index) for quick lookup in filterOption
      setFoundValues(formattedResults)

      // call callback after setting formattedResults to avoid
      // race case with filterOption
      if (onSearchCallback) {
        onSearchCallback(
          formattedResults.map((result) => result.id),
          value
        )
      }
    },
    [fuseSearch, onSearchCallback]
  )

  const debouncedHandleSearch = useDebouncedCallback(handleSearch, 200, { maxWait: 500 })

  // if the options available changes fire search again
  // i.e. in ActivitySelect we can hide/show enrichment columns
  // if they have already searched, then hide/show enrichment
  // the matched results will be off (unless we refire)
  useEffect(() => {
    if (searchValue && prevOptions?.length !== options?.length) {
      debouncedHandleSearch(searchValue)
    }
  }, [prevOptions?.length, options?.length, searchValue, debouncedHandleSearch])

  const handleOnSelect = useCallback(
    (value: any, option: DefaultOptionType) => {
      // clear searchValue to match Select's input (unless AutoComplete)
      if (!asAutoComplete) {
        setSearchValue('')
      }

      if (props.onSelect) {
        props.onSelect(value, option)
      }
    },
    [asAutoComplete, props.onSelect]
  )

  const groupedOptions = isGrouped
    ? groupBy(options, (option) => {
        return option.optGroupBy ? option.optGroupBy : 'Other'
      })
    : undefined

  const foundValuesIds = foundValues.map((val) => val.id)

  // make sure search is cleared when you close the dropdown
  // otherwise when you open it back up - you'll still only see
  // options filtered by previous search
  // DO NOT ADD to AUTOCOMPLETE
  const clearSearchOnClose = useCallback((visible: boolean) => {
    if (!visible) {
      debouncedHandleSearch('')
    }
  }, [])

  const handleFilterOption = (input: unknown, option: any) => {
    // show all options if they haven't searched anything
    if (isEmpty(input)) {
      return true
    }

    // if they have searched
    // check if the option was found by fuse
    return includes(foundValuesIds, option?.value)
  }

  if (asAutoComplete) {
    return (
      <AntdAutoComplete
        onSearch={debouncedHandleSearch}
        style={{ width: '100%' }}
        ref={props.selectRef}
        {...props}
        // keep filter option below {..props}
        // bc if you are using this component - you are relying on fuse for search
        filterOption={handleFilterOption}
        // keep onSelect below  {...props} to over-write default onSelect props
        // (allows us to clear out searchValue)
        onSelect={handleOnSelect}
      >
        {buildOptions({
          isGrouped,
          groupedOptions,
          options,
          createOptionContent,
          foundValues,
          searchValue,
          foundValuesIds,
        })}
      </AntdAutoComplete>
    )
  }

  return (
    <AntdSelect
      showSearch
      onSearch={debouncedHandleSearch}
      onDropdownVisibleChange={clearSearchOnClose}
      style={{ width: '100%' }}
      ref={props.selectRef}
      {...props}
      // keep filter option below {..props}
      // bc if you are using this component - you are relying on fuse for search
      filterOption={handleFilterOption}
      // keep onSelect below  {...props} to over-write default onSelect props
      // (allows us to clear out searchValue)
      onSelect={handleOnSelect}
    >
      {buildOptions({
        isGrouped,
        groupedOptions,
        options,
        createOptionContent,
        foundValues,
        searchValue,
        foundValuesIds,
      })}
    </AntdSelect>
  )
}

export default SearchSelect
