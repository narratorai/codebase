import { Button, Popconfirm, Spin } from 'antd-next'
import { Modal } from 'components/antd/staged'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { useUpdateDataset } from 'components/Datasets/hooks'
import Loader from 'components/shared/icons/Loader'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { lazy, Suspense, useContext, useState } from 'react'
import { Field, Form } from 'react-final-form'
import { IDatasetFormContext } from 'util/datasets/interfaces'
import { jsonValidation } from 'util/forms'

const JsonField = lazy(() => import(/* webpackChunkName: "json-field" */ 'components/shared/jawns/forms/JsonField'))

interface Props {
  value: string
  onClose: () => void
}

// Effectively a duplicate of EditNarrativeConfigOverlay
const DatasetJsonModal = ({ value, onClose }: Props) => {
  const [updatedQueryDefinition, setUpdatedQueryDefinition] = useState()
  const { machineCurrent, machineSend } = useContext<IDatasetFormContext>(DatasetFormContext)
  const dataset = machineCurrent.context._dataset_from_graph

  // This gets fired only on a successful update! (not on new):
  const onUpdateSuccess = () => {
    machineSend('UPDATE_QUERY_DEFINITION', { data: { queryDefinition: updatedQueryDefinition } })
    // close modal
    onClose()
  }

  const [updateDataset, { loading, error }] = useUpdateDataset({
    isCreating: false,
    onUpdateSuccess,
  })

  const onSubmit = async ({ json }: { json: string }) => {
    const queryDefinition = JSON.parse(json)

    if (dataset && queryDefinition) {
      setUpdatedQueryDefinition(queryDefinition)

      await updateDataset({
        queryDefinition,
        name: dataset?.name,
        id: dataset?.id,
        slug: dataset?.slug,
        description: dataset?.description,
        status: dataset?.status,
        materializations: dataset?.materializations || [],
      })
    }
  }

  return (
    <Modal
      title={<Typography type="title400">Edit Dataset Query Definition JSON</Typography>}
      width="80%"
      footer={null}
      open
      onCancel={onClose}
    >
      <Box style={{ minHeight: 400 }}>
        <Spin spinning={loading}>
          <Flex>
            <Box flexGrow={1} style={{ overflow: 'auto' }} px="24px" width="100%">
              {error && (
                <Typography type="body100" color="red500" mb="24px">
                  Error: {error?.message}
                </Typography>
              )}

              <Form
                onSubmit={onSubmit}
                initialValues={{ json: value }}
                render={({ handleSubmit }) => (
                  <Box>
                    <Box mb="24px" style={{ height: '70vh' }}>
                      <Field
                        name="json"
                        validate={jsonValidation}
                        render={({ input }) => (
                          <Suspense fallback={null}>
                            <JsonField height="70vh" {...input} />
                          </Suspense>
                        )}
                      />
                    </Box>
                    <Box width="200px">
                      {loading ? (
                        <Loader width={30} height={30} />
                      ) : (
                        <Popconfirm
                          title="This is a dangerous operation. It's difficult to undo!"
                          onConfirm={handleSubmit}
                          okText="Update Query Definition"
                        >
                          <Button>Update</Button>
                        </Popconfirm>
                      )}
                    </Box>
                  </Box>
                )}
              />
            </Box>
          </Flex>
        </Spin>
      </Box>
    </Modal>
  )
}

export default DatasetJsonModal
