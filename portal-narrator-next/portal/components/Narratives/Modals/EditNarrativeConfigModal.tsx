import { Button, Spin } from 'antd-next'
import { Modal } from 'components/antd/staged'
import Loader from 'components/shared/icons/Loader'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { INarrative } from 'graph/generated'
import { isEmpty } from 'lodash'
import React, { lazy, Suspense } from 'react'
import { Field, Form } from 'react-final-form'
import { jsonValidation } from 'util/forms'

import { DashboardType } from '../Dashboards/DashboardIndex/interfaces'
import { useLoadConfig, useUpdateConfig } from '../hooks'

const JsonField = lazy(() => import(/* webpackChunkName: "json-field" */ 'components/shared/jawns/forms/JsonField'))

interface Props {
  onClose: Function
  narrative?: INarrative | DashboardType
  isDashboard?: boolean
}

const EditNarrativeConfigModal = ({ onClose, narrative, isDashboard = false }: Props) => {
  const { response: narrativeConfigFile, loading, error: errorLoading } = useLoadConfig(narrative?.slug)
  const [updateConfig, { loading: saving, error: errorSaving }] = useUpdateConfig()

  const onSubmit = async ({ json }: { json: string }) => {
    const updatedNarrativeConfig = JSON.parse(json)

    if (narrative && narrative?.slug) {
      await updateConfig({
        narrativeSlug: narrative?.slug,
        updatedNarrativeConfig,
      })
    }
  }

  const initialValues = {
    json: isEmpty(narrativeConfigFile) ? '{}' : JSON.stringify(narrativeConfigFile, null, 4),
  }

  return (
    <Modal
      title={
        <Typography type="title400">
          Edit {isDashboard ? 'Dashboard' : 'Narrative'} Config: <b>{narrative?.name}</b>
        </Typography>
      }
      width="80%"
      footer={null}
      open={!isEmpty(narrative)}
      onCancel={() => {
        onClose()
      }}
    >
      <Spin spinning={loading || saving}>
        <Flex>
          <Box flexGrow={1} style={{ overflow: 'auto' }} px="24px" width="100%">
            {errorSaving && (
              <Typography type="body100" color="red500" mb="24px">
                Error: {errorSaving?.message}
              </Typography>
            )}

            {errorLoading && (
              <Typography type="body100" color="red500" mb="24px">
                Error: {errorLoading?.message}
              </Typography>
            )}

            <Form
              onSubmit={onSubmit}
              initialValues={initialValues}
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
                    {saving || loading ? (
                      <Loader width={30} height={30} />
                    ) : (
                      <Button onClick={handleSubmit}>Update</Button>
                    )}
                  </Box>
                </Box>
              )}
            />
          </Box>
        </Flex>
      </Spin>
    </Modal>
  )
}

export default EditNarrativeConfigModal
