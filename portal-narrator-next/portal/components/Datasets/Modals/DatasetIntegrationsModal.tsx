import { Modal, Spin } from 'antd-next'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { compact, isEmpty, map } from 'lodash'
import { useCallback, useContext, useEffect, useState } from 'react'
import { Form } from 'react-final-form'
import { colors } from 'util/constants'
import { getQueryDefinition } from 'util/datasets/api'
import { IDatasetQueryDefinition } from 'util/datasets/interfaces'
import { ALL_INTEGRATIONS, INTEGRATION_TYPE_TEXT } from 'util/datasets/v2/integrations/constants'
import { getIntegrationConfig } from 'util/datasets/v2/integrations/helpers'
import { arrayMutators } from 'util/forms'
import useCallMavis from 'util/useCallMavis'

import DatasetFormContext from '../BuildDataset/DatasetFormContext'
import AddIntegrationButton from './AddIntegrationButton'
import IntegrationsFormFields from './IntegrationsFormFields'

interface Props {
  queryDefinition?: IDatasetQueryDefinition
}

const DatasetIntegrationsModal = ({ queryDefinition }: Props) => {
  const flags = useFlags()
  const { getTokenSilently: getToken } = useAuth0()
  const company = useCompany()
  const { user, isCompanyAdmin } = useUser()
  const [loadedQueryDefinition, setLoadedQueryDefinition] = useState<IDatasetQueryDefinition | undefined>()

  const { machineSend, machineCurrent, dataset } = useContext(DatasetFormContext) || {}
  const processing = machineCurrent.matches({ api: 'updating_integrations' })

  const { response: integrationResponse, loading: getIntegrationsLoading } = useCallMavis({
    method: 'GET',
    path: '/v1/dataset/integrations',
    params: { slug: dataset.slug },
  })

  const handleOnClose = useCallback(() => {
    machineSend('EDIT_INTEGRATIONS_CANCEL')
  }, [machineSend])

  const handleOnSubmit = useCallback(
    (formValue: any) => {
      machineSend('EDIT_INTEGRATIONS_SUBMIT', { formValue, dataset })
    },
    [machineSend, dataset]
  )

  // load dataset query definition (when in the index!) to be able to load available groups for selects:
  useEffect(() => {
    const getQueryDefinitionAsync = async () => {
      const queryDefinition = await getQueryDefinition({
        getToken,
        company,
        datasetSlug: dataset.slug,
      })

      setLoadedQueryDefinition(queryDefinition)
    }

    if (dataset.slug && company && !queryDefinition) {
      getQueryDefinitionAsync()
    }
  }, [getToken, company, dataset.slug, queryDefinition])

  // We pass the query definition in from the edit dataset view, so prioritize that one
  const currentQueryDefinition = queryDefinition || loadedQueryDefinition

  const initialValues = {
    ...dataset,
    materializations: integrationResponse || [],
  }

  // extra check to make sure we don't show this modal
  // if the dataset wasn't created by the user and isn't a company admin
  const notAllowedToAccess = user.id !== dataset?.created_by && !isCompanyAdmin
  if (notAllowedToAccess) {
    return null
  }

  return (
    <Form
      onSubmit={handleOnSubmit}
      // stop flash of old values on submit
      keepDirtyOnReinitialize
      initialValues={initialValues}
      mutators={arrayMutators}
      render={({ handleSubmit, invalid }) => {
        return (
          <Modal
            title={
              <Typography type="title400">
                Update Integrations: <b>{dataset.name}</b>
              </Typography>
            }
            width="100%"
            style={{ maxWidth: 840 }}
            open
            onCancel={handleOnClose}
            okText="Save"
            okButtonProps={{ disabled: invalid, 'data-test': 'integration-save-cta' }}
            onOk={handleSubmit}
          >
            <Flex data-test="integrations-modal-content">
              <Box p={2} bg="gray200" style={{ width: 200, minWidth: 200 }} data-public>
                <Box mb={3}>
                  <AddIntegrationButton />
                </Box>
                {compact(
                  map(ALL_INTEGRATIONS, (integrationType) => {
                    // Only show Text CSV for flagged users
                    if (integrationType === INTEGRATION_TYPE_TEXT && !flags['text-csv']) {
                      return null
                    }

                    // Otherwise show display name and description in sidebar
                    return (
                      <div key={integrationType}>
                        <Typography type="body200" fontWeight="bold" mb="2px">
                          {getIntegrationConfig(integrationType).displayName}
                        </Typography>

                        {!isEmpty(getIntegrationConfig(integrationType).description) && (
                          <Typography type="body200" mb={2}>
                            {getIntegrationConfig(integrationType).description}
                          </Typography>
                        )}
                      </div>
                    )
                  })
                )}
              </Box>

              <Flex
                style={{ flex: 1, maxHeight: '70vh', overflow: 'auto' }}
                flexDirection="column"
                justifyContent="space-between"
                p={2}
              >
                <Spin
                  spinning={processing || !currentQueryDefinition || getIntegrationsLoading}
                  style={{ width: '100%' }}
                >
                  {currentQueryDefinition && <IntegrationsFormFields queryDefinition={currentQueryDefinition} />}
                </Spin>

                <Typography color={colors.gray500} mt={1} ml={5}>
                  **Creating an integration will trigger an auto run. If an integration has a schedule, it will take
                  effect after the auto run.
                </Typography>
              </Flex>
            </Flex>
          </Modal>
        )
      }}
    />
  )
}

export default DatasetIntegrationsModal
