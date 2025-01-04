import { UiSchema } from '@rjsf/core'
import { Button, Space } from 'antd-next'
import DynamicForm from 'components/shared/DynamicForm/DynamicForm'
import { Box, Flex, Typography } from 'components/shared/jawns'
import JsonField from 'components/shared/jawns/forms/JsonField'
import { JSONSchema7 } from 'json-schema'
import { noop } from 'lodash'
import { useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { FormData, FormSchema } from 'util/blocks/interfaces'
import { colors } from 'util/constants'

import { getLogger } from '@/util/logger'
const logger = getLogger()

const parseJSON = (value: string) => {
  let result = null
  try {
    result = JSON.parse(value)
  } catch (err) {
    logger.error({ err }, 'Error parsing result')
  }
  return result
}

interface Props {
  initialSchema: JSONSchema7
  initialUiSchema?: UiSchema
  initialFormData: FormData
}

const Playground = ({ initialSchema, initialUiSchema, initialFormData }: Props) => {
  const [schema, setSchema] = useState<JSONSchema7>(initialSchema)
  const [uiSchema, setUISchema] = useState<UiSchema>(initialUiSchema || {})
  const [formData, setFormData] = useState<FormData>(initialFormData)

  const formSchema = {
    schema,
    ui_schema: uiSchema,
  } as FormSchema

  const handleSchemaChange = (value: string) => {
    const newSchema = parseJSON(value)
    if (newSchema) {
      setSchema(newSchema)
    }
  }

  const handleUISchemaChange = (value: string) => {
    const newSchema = parseJSON(value)
    if (newSchema) {
      setUISchema(newSchema)
    }
  }

  const handleFormJSONChange = (value: string) => {
    const newData = parseJSON(value)
    if (newData) {
      setFormData(newData)
    }
  }

  return (
    <Flex flexDirection="row">
      <Flex flexDirection="column" width={2 / 5} mr={2}>
        <Space direction="vertical" size="middle">
          <Box>
            <Typography>Schema</Typography>
            <JsonField value={JSON.stringify(schema, null, 2)} onChange={handleSchemaChange} />
          </Box>

          <Box>
            <Typography>UI Schema</Typography>
            <JsonField value={JSON.stringify(uiSchema, null, 2)} onChange={handleUISchemaChange} />
          </Box>

          <Box>
            <Typography>Form Data</Typography>
            <JsonField value={JSON.stringify(formData, null, 2)} onChange={handleFormJSONChange} />
          </Box>
        </Space>
      </Flex>

      <Box mt={2} width={3 / 5} p={2} style={{ border: `2px solid ${colors.red200}`, background: 'white' }}>
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div>
              <pre>{error.message}</pre>
              <Button
                onClick={() => {
                  resetErrorBoundary()
                }}
              >
                Try again
              </Button>
            </div>
          )}
        >
          <DynamicForm
            formSchema={formSchema}
            formData={formData}
            onChange={(e) => setFormData(e.formData)}
            onSubmit={noop}
            enablePlayground={false}
          />
        </ErrorBoundary>
      </Box>
    </Flex>
  )
}

export default Playground
