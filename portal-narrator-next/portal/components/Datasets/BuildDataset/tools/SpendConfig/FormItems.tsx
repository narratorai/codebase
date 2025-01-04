import { InfoCircleOutlined } from '@ant-design/icons'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { GetSpendOptionsResponse } from 'components/Datasets/BuildDataset/tools/SpendConfig/interfaces'
import { Box } from 'components/shared/jawns'
import { Controller, useFormContext } from 'react-hook-form'

import SpendJoins from './SpendJoins'

type OptionType = { label: string; value: string }

interface Props {
  tableOptions: OptionType[]
  metricOptions: OptionType[]
  joinColumns?: GetSpendOptionsResponse['join_columns']
  handleGetSpendOptions: (tableLabel: string) => void
}

const FormItems = ({ tableOptions, metricOptions, joinColumns = [], handleGetSpendOptions }: Props) => {
  const { control } = useFormContext()

  return (
    <Box>
      <Box>
        <Controller
          control={control}
          name="spend.spend_table"
          render={({ field, fieldState: { isTouched, error } }) => (
            <FormItem
              label="Table"
              meta={{ touched: isTouched, error: error?.message }}
              layout="vertical"
              tooltip={{
                title:
                  "Join spend table columns with your group's aggregate columns in order to add columns for spend, clicks, and impressions to your dataset.",
                icon: <InfoCircleOutlined />,
                placement: 'right',
              }}
            >
              <SearchSelect
                {...field}
                // passing tableLabel will override all formValues to new defaults
                onChange={(tableLabel: string) => handleGetSpendOptions(tableLabel)}
                options={tableOptions}
              />
            </FormItem>
          )}
        />
      </Box>

      <Box mb={3}>
        <SpendJoins joinColumns={joinColumns} />
      </Box>

      <Box mb={3}>
        <Controller
          name="spend.metrics"
          control={control}
          render={({ field, fieldState: { isTouched, error } }) => (
            <FormItem label="Metric" layout="vertical" meta={{ touched: isTouched, error: error?.message }}>
              <SearchSelect {...field} options={metricOptions} mode="multiple" />
            </FormItem>
          )}
        />
      </Box>
    </Box>
  )
}

export default FormItems
