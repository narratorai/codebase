import { Flex, Typography } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { Controller, useFormContext } from 'react-hook-form'

import { PlotKind } from './interfaces'

interface Props {
  isViewMode?: boolean
}

// eslint-disable-next-line max-lines-per-function
const PlotForm = ({ isViewMode = true }: Props) => {
  const { control, watch, setValue } = useFormContext()
  const plot = watch('plot')
  const y_columns = watch('y_columns')
  const x_color_columns = watch('x_color_columns')
  const y_columns_options = y_columns?.map((y_column: any) => ({ label: y_column.label, value: y_column.id }))
  const x_color_columns_options = x_color_columns?.map((x_color_column: any) => ({
    label: x_color_column.label,
    value: x_color_column.name,
  }))

  // TODO: Perhaps we may want to make the labels more friendly
  const plotKinds = Object.entries(PlotKind).map(([key, value]) => ({ label: key, value: value }))

  const handleYSSelect = (value: string) => {
    setValue('plot.ys', value, { shouldValidate: true })
  }

  const handleXSSelect = (value: string) => {
    setValue('plot.xs', value, { shouldValidate: true })
  }

  const handleColorBYSSelect = (value: string) => {
    setValue('plot.color_bys', value, { shouldValidate: true })
  }

  const handlePlotKindSelect = (value: string) => {
    setValue('plot.plot_kind', value, { shouldValidate: true })
  }

  if (isViewMode && plot?.ys?.length === 0) return null

  return (
    <Flex gap={8} align="center" wrap="wrap">
      <Typography.Text strong>Plot</Typography.Text>
      <Controller
        control={control}
        name="plot.ys"
        render={({ field, fieldState: { isTouched, error } }) => (
          <FormItem meta={{ touched: isTouched, error: error?.message }} layout="vertical" style={{ marginBottom: 0 }}>
            <SearchSelect
              style={{ width: 248 }}
              showSearch
              options={y_columns_options}
              placeholder="Y axis"
              popupMatchSelectWidth={false}
              isGrouped
              {...field}
              onChange={handleYSSelect}
              value={plot?.ys}
              mode="multiple"
            />
          </FormItem>
        )}
      />

      {(!isViewMode || plot?.xs?.length > 0) && (
        <>
          <Typography.Text strong>by</Typography.Text>
          <Controller
            control={control}
            name="plot.xs"
            render={({ field, fieldState: { isTouched, error } }) => (
              <FormItem
                meta={{ touched: isTouched, error: error?.message }}
                layout="vertical"
                style={{ marginBottom: 0 }}
              >
                <SearchSelect
                  style={{ width: 248 }}
                  showSearch
                  options={x_color_columns_options}
                  placeholder="X axis"
                  popupMatchSelectWidth={false}
                  isGrouped
                  {...field}
                  onChange={handleXSSelect}
                  value={plot?.xs}
                  mode="multiple"
                />
              </FormItem>
            )}
          />
        </>
      )}
      {(!isViewMode || plot?.color_bys?.length > 0) && (
        <>
          <Typography.Text strong>for each</Typography.Text>
          <Controller
            control={control}
            name="plot.color_bys"
            render={({ field, fieldState: { isTouched, error } }) => (
              <FormItem
                meta={{ touched: isTouched, error: error?.message }}
                layout="vertical"
                style={{ marginBottom: 0 }}
              >
                <SearchSelect
                  style={{ width: 224 }}
                  showSearch
                  options={x_color_columns_options}
                  placeholder="Color By"
                  popupMatchSelectWidth={false}
                  isGrouped
                  {...field}
                  onChange={handleColorBYSSelect}
                  value={plot?.color_bys}
                  mode="multiple"
                />
              </FormItem>
            )}
          />
        </>
      )}
      {(!isViewMode || plot?.plot_kind) && (
        <>
          <Typography.Text strong>graph type:</Typography.Text>
          <Controller
            control={control}
            name="plot.plot_kind"
            render={({ field, fieldState: { isTouched, error } }) => (
              <FormItem
                meta={{ touched: isTouched, error: error?.message }}
                layout="vertical"
                style={{ marginBottom: 0 }}
              >
                <SearchSelect
                  style={{ width: 224 }}
                  showSearch
                  options={plotKinds}
                  placeholder="Kind"
                  popupMatchSelectWidth={false}
                  isGrouped
                  {...field}
                  onChange={handlePlotKindSelect}
                  value={plot?.plot_kind}
                />
              </FormItem>
            )}
          />
        </>
      )}
    </Flex>
  )
}

export default PlotForm
