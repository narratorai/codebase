import { Spin } from 'antd-next'
import DynamicPlotWithContext from 'components/shared/DynamicPlotWithContext'
import { IMessage, useChat } from 'portal/stores/chats'
import { makePlotCopiedContent } from 'util/shared_content/helpers'
import { useLazyCallMavis } from 'util/useCallMavis'

interface Props {
  data: Record<string, unknown>
  message: IMessage
  chatId: string
  datasetConfig: {
    datasetSlug: string
    groupSlug: string
    plotSlug: string
  }
}

const PlotTabContent = ({ datasetConfig, data, message, chatId }: Props) => {
  const [setMessages] = useChat((state) => [state.setMessages])
  const handlePlotInitialized = () => {
    // TODO: The onPlotInitialized does nothing right now
    // We have to find out if we have to do something here
    // if (message?.id) {
    //   onPlotInitialized(message.id)
    // }
  }

  const formattedPlotData = {
    ...data,
    config: {
      ...(data?.config || {}),
      dataset_slug: datasetConfig.datasetSlug, // include dataset slug for "copy content"/"go to dataset"
    },
  }

  const copyContentValues = makePlotCopiedContent(datasetConfig)

  const [updatePlot, { loading: updatePlotLoading }] = useLazyCallMavis<{ messages: IMessage[] }>({
    method: 'PATCH',
    path: `/v1/chat/${chatId}/messages/${message.id}`,
  })

  const handleEditPlotSubmit = async (plotConfig: any) => {
    const updatedMessage = {
      ...message,
      data: {
        ...message.data,
        plot_config: plotConfig,
      },
    }

    const resp = await updatePlot({ body: updatedMessage })

    if (resp?.messages) {
      setMessages(resp.messages)
    }
  }

  return (
    <Spin spinning={updatePlotLoading}>
      <DynamicPlotWithContext
        contextMeta={{
          groupSlug: datasetConfig.groupSlug as string,
          plotSlug: datasetConfig.plotSlug as string,
          datasetSlug: datasetConfig.datasetSlug,
        }}
        copyContentValues={copyContentValues}
        {...formattedPlotData}
        hideTraining
        hideExplorer
        onEditPlotSubmit={(plotConfig) => {
          handleEditPlotSubmit(plotConfig)
        }}
        onInitialized={handlePlotInitialized}
      />
    </Spin>
  )
}

export default PlotTabContent
