import { Form } from '@rjsf/antd'
import { IChangeEvent, ISubmitEvent } from '@rjsf/core'
import { Button, Space } from 'antd-next'
import { ButtonProps } from 'antd-next/es/button'
import DynamicFormContext from 'components/shared/DynamicForm/DynamicFormContext'
import { Flex } from 'components/shared/jawns'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { get } from 'lodash'
import React, { lazy, Suspense } from 'react'
import styled from 'styled-components'
import { useDebouncedCallback } from 'use-debounce'
import { FormData, FormSchema, IFormContext } from 'util/blocks/interfaces'

import { ConfettiField, MetricField, QueryWithScratchpadField, StepField, TableField } from './Fields/fields'
import { ArrayFieldTemplate, DescriptionField, FieldTemplate, ObjectFieldTemplate, TitleField } from './FormTemplates'
import {
  BooleanButtonWidget,
  BooleanToggleWidget,
  CheckboxWidget,
  ColorsWidget,
  ColorWidget,
  CronSelectFormItemWidget,
  DateTimeWidget,
  DateWidget,
  FieldsWidget,
  JsonWidget,
  MarkdownRenderWidget,
  MarkdownWidget,
  PercentWidget,
  PlotRenderWidget,
  SelectWidget,
  SqlWidget,
  SqlWithTableWidget,
  TextWidget,
  TreeSelectWidget,
} from './FormWidgets/widgets'

const DebugModal = lazy(() => import(/* webpackChunkName: "debug-modal" */ './DebugModal'))

//
// A DynamicForm is just a form that loads a JSONSchema and renders a form automatically from it.
// It's used by Blocks, but can also be used on its own (see WarehouseForm)
//
// The form is super simple to use. Pass in a FormState with a schema. onChange is called if any field changes and
// onSubmit is called when the form is submitted.

// form group is the only field element we haven't figured out how to replace with our own
const StyledForm = styled(Form)`
  width: 100%;

  .form-group {
    margin-bottom: 24px;
  }
`

//
// Custom fields and widgets (widgets are specific input elements)
//

const fields = {
  DescriptionField,
  TitleField,
  step: StepField,
  QueryWithScratchpadField,
  TableField,
  MetricField,
  ConfettiField,
}

const widgets = {
  BooleanButtonWidget,
  BooleanToggleWidget,
  ColorWidget,
  ColorsWidget,
  CheckboxWidget,
  CronSelectFormItemWidget,
  FieldsWidget,
  JsonWidget,
  MarkdownWidget,
  MarkdownRenderWidget,
  PercentWidget,
  PlotRenderWidget,
  SelectWidget,
  SqlWidget,
  SqlWithTableWidget,
  TextWidget,
  TreeSelectWidget,
  DateTimeWidget,
  DateWidget,
}

interface DynamicFormProps {
  formSchema: FormSchema
  formData: FormData
  onSubmit: (form: ISubmitEvent<any>) => void
  onChange?: (form: IChangeEvent<any>) => void
  loading?: boolean
  formContext?: IFormContext
  submitText?: string
  extraButtons?: React.ReactNode[]
  submitButtonProps?: ButtonProps
  omitExtraData?: boolean
  enablePlayground?: boolean
  asAdmin?: boolean
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  loading,
  onChange,
  onSubmit,
  formSchema: formState,
  formData,
  formContext,
  submitText = 'Submit',
  extraButtons,
  submitButtonProps,
  omitExtraData,
  enablePlayground = true,
  asAdmin = false,
}) => {
  const flags = useFlags()
  const uiSchema = formState.ui_schema
  const schema = formState.schema

  if (!schema) {
    throw new Error('schema is required')
  }

  const hideSubmit = get(uiSchema, 'ui:options.hide_submit', false)

  type submitOrChangeCallback = (form: IChangeEvent<any> | ISubmitEvent<any>) => void
  const ensureFormAndDoCallback = (form: IChangeEvent<any>, callback: submitOrChangeCallback) => {
    if (callback) {
      // rjsform strips off form schema and ui schema in the
      // onChange event even though it's required in IChangeEvent
      // Note that this will soon be fixed
      if (!form.schema) {
        form.schema = schema
      }

      if (!form.uiSchema && uiSchema) {
        form.uiSchema = uiSchema
      }

      callback(form)
    }
  }

  const handleChange = (form: IChangeEvent<any>) => {
    if (onChange) {
      ensureFormAndDoCallback(form, onChange)
    }
  }

  const debouncedHandleChange = useDebouncedCallback(handleChange, 200, { maxWait: 500 })

  const handleSubmit = (form: ISubmitEvent<any>) => {
    ensureFormAndDoCallback(form, onSubmit)
  }

  return (
    // noValidate: we don't want json schema validation since there's nothing the user can do. Generally this means
    // the backend is sending down an invalid schema and as long as the form loads and submits as expected it doesn't matter
    <DynamicFormContext.Provider
      value={{
        asAdmin: asAdmin,
      }}
    >
      <Flex data-test="dynamic-form-content">
        <StyledForm
          id="dynamicForm"
          schema={schema}
          uiSchema={uiSchema}
          formData={formData}
          liveValidate
          noValidate
          disabled={loading}
          widgets={widgets}
          onChange={debouncedHandleChange}
          onSubmit={handleSubmit}
          FieldTemplate={FieldTemplate}
          ObjectFieldTemplate={ObjectFieldTemplate}
          ArrayFieldTemplate={ArrayFieldTemplate}
          fields={fields}
          formContext={formContext}
          omitExtraData={omitExtraData}
        >
          {hideSubmit ? (
            // need an empty div here to override the default submit button
            <div></div>
          ) : (
            <Space size="large">
              <Button type="primary" htmlType="submit" disabled={loading} {...submitButtonProps}>
                {submitText}
              </Button>
              {extraButtons}
            </Space>
          )}
        </StyledForm>

        {enablePlayground && flags['show-blocks-debugger'] && (
          <Suspense fallback={null}>
            <DebugModal schema={schema} uiSchema={uiSchema} formData={formData} />
          </Suspense>
        )}
      </Flex>
    </DynamicFormContext.Provider>
  )
}

export default DynamicForm
