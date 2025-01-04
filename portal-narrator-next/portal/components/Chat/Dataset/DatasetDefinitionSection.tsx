import { Flex, Spin, Switch } from 'antd-next'
import { ADD_JOIN_ACTIVITY_BUTTON_ID } from 'components/Datasets/BuildDataset/tools/DatasetDefinition/AppendActivities'
import { IMessage, useChat } from 'portal/stores/chats'
import styled, { css } from 'styled-components'
import { useLazyCallMavis } from 'util/useCallMavis'

import DatasetDefinition from './DatasetDefinition'
import { FormValue, PlotKind } from './interfaces'

// In View mode:
// 1) Hide the add Join Activity and add Column Filter buttons
// 2) disable pointer events (can't interact with the dataset definition)
const DatasetDefinitionWrapper = styled.div<{ isViewMode: boolean }>`
  ${({ isViewMode }) =>
    isViewMode &&
    css`
      #${ADD_JOIN_ACTIVITY_BUTTON_ID} {
        display: none;
      }

      pointer-events: none;
    `}
`

export interface IChatResponse extends IMessage {
  data: {
    make_definition: any
    dataset_slug: string
    group_slug: string
    plot_slug: string
    filters: Record<string, unknown>[]
    columns: Record<string, unknown>[]
    y_columns: { id: string; label: string }[] // These are the source options and probably shouldn't be here
    x_color_columns: { name: string; label: string }[] // These are the source options and probably shouldn't be here
    plot: {
      ys: string[]
      xs: string[]
      color_bys: string[]
      plot_kind?: PlotKind
    }
    group_filters: Record<string, unknown>[]
    group_columns: Record<string, unknown>[]
  }
}

interface Props {
  chatId: string
  message: IChatResponse
  isViewMode: boolean
  toggleMode: () => void
}

const DatasetDefinitionSection = ({ chatId, message, isViewMode, toggleMode }: Props) => {
  const [setMessages] = useChat((state) => [state.setMessages])

  const [updateDefinition, { loading: updateDefinitionLoading }] = useLazyCallMavis<{ messages: IMessage[] }>({
    method: 'PATCH',
    path: `/v1/chat/${chatId}/messages/${message.id}`,
  })

  const handleSubmit = async (formValue: FormValue) => {
    const updatedMessage = {
      ...message,
      data: {
        ...message.data,
        filters: formValue.filters,
        group_filters: formValue.group_filters,
        make_definition: formValue,
        plot: formValue.plot,
      },
    }
    const resp = await updateDefinition({ body: updatedMessage })

    if (resp?.messages) {
      setMessages(resp.messages)
    }
  }

  const datasetValues = message?.data?.make_definition || {}
  const cohortColumnOptions = {
    activity_ids: datasetValues?.cohort?.activity_ids,
    filter_options: datasetValues?.cohort?.raw_columns,
    select_options: datasetValues?.cohort?.all_columns,
  }

  const appendColumnOptions =
    datasetValues?.append_activities?.map((appendActivity: any) => ({
      activity_ids: appendActivity.activity_ids,
      filter_options: appendActivity.raw_columns,
      select_options: appendActivity.all_columns,
      relationship_slug: appendActivity.relationship_slug,
    })) || []

  const startingValues = {
    ...datasetValues,
    column_options: [
      // add cohort columns to column_options
      cohortColumnOptions,
      // add append columns to column_options
      ...appendColumnOptions,
    ],
    filters: message?.data?.filters || [],
    columns: message?.data?.columns || [],
    y_columns: message?.data?.y_columns || [], // These are the source options and probably shouldn't be here
    x_color_columns: message?.data?.x_color_columns || [], // These are the source options and probably shouldn't be here
    plot: message?.data?.plot || { ys: [], xs: [], color_bys: [] },
    group_filters: message?.data?.group_filters || [],
    group_columns: message?.data?.group_columns || [],
  }

  return (
    <Spin spinning={updateDefinitionLoading}>
      <Flex justify="flex-end">
        <Switch checkedChildren="Edit" unCheckedChildren="View" checked={!isViewMode} onChange={toggleMode} />
      </Flex>

      <DatasetDefinitionWrapper isViewMode={isViewMode}>
        <DatasetDefinition values={startingValues} onSubmit={handleSubmit} isViewMode={isViewMode} />
      </DatasetDefinitionWrapper>
    </Spin>
  )
}

export default DatasetDefinitionSection
