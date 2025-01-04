import { Select } from 'antd-next'
import { SearchSelectOptionProps } from 'components/antd/staged'
import { useCompany, useCompanyRefetch } from 'components/context/company/hooks'
import { FormData } from 'components/CustomerJourney/v2/Customer'
import { Box, Flex, Typography } from 'components/shared/jawns'
import Mark from 'components/shared/Mark'
import { useListActivitiesQuery } from 'graph/generated'
import { filter, find, includes, isEmpty } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { colors } from 'util/constants'

import ActivitySelect from './FormItems/ActivitySelect'
import ActivityStreamSelect from './FormItems/ActivityStreamSelect'
import AscDescToggle from './FormItems/AscDescToggle'
import CustomerAutoComplete from './FormItems/CustomerAutoComplete'
import CustomerKindSelect from './FormItems/CustomerKindSelect'
import DepthInput from './FormItems/DepthInput'
import OnlyFirstOccurence from './FormItems/OnlyFirstOccurrence'
import StartActivitySelect from './FormItems/StartActivitySelect'
import TimeFilter from './FormItems/TimeFilter'
import VisualizationTimeBetween from './FormItems/VisualizationTimeBetween'
import SectionWithTitle from './SectionWithTitle'
import { ValuesFromParams } from './services/interfaces'

const { Option } = Select

interface Props {
  valuesFromParams: ValuesFromParams
  onSubmit: () => void
  handleReset: ({ valueOverrides }: { valueOverrides?: Partial<FormData> | undefined }) => void
}

const FormFilters = ({ valuesFromParams, onSubmit, handleReset }: Props) => {
  const company = useCompany()
  const refetchCompanySeed = useCompanyRefetch()

  const { watch } = useFormContext()

  const asVisualization = valuesFromParams?.as_visual

  // on page load
  // make sure company is up-to-date (for activity stream select)
  const [hasRefetchedCompany, setHasRefetchedCompany] = useState(false)
  useEffect(() => {
    if (!hasRefetchedCompany && refetchCompanySeed) {
      refetchCompanySeed()
      setHasRefetchedCompany(true)
    }
  }, [hasRefetchedCompany, setHasRefetchedCompany, refetchCompanySeed])

  const hasMultipleStreams = company?.tables?.length > 1

  const { data: graphActivities } = useListActivitiesQuery({
    variables: { company_slug: company.slug, activity_stream: valuesFromParams.table },
    skip: !valuesFromParams.table,
  })

  const allActivities = graphActivities?.all_activities

  const selectedCategories = watch('categories')

  const activityOptions = useMemo(() => {
    const selectableActivities = isEmpty(selectedCategories)
      ? allActivities
      : filter(allActivities, (act) => includes(selectedCategories, act.company_category?.category))

    return (selectableActivities || []).map((act) => ({
      key: act.slug,
      label: act.name,
      value: act.slug,
      extraSearchValues: act.company_table?.activity_stream,
    }))
  }, [selectedCategories, allActivities])

  const handleCreateOptionContent = ({
    searchValue,
    option,
  }: {
    searchValue: string
    option: SearchSelectOptionProps
  }) => (
    <Option
      key={option.key || option.value}
      value={option.value}
      label={option.label}
      extraSearchValues={find(allActivities, ['slug', option.value])?.company_table?.activity_stream}
    >
      <Flex justifyContent="space-between" alignItems="baseline">
        <Box data-test="customer-activity-name-option">
          <Mark value={option.label} snippet={searchValue} />
        </Box>
        {hasMultipleStreams && (
          <Typography type="body200" style={{ color: colors.gray500 }}>
            <Mark
              value={find(allActivities, ['slug', option.value])?.company_table?.activity_stream}
              snippet={searchValue}
            />
          </Typography>
        )}
      </Flex>
    </Option>
  )

  return (
    <Box>
      <Box my={2}>
        <Flex flexDirection="column">
          {hasMultipleStreams && <ActivityStreamSelect handleReset={handleReset} />}

          <SectionWithTitle title="Customer Selection">
            <CustomerKindSelect onSubmit={onSubmit} />
            {!asVisualization && <CustomerAutoComplete />}
          </SectionWithTitle>
        </Flex>
      </Box>

      <SectionWithTitle title="Activity Selection">
        <ActivitySelect activities={allActivities} />

        <Box mt={1}>
          <OnlyFirstOccurence />
        </Box>

        {asVisualization && (
          <Box mt={1}>
            <StartActivitySelect options={activityOptions} handleCreateOptionContent={handleCreateOptionContent} />
          </Box>
        )}
      </SectionWithTitle>

      <SectionWithTitle title="Time Filter">
        <Box mt={1}>
          <TimeFilter />
        </Box>
        {asVisualization && (
          <Box mt={1}>
            <VisualizationTimeBetween />
          </Box>
        )}
      </SectionWithTitle>

      <SectionWithTitle title={asVisualization ? 'Visual Filter' : 'Sort'}>
        {asVisualization && <DepthInput />}

        {!asVisualization && (
          <Box mt={1}>
            <AscDescToggle />
          </Box>
        )}
      </SectionWithTitle>
    </Box>
  )
}

export default FormFilters
