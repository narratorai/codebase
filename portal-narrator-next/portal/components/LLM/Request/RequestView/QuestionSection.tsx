/* eslint-disable react/jsx-max-depth */
import { Divider, Flex, Layout, Space } from 'antd-next'
import { Typography } from 'components/shared/jawns'
import { isBoolean } from 'lodash'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { getLogger } from '@/util/logger'

import ActivitySelect from './ActivitySelect'
import Answer from './Answer'
import DatasetActivityRadio from './DatasetActivityRadio'
import DatasetSelects from './DatasetSelects'
import { ViewRequest } from './interfaces'
import QuestionFooter from './QuestionFooter'
import { HEADER_HEIGHT } from './RequestViewHeader'
import SendEmailToggle from './SendEmailToggle'

const logger = getLogger()

interface FormValue {
  answer: string
  assigned_to?: string | null
  context: string
  dataset_id?: string | null
  group_slug?: string | null
  plot_slug?: string | null
  activity?: string
  use_for_training: boolean
  email_requester: boolean
}
interface Props {
  request: ViewRequest
}

const QuestionSection = ({ request }: Props) => {
  const methods = useForm<FormValue>({
    defaultValues: {
      answer: '',
      assigned_to: request.assignee?.id || null,
      context: request.context || '',
      dataset_id: request.dataset_id,
      group_slug: request.group_slug,
      plot_slug: request.plot_slug,
      email_requester: isBoolean(request.email_requester) ? request.email_requester : true,
      // TODO: activity, answer, and use_for_training are not currently saved in a graph table
      // these will need to be added there (and to query) to so we don't loose values after save
      use_for_training: false,
    },
  })

  const [datasetOrActivity, setDatasetOrActivity] = useState<'dataset' | 'activity'>('dataset')
  const handleDatasetOrActivityChange = (value: 'dataset' | 'activity') => {
    setDatasetOrActivity(value)
  }

  const { handleSubmit } = methods

  const handleSubmitFormValues = handleSubmit((formValue: FormValue) => {
    // TODO: handle submit
    logger.info({ formValue }, 'on submit')
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmitFormValues} style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>
        <Flex vertical justify="space-between" style={{ height: '100%' }}>
          <Layout style={{ overflowY: 'auto', backgroundColor: '#FFFFFF' }}>
            <Space direction="vertical" size={16} style={{ padding: '24px' }}>
              <Typography fontWeight="700" fontSize="16px" style={{ paddingBottom: '4px' }}>
                Question
              </Typography>
              <Space size={4}>
                <Typography fontWeight="700">Type:</Typography> <Typography>{request.type || ''}</Typography>
              </Space>

              <Space direction="vertical" size={2}>
                <Typography fontWeight="700">The context the user provided:</Typography>
                <Typography>{request.context || ''}</Typography>
              </Space>
            </Space>
            <Divider style={{ margin: '0' }} />
            <Space direction="vertical" size={16} style={{ padding: '24px' }}>
              <Typography fontWeight="700" fontSize="16px" style={{ paddingBottom: '4px' }}>
                Response
              </Typography>
              <DatasetActivityRadio
                value={datasetOrActivity}
                onChange={handleDatasetOrActivityChange}
                disabled={request.status === 'completed'}
              />
              {datasetOrActivity === 'dataset' && <DatasetSelects disabled={request.status === 'completed'} />}
              {datasetOrActivity === 'activity' && <ActivitySelect disabled={request.status === 'completed'} />}
              <Answer disabled={request.status === 'completed'} />
              <SendEmailToggle disabled={request.status === 'completed'} />
            </Space>
          </Layout>

          <QuestionFooter request={request} />
        </Flex>
      </form>
    </FormProvider>
  )
}

export default QuestionSection
