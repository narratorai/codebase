import { AutoComplete } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box, Typography } from 'components/shared/jawns'
import { get, includes, isObject, isString, lowerCase, map, some } from 'lodash'
import { useContext } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { colors, semiBoldWeight } from 'util/constants'
import { required } from 'util/forms'

const { Option } = AutoComplete

interface Props {
  fieldName: string
  shouldUnregister?: boolean
}

const FieldSlugInput = ({ fieldName, shouldUnregister }: Props) => {
  const { machineCurrent } = useContext(DatasetFormContext)
  const { control, watch, setValue } = useFormContext()

  const { fields } = machineCurrent.context

  // TODO: this may not be the right way to handle format/parse
  // from rff -> rhf
  const fieldValue = watch(fieldName)
  const formattedValue = isString(fieldValue) ? fieldValue.slice(1, fieldValue.length - 1) : fieldValue
  // NOTE: fields need to be sent to mavis as "{field_slug}" not "field_slug"
  const handleChange = (value: string) => {
    setValue(fieldName, `{${value}}`)
  }

  return (
    <Controller
      name={fieldName}
      control={control}
      shouldUnregister={shouldUnregister}
      rules={{ validate: required }}
      render={({ field, fieldState: { isTouched: touched, error } }) => (
        <FormItem compact meta={{ touched, error: error?.message }}>
          <AutoComplete
            data-test="field-slug-input"
            style={{ minWidth: 120, maxWidth: 400 }}
            placeholder="Select field"
            popupMatchSelectWidth={false}
            filterOption={(inputValue: string, option: any) =>
              some(['fieldSlug', 'fieldValue'], (path) => {
                const value = get(option.data, path)
                return includes(lowerCase(value), lowerCase(inputValue))
              })
            }
            {...field}
            value={formattedValue}
            onChange={handleChange}
          >
            {map(fields, (fieldValue, fieldSlug) => (
              <Option
                key={fieldSlug}
                value={fieldSlug}
                label={fieldSlug}
                data={{ fieldSlug, fieldValue }}
                style={{ borderBottom: `1px solid ${colors.gray200}` }}
              >
                {/* Override default "white-space: nowrap" in .antd5-select-item-option-content: */}
                <Box py={1} style={{ width: 400, whiteSpace: 'normal' }}>
                  <Typography fontWeight={semiBoldWeight} mb={1} data-public>
                    {fieldSlug}
                  </Typography>

                  {/* 
                    Fields can sometimes be more than just strings or integers, 
                    don't try to render a whole object 
                  */}
                  {!isObject(fieldValue) && (
                    <Typography color="gray500" type="body200" mb={1} data-private>
                      {fieldValue}
                    </Typography>
                  )}
                </Box>
              </Option>
            ))}
          </AutoComplete>
        </FormItem>
      )}
    />
  )
}

export default FieldSlugInput
