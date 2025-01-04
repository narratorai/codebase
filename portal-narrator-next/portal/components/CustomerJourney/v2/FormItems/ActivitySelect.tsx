import { TreeSelect } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { Box, Flex } from 'components/shared/jawns'
import { each, keys, startCase, trim } from 'lodash'
import { Controller, useFormContext } from 'react-hook-form'

import { ACTIVITIES_FIELDNAME, HIDE_ACTIVITIES_FIELDNAME } from './constants'
import HideShowActivitiesSwitch from './HideShowActivitiesSwitch'
import { Activities } from './interfaces'

interface Props {
  activities?: Activities
}

const NO_CATEGORY_SLUG = 'uncategorized'

const makeCategoryActivityMap = (activities?: Activities) => {
  const categoryActivityMap: { [key: string]: Activities } = {}

  // build map between category and their activites
  each(activities, (act) => {
    const category = act.company_category?.category || NO_CATEGORY_SLUG

    // if category hasn't been added - initialize the category
    if (!categoryActivityMap[category]) {
      categoryActivityMap[category] = []
    }

    // now add the activity to the category
    categoryActivityMap[category].push(act)
  })

  return categoryActivityMap
}

const makeTreeData = (activities?: Activities) => {
  const categoryActivityMap = makeCategoryActivityMap(activities)

  // alphabetize by categories (top level tree data)
  const sortedCategoryKeys = keys(categoryActivityMap)?.sort((a, b) => a.localeCompare(b))

  const treeData: {
    title: string
    value: string
    key: string
    children: { title: string; value: string; key: string }[]
  }[] = []

  each(sortedCategoryKeys, (cat) => {
    const leaf = {
      title: startCase(cat),
      value: cat,
      key: cat,
      children: categoryActivityMap[cat]?.map((act) => ({
        title: trim(act.name ? act.name : startCase(act.slug)),
        value: act.slug,
        key: act.slug,
      })),
    }

    // now add the category and its activities to treeData
    treeData.push(leaf)
  })

  return treeData
}

const ActivitySelect = ({ activities }: Props) => {
  const { control, watch } = useFormContext()
  const treeData = makeTreeData(activities)

  const isHideActivitiesMode = watch(HIDE_ACTIVITIES_FIELDNAME)
  const label = `Select ${isHideActivitiesMode ? 'Hidden' : 'Shown'} Activities`
  const placeholder = `${isHideActivitiesMode ? 'Hide' : 'Show'} All Activities`

  return (
    <Controller
      control={control}
      name={ACTIVITIES_FIELDNAME}
      render={({ field, fieldState: { isTouched, error } }) => (
        <FormItem label={label} meta={{ touched: isTouched, error: error?.message }} layout="vertical" compact>
          <Flex alignItems="flex-start">
            <Box mr={1} style={{ width: '100%', maxWidth: '243px' }}>
              <TreeSelect
                {...field}
                treeData={treeData}
                treeCheckable
                treeDefaultExpandAll
                allowClear
                placeholder={placeholder}
                style={{ width: '100%' }}
                data-test="customer-activity-select"
              />
            </Box>

            <HideShowActivitiesSwitch activities={activities} />
          </Flex>
        </FormItem>
      )}
    />
  )
}

export default ActivitySelect
