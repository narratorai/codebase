import { InfoCircleOutlined } from '@ant-design/icons'
import { App, Checkbox, Input, Spin, Tooltip } from 'antd-next'
import { FormItem, Modal } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { DashboardType } from 'components/Narratives/Dashboards/DashboardIndex/interfaces'
import { useDuplicateNarrative } from 'components/Narratives/hooks'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { INarrative } from 'graph/generated'
import { isEmpty } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { handleMavisErrorNotification } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'
import useToggle from 'util/useToggle'

interface Props {
  narrative?: INarrative | DashboardType
  onClose: () => void
  isDashboard?: boolean
}

const DuplicateNarrativeModal = ({ narrative, onClose, isDashboard = false }: Props) => {
  const { notification } = App.useApp()
  const company = useCompany()
  const history = useHistory()

  // newNarrativeName comes from input box - allowing user to rename the new column
  const [newNarrativeName, setNewNarrativeName] = useState(`${narrative?.name} Copy` || '')
  const prevNewNarrativeName = usePrevious(newNarrativeName)

  const [duplicateDatasets, toggleDuplicateDatasets] = useToggle(true)

  const [
    duplicateNarrative,
    { loading: duplicateLoading, saved: duplicateSaved, data: duplicateResponse, error: duplicateError },
  ] = useDuplicateNarrative()

  // handle duplicate error
  useEffect(() => {
    if (duplicateError) {
      handleMavisErrorNotification({ error: duplicateError, notification })
    }
  }, [duplicateError, notification])

  // make sure newNarrativeName has a value if it has never been set before
  useEffect(() => {
    if (isEmpty(prevNewNarrativeName) && isEmpty(newNarrativeName) && narrative) {
      setNewNarrativeName(`${narrative?.name} Copy`)
    }
  }, [narrative, prevNewNarrativeName, newNarrativeName])

  // When successfully duplicated, navigate to new narrative edit
  useEffect(() => {
    if (duplicateSaved && duplicateResponse) {
      onClose()
      history.push(
        `/${company.slug}/${isDashboard ? 'dashboards' : 'narratives'}/edit/${duplicateResponse?.narrative_slug}`
      )
    }
  }, [duplicateSaved, duplicateResponse, history, company, onClose, isDashboard])

  const handleOk = () => {
    duplicateNarrative({ name: newNarrativeName, id: narrative?.id, duplicate_datasets: duplicateDatasets })
  }

  return (
    <Modal
      title={
        <Typography type="title400">
          Duplicate: <b>{narrative?.name}</b>
        </Typography>
      }
      open={!isEmpty(narrative)}
      onCancel={() => {
        onClose()
      }}
      onOk={() => {
        handleOk()
      }}
      okButtonProps={{ disabled: isEmpty(newNarrativeName) }}
    >
      <Spin spinning={duplicateLoading}>
        <Box>
          <FormItem label={`Rename your new ${isDashboard ? 'dashboard' : 'analysis'}`} layout="vertical">
            <Input
              defaultValue={`${narrative?.name} Copy`}
              onChange={(e) => {
                setNewNarrativeName(e.target.value)
              }}
              style={{ minWidth: 472 }}
            />
          </FormItem>

          <Checkbox checked={duplicateDatasets} onClick={toggleDuplicateDatasets}>
            <Flex alignItems="center">
              <Typography mr={1}>Also duplicate all dependent datasets</Typography>
              <Tooltip
                title={
                  <Box>
                    <Typography mb={1}>
                      If checked, any datasets used in this analysis will also be duplicated.
                    </Typography>
                    <Typography>
                      If unchecked, the new analysis will reference the original dataset used, creating a shared
                      dependency on the orignal dataset.
                    </Typography>
                  </Box>
                }
              >
                <InfoCircleOutlined />
              </Tooltip>
            </Flex>
          </Checkbox>
        </Box>
      </Spin>
    </Modal>
  )
}

export default DuplicateNarrativeModal
