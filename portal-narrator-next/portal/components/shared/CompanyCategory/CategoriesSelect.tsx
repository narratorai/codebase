import { FormItem, SearchSelect } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { Box } from 'components/shared/jawns'
import { useListCompanyCategoriesQuery } from 'graph/generated'
import { includes, isEmpty, map, snakeCase, startCase, uniq } from 'lodash'
import { DefaultOptionType } from 'rc-select/lib/Select'
import { JSXElementConstructor, ReactElement, useCallback, useEffect, useState } from 'react'
import { FieldMetaState } from 'react-final-form'

import AddNewDropdown from './AddNewDropdown'

interface Props {
  onSelect: (value: string, option: DefaultOptionType) => void
  initialValue: string
  meta: FieldMetaState<any>
}

const CategoriesSelect = ({ onSelect, initialValue, meta }: Props) => {
  const company = useCompany()
  const [categories, setCategories] = useState<string[]>([])

  // both of these support adding a new category -- need to manually set the
  // current selected value and close the dropdown when a new item is added
  const [dropdownOpened, setDropdownOpened] = useState(false)
  const [selectedValue, setSelectedValue] = useState(initialValue)

  const { data: categoriesData } = useListCompanyCategoriesQuery({
    variables: { company_id: company?.id },
  })

  const options = map(categories, (label) => ({
    label,
    key: label,
    value: snakeCase(label),
  }))

  const handleSelect = useCallback(
    (value: any, option: DefaultOptionType) => {
      setSelectedValue(value)
      onSelect(value, option)
    },
    [onSelect]
  )

  const handleAddCategory = (addCategory: string) => {
    // only add the category if it has a value and doesn't already exist
    const addCategoryLabel = startCase(addCategory)

    if (!isEmpty(addCategoryLabel) && !includes(categories, addCategoryLabel)) {
      const updateCategories = [addCategoryLabel, ...categories]
      setCategories(updateCategories)
      handleSelect(addCategoryLabel, { label: addCategoryLabel, value: snakeCase(addCategoryLabel) })
      setDropdownOpened(false)
    }
  }

  useEffect(() => {
    if (categoriesData) {
      // startCase categories (should be saved in snakeCase)
      // backfill: enure unique names - some had been saved in snake case, start case, or lowercase string
      // (i.e. "New Category" vs "new category" vs "new_category" --> "New Category")
      const categoryNames = uniq(map(categoriesData.company_categories, (cat) => startCase(cat.category)))

      setCategories(categoryNames)
    }
  }, [categoriesData, setCategories])

  return (
    <Box mb={1}>
      <FormItem label="Category" meta={meta}>
        <SearchSelect
          onSelect={handleSelect}
          defaultValue={initialValue}
          value={selectedValue}
          dropdownRender={(menu: ReactElement<any, string | JSXElementConstructor<any>>) => (
            <AddNewDropdown menu={menu} onAddItem={handleAddCategory} />
          )}
          open={dropdownOpened}
          onDropdownVisibleChange={setDropdownOpened}
          options={options}
        />
      </FormItem>
    </Box>
  )
}

export default CategoriesSelect
