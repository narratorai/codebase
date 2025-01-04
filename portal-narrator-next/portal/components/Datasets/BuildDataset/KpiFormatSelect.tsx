import { SearchSelect } from 'components/antd/staged'
import { INarrativeTemplateOptions } from 'components/Datasets/hooks/useListNarrativeTemplateOptions'
import { findIndex, isArray, isEmpty, isEqual, map, startCase } from 'lodash'
import { useEffect } from 'react'
import { Field, useField } from 'react-final-form'
import usePrevious from 'util/usePrevious'

const KPI_FORMAT_VALUES = ['number', 'revenue', 'percent']

interface Props {
  kpis?: INarrativeTemplateOptions['kpis']
  kpiFormats?: INarrativeTemplateOptions['kpi_formats']
}

const KpiFormatSelect = ({ kpis, kpiFormats }: Props) => {
  const kpiFormatOptions = map(KPI_FORMAT_VALUES, (val) => ({
    label: startCase(val),
    value: val,
  }))

  const {
    input: { value: kpiValue },
  } = useField('kpi', { subscription: { value: true } })
  const prevKpiValue = usePrevious(kpiValue)

  const {
    input: { onChange: kpiFormatOnChange },
  } = useField('kpi_format', { subscription: { value: true } })

  // if the kpi value is changed
  // make sure default format is selected
  // (these are mapped by the index of data coming in from useListNarrativeTemplateOptions)
  // i.e. kpis[3]'s default format is kpi_formats[3]
  useEffect(() => {
    // first check if kpiValue has changed
    if (isArray(kpiFormats) && !isEmpty(prevKpiValue) && !isEqual(prevKpiValue, kpiValue)) {
      // find what the default format should be
      const kpiSelectedIndex = findIndex(kpis, ['value', kpiValue])
      const defaultKpiFormat = kpiFormats[kpiSelectedIndex]
      // and update the format if it's not the default value
      if (!isEmpty(defaultKpiFormat) && !isEqual(defaultKpiFormat, kpiValue)) {
        kpiFormatOnChange(defaultKpiFormat)
      }
    }
  }, [kpis, prevKpiValue, kpiValue, kpiFormats, kpiFormatOnChange])

  return (
    <Field
      name="kpi_format"
      render={({ input }) => {
        return (
          <SearchSelect
            data-test="analyze-modal-kpi-format-select"
            options={kpiFormatOptions}
            popupMatchSelectWidth={false}
            getPopupContainer={(trigger) => trigger.parentNode}
            showSearch
            {...input}
            style={{ minWidth: '100px' }}
          />
        )
      }}
    />
  )
}

export default KpiFormatSelect
