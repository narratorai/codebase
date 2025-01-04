import { UserOutlined } from '@ant-design/icons'
import { Button, Drawer, Space, Timeline } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box, Typography } from 'components/shared/jawns'
import { find, groupBy, isEqual, map, omit } from 'lodash'
import { useContext } from 'react'
import { Field, Form } from 'react-final-form'
import { semiBoldWeight } from 'util/constants'
import { getGroupFromContext } from 'util/datasets'
import { IDatasetFormContext, IPlan } from 'util/datasets/interfaces'
import { arrayMutators } from 'util/forms'

interface IPlanEntry extends IPlan {
  id: string
  index: number
}

const Reconciler = () => {
  const { machineCurrent, machineSend } = useContext<IDatasetFormContext>(DatasetFormContext)
  const { _plan_execution: planExecution } = machineCurrent.context

  // map through the execution plan and give it an `id` and `index`
  // that we can use later in the Form and Fields below
  const plan: IPlanEntry[] = (planExecution?.plan || []).map((planEntry, idx) => ({
    ...planEntry,
    id: `plan-${idx}`,
    index: idx,
  }))
  const planGroupedByTabName = groupBy(plan, (entry: IPlanEntry) => {
    const groupSlug = entry.group_slug
    if (groupSlug) {
      const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })
      return group?.name || 'Unknown Tab Name'
    }
    return 'Parent Dataset'
  })

  const reconcilerEditing = machineCurrent.matches({ edit: 'reconciler' })

  const onSubmit = (formValue: any) => {
    // Remove the id and index fields that we added so we can diff
    // it with the existing planExecution.plan:
    const formValueForDiff = map(formValue, (plan) => omit(plan, ['id', 'index']))

    // If the user made any changes, UPDATE_RECONCILER_PLAN
    if (!isEqual(formValueForDiff, planExecution?.plan)) {
      return machineSend('UPDATE_RECONCILER_PLAN', { plan: formValue })
    }

    // Otherwise persist that planExecution.staged_dataset as the new query definition!
    machineSend('PERSIST_PLAN_EXECUTION')
  }

  const dotColor = (mutation = '') => {
    if (mutation.indexOf('add') !== -1) {
      return 'green'
    }

    if (mutation.indexOf('delete') !== -1) {
      return 'red'
    }

    return 'blue'
  }

  const renderEntries = ({ mutation, entries }: { mutation: string; entries: IPlanEntry[] }) => {
    return entries.map((entry) => {
      const { new_column, column, activity, allowed_columns: allowedColumns = [], mavis_created } = entry

      const allowedColumnOptions = map(allowedColumns, (col) => ({
        value: col.id,
        key: col.label,
        label: col.label,
      }))

      const userGenerated = !mavis_created
      const key = `${entry.mutation}.${entry.column?.id}.${entry.activity?.id}`
      let preface

      switch (mutation) {
        case 'add':
          preface = userGenerated ? 'You added' : 'Adding'
          return (
            <Typography key={key}>
              {preface} column <strong>{new_column?.label}</strong>
            </Typography>
          )
        case 'delete':
          preface = userGenerated ? 'You deleted' : 'Deleting'
          return (
            <Typography key={key}>
              {preface} column <strong>{column?.label}</strong>
            </Typography>
          )
        case 'add_activity':
          preface = userGenerated ? 'You added' : 'Adding'
          return (
            <Typography key={key}>
              {preface} activity <strong>{activity?.name}</strong>
            </Typography>
          )
        case 'delete_activity':
          preface = userGenerated ? 'You deleted' : 'Deleting'
          return (
            <Typography key={key}>
              {preface} activity <strong>{activity?.name}</strong>
            </Typography>
          )
        case 'swap_id':
          preface = userGenerated ? 'You swapped' : 'Swapping'
          return (
            <Box mb={1} key={key}>
              <Space>
                <Typography>
                  {preface} all columns that depend on <strong>{column?.label}</strong> to use
                </Typography>
                <Field
                  name={`[${entry.index}].new_column`}
                  render={({ input: { value, onChange }, meta }) => {
                    const overrideOnChange = (columnId: string) => {
                      const column = find(allowedColumns, { id: columnId })
                      onChange(column)
                    }

                    return (
                      <FormItem noStyle compact {...meta}>
                        <SearchSelect
                          showSearch
                          optionFilterProp="children" // search for label
                          style={{ minWidth: 100 }}
                          size="small"
                          placeholder="Choose column"
                          popupMatchSelectWidth={false}
                          onChange={overrideOnChange}
                          value={value.id}
                          options={allowedColumnOptions}
                        />
                      </FormItem>
                    )
                  }}
                />
              </Space>
            </Box>
          )
        case 'add_order':
          preface = userGenerated ? 'You reset' : 'Resetting'
          return (
            <Typography key={key}>
              {preface} order by <strong>{activity?.name}</strong>
            </Typography>
          )
        default:
          return null
      }
    })
  }

  return (
    <Form
      mutators={arrayMutators}
      // This is going to allow you to edit columnDefinition.filters
      initialValues={plan}
      // if user changed the swap_id column, submit will have to run fetchReconcile
      // keepDirtyOnReinitialize stops the old value from being re-initialized while we wait for fetchReconcile resp
      // https://final-form.org/docs/react-final-form/types/FormProps#keepdirtyonreinitialize
      keepDirtyOnReinitialize
      onSubmit={onSubmit}
      render={({ handleSubmit }) => {
        return (
          <Drawer
            placement="left"
            title="Reconcile Changes"
            open={reconcilerEditing}
            closable={false}
            maskClosable={false}
            width={744}
            footer={
              <Space data-test="reconciler-drawer-footer">
                <Button type="primary" onClick={handleSubmit}>
                  Apply
                </Button>
                <Button onClick={() => machineSend('UNDO_PLAN_EXECUTION')}>Undo</Button>
              </Space>
            }
          >
            <Box mb={3}>
              <Typography mb={1}>This change caused your Dataset to break!</Typography>

              <Typography>Please review the automated changes below before continuing:</Typography>
            </Box>
            {map(planGroupedByTabName, (entries, tabName) => (
              <Box key={tabName}>
                <Box mb={2}>
                  <Typography type="title400" fontWeight={semiBoldWeight}>
                    {tabName}
                  </Typography>
                </Box>
                <Timeline>
                  {map(groupBy(entries, 'mutation'), (entries, mutation) => {
                    const userGenerated = !entries[0].mavis_created
                    return (
                      <Timeline.Item
                        key={mutation}
                        position="right"
                        dot={userGenerated ? <UserOutlined style={{ fontSize: '16px' }} /> : undefined}
                        color={dotColor(mutation)}
                      >
                        {renderEntries({ mutation, entries })}
                      </Timeline.Item>
                    )
                  })}
                </Timeline>
              </Box>
            ))}
          </Drawer>
        )
      }}
    />
  )
}

export default Reconciler
