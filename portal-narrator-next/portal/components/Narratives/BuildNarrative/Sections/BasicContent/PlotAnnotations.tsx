import { PlusOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import { Box, Flex, ListItemCard } from 'components/shared/jawns'
import SimpleColorPicker from 'components/shared/SimpleColorPicker'
import { startCase } from 'lodash'
import { lazy, Suspense } from 'react'
import { Field } from 'react-final-form'
import { useFieldArray } from 'react-final-form-arrays'
import { required } from 'util/forms'

const MarkdownField = lazy(
  () => import(/* webpackChunkName: "markdown-field" */ 'components/shared/jawns/forms/MarkdownField')
)

const POINT_KIND = 'point'
const VERTICAL_LINE_KIND = 'vertical_line'
const HORIZONTAL_LINE_KIND = 'horizontal_line'
const COLOR_X_LEFT_KIND = 'color_x_left'
const COLOR_X_RIGHT_KIND = 'color_x_right'
const COLOR_Y_ABOVE_KIND = 'color_y_above'
const COLOR_Y_BELOW_KIND = 'color_y_below'

const ALL_ANNOTATION_KINDS = [
  POINT_KIND,
  VERTICAL_LINE_KIND,
  HORIZONTAL_LINE_KIND,
  COLOR_X_LEFT_KIND,
  COLOR_X_RIGHT_KIND,
  COLOR_Y_ABOVE_KIND,
  COLOR_Y_BELOW_KIND,
]

const ALL_KIND_OPTIONS = ALL_ANNOTATION_KINDS.map((kind) => ({ value: kind, label: startCase(kind) }))

const X_LOCATION_KINDS = [POINT_KIND, VERTICAL_LINE_KIND, COLOR_X_LEFT_KIND, COLOR_X_RIGHT_KIND]
const Y_LOCATION_KINDS = [POINT_KIND, HORIZONTAL_LINE_KIND, COLOR_Y_BELOW_KIND, COLOR_Y_ABOVE_KIND]
const COLOR_KINDS = [
  VERTICAL_LINE_KIND,
  HORIZONTAL_LINE_KIND,
  COLOR_X_LEFT_KIND,
  COLOR_X_RIGHT_KIND,
  COLOR_Y_ABOVE_KIND,
  COLOR_Y_BELOW_KIND,
]
const CONTENT_KINDS = [POINT_KIND, VERTICAL_LINE_KIND, HORIZONTAL_LINE_KIND]

const DEFAULT_ANNOTATION = {
  kind: POINT_KIND,
  x_location: '',
  y_location: '',
  color: '#F4664A',
  content: '',
}

const HALF_WIDTH_WITH_SPACE = '45%'

interface Props {
  fieldName: string
}

const PlotAnnotations = ({ fieldName }: Props) => {
  const { fields } = useFieldArray(fieldName)

  const handleAddAnnotation = () => {
    fields.push(DEFAULT_ANNOTATION)
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {fields.map((annotationFieldName, index) => {
        return <Annotation key={annotationFieldName} fieldName={annotationFieldName} fields={fields} index={index} />
      })}

      <Button onClick={handleAddAnnotation} shape="round" icon={<PlusOutlined />}>
        Add Annotation
      </Button>
    </Space>
  )
}

interface AnnotationProps {
  fieldName: string
  fields: any
  index: number
}

const Annotation = ({ fieldName, fields, index }: AnnotationProps) => {
  const { autocomplete } = useBuildNarrativeContext()
  const kindValue = fields.value[index]?.kind

  const handleRemoveAnnotation = () => {
    fields.remove(index)
  }

  return (
    <ListItemCard onClose={handleRemoveAnnotation}>
      {/* Kind */}
      <Flex justifyContent="space-between">
        <Box style={{ width: HALF_WIDTH_WITH_SPACE }}>
          <Field
            name={`${fieldName}.kind`}
            validate={required}
            render={({ input, meta }) => (
              <FormItem layout="vertical" label="Kind" meta={meta} required compact>
                <SearchSelect options={ALL_KIND_OPTIONS} {...input} />
              </FormItem>
            )}
          />
        </Box>

        {/* Color */}
        {COLOR_KINDS.includes(kindValue) && (
          <Field
            name={`${fieldName}.color`}
            validate={required}
            render={({ input, meta }) => (
              <FormItem layout="vertical" label="Color" meta={meta} compact>
                <SimpleColorPicker {...input} />
              </FormItem>
            )}
          />
        )}
      </Flex>

      {/* X and Y Locations */}
      <Flex justifyContent="space-between">
        {/* X Location */}
        {X_LOCATION_KINDS.includes(kindValue) && (
          <Box style={{ width: HALF_WIDTH_WITH_SPACE }}>
            <Suspense fallback={null}>
              <Field
                name={`${fieldName}.x_location`}
                validate={required}
                render={({ input, meta }) => (
                  <FormItem layout="vertical" label="X Location" meta={meta} compact>
                    <MarkdownField
                      {...input}
                      meta={meta}
                      options={{
                        autocomplete,
                      }}
                    />
                  </FormItem>
                )}
              />
            </Suspense>
          </Box>
        )}

        {/* Y Location */}
        {Y_LOCATION_KINDS.includes(kindValue) && (
          <Box style={{ width: HALF_WIDTH_WITH_SPACE }}>
            <Suspense fallback={null}>
              <Field
                name={`${fieldName}.y_location`}
                validate={required}
                render={({ input, meta }) => (
                  <FormItem layout="vertical" label="Y Location" meta={meta} compact>
                    <MarkdownField
                      {...input}
                      meta={meta}
                      options={{
                        autocomplete,
                      }}
                    />
                  </FormItem>
                )}
              />
            </Suspense>
          </Box>
        )}
      </Flex>

      {/* Content */}
      {CONTENT_KINDS.includes(kindValue) && (
        <Suspense fallback={null}>
          <Field
            name={`${fieldName}.content`}
            render={({ input, meta }) => (
              <FormItem layout="vertical" label="Content" meta={meta} compact>
                <MarkdownField
                  {...input}
                  meta={meta}
                  options={{
                    autocomplete,
                    default_height: 80,
                  }}
                />
              </FormItem>
            )}
          />
        </Suspense>
      )}
    </ListItemCard>
  )
}

export default PlotAnnotations
