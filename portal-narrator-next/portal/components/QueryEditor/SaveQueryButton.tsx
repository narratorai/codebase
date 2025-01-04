import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Input, Popover, Spin, Tooltip } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box, Flex } from 'components/shared/jawns'
import {
  IInsertSharedSqlQueryMutation,
  useInsertSharedSqlQueryMutation,
  useUpdateCompanySqlQueryMutation,
} from 'graph/generated'
import { isEmpty } from 'lodash'
import queryString from 'query-string'
import { Field, Form } from 'react-final-form'
import { useHistory } from 'react-router'
import { useToggle } from 'react-use'
import { required } from 'util/forms'

function SaveQueryForm({
  values,
  isLoading,
  onSubmit,
  onCancel,
}: {
  values: Record<string, unknown>
  isLoading: boolean
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}) {
  return (
    <Spin spinning={isLoading}>
      <Form
        initialValues={values}
        onSubmit={onSubmit}
        render={({ handleSubmit, errors }) => (
          <Box>
            <Field
              name="name"
              validate={required}
              render={({ input, meta }) => (
                <FormItem label="Query Name" meta={meta} layout="vertical" required hasFeedback>
                  <Input placeholder="Enter query name" {...input} />
                </FormItem>
              )}
            />

            <Flex justifyContent="flex-end">
              <Box mr={1}>
                <Button onClick={onCancel}>Cancel</Button>
              </Box>
              <Button type="primary" onClick={handleSubmit} disabled={!isEmpty(errors)}>
                Submit
              </Button>
            </Flex>
          </Box>
        )}
      />
    </Spin>
  )
}

interface Props {
  query_id?: string
  sqlRef: any
  selectedQuery: any
  onSave: () => Promise<void>
}

export default function SaveQueryButton({ query_id, sqlRef, selectedQuery, onSave }: Props) {
  const { notification } = App.useApp()
  const { user, isCompanyAdmin } = useUser()
  const history = useHistory()
  const company = useCompany()
  const [showConfirmationDialog, toggleConfirmationDialog] = useToggle(false)

  // Only admins can update a query, but everyone can create a new one
  const isDisabled = !isCompanyAdmin && !isEmpty(selectedQuery?.name)

  const handleCreateSuccess = async (data: IInsertSharedSqlQueryMutation) => {
    toggleConfirmationDialog()
    await onSave()

    // on success, push new id to query params
    const id = data.insert_company_sql_queries?.returning[0]?.id
    history.push({
      search: `?${queryString.stringify({ query_id: id })}`,
    })
  }

  const [createQuery, { loading: createQueryLoading }] = useInsertSharedSqlQueryMutation({
    onCompleted: handleCreateSuccess,
    onError: (error) => {
      notification.error({
        key: 'create_query_failure',
        message: 'There was an error creating this query',
        placement: 'topRight',
        description: error.message,
        duration: 0,
      })
    },
  })

  const handleUpdateSuccess = async () => {
    toggleConfirmationDialog()
    await onSave()

    notification.success({
      key: 'update_query_success',
      message: 'You have successfully updated this query',
      placement: 'topRight',
    })
  }

  const [updateQuery, { loading: updateQueryLoading }] = useUpdateCompanySqlQueryMutation({
    onCompleted: handleUpdateSuccess,
    onError: (error) => {
      notification.error({
        key: 'update_query_failure',
        message: 'There was an error updating this query',
        placement: 'topRight',
        description: error.message,
        duration: 0,
      })
    },
  })

  const saveQuery = async (formValue: Record<string, any>) => {
    if (sqlRef?.current) {
      const sql = sqlRef?.current()
      if (sql) {
        // if the query already has a name - update it
        if (selectedQuery) {
          updateQuery({
            variables: {
              company_id: company.id,
              query_id: query_id,
              name: formValue.name,
              sql,
            },
          })
        } else if (formValue?.name) {
          // otherwise it is a new query - so create one
          createQuery({
            variables: {
              company_id: company.id,
              name: formValue.name,
              user_id: user.id,
              related_to: 'company',
              sql,
            },
          })
        }
      }
    }
  }

  return (
    <Popover
      open={showConfirmationDialog}
      onOpenChange={toggleConfirmationDialog}
      placement="right"
      trigger="click"
      title={
        selectedQuery ? (
          <>
            Update <b>{selectedQuery.name}</b>
          </>
        ) : (
          'Create Query'
        )
      }
      content={
        <Box style={{ minWidth: '320px' }}>
          <SaveQueryForm
            values={{ name: selectedQuery?.name || '' }}
            isLoading={createQueryLoading || updateQueryLoading}
            onSubmit={saveQuery}
            onCancel={toggleConfirmationDialog}
          />
        </Box>
      }
    >
      <Tooltip title={isDisabled ? 'Must be an admin to perform this action.' : undefined}>
        <Button
          icon={<SaveOutlined />}
          type="primary"
          disabled={isDisabled}
          // https://github.com/react-component/tooltip/issues/18#issuecomment-411476678
          // fix for tooltip not dissappearing over disabled components
          style={{ pointerEvents: isDisabled ? 'none' : 'inherit' }}
        />
      </Tooltip>
    </Popover>
  )
}
