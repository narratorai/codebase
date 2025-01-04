import { IDatacenter_Region_Enum } from 'graph/generated'
import { fetchMavis, postMavis } from 'util/ajax'

import { IRemoteChat, IRemoteChats, IRemoteMessage, IRequest } from './interfaces'

export default class ChatsRepository {
  async findAll(params?: Record<string, unknown>, datacenterRegion?: IDatacenter_Region_Enum | null) {
    return fetchMavis<IRemoteChats, Record<string, unknown>>('/v1/chat', { params, datacenterRegion })
  }

  async create(data: Record<string, unknown>, datacenterRegion?: IDatacenter_Region_Enum | null) {
    return postMavis<IRemoteChat, Record<string, unknown>>('/v1/chat', { data, datacenterRegion })
  }

  async find(chatId: string, datacenterRegion?: IDatacenter_Region_Enum | null) {
    return fetchMavis<IRemoteChat>(`/v1/chat/${chatId}`, { datacenterRegion })
  }

  async rerun(chatId: string, datacenterRegion?: IDatacenter_Region_Enum | null) {
    return fetchMavis<IRemoteMessage>(`/v1/chat/${chatId}/rerun`, { datacenterRegion })
  }

  async fetchInitialSuggestions(datacenterRegion?: IDatacenter_Region_Enum | null) {
    return fetchMavis<{ suggestions: string[] }>('/v1/chat/init', { datacenterRegion })
  }

  async postMessage(chatId: string, data: Record<string, unknown>, datacenterRegion?: IDatacenter_Region_Enum | null) {
    return postMavis<IRemoteMessage, Record<string, unknown>>(`/v1/chat/${chatId}/next`, {
      data,
      datacenterRegion,
    })
  }

  async sendTrainingRequest(
    chatId: string,
    data: Record<string, unknown>,
    datacenterRegion?: IDatacenter_Region_Enum | null
  ) {
    return postMavis<IRequest, Record<string, unknown>>(`/v1/chat/${chatId}/request`, {
      data,
      datacenterRegion,
    })
  }

  async postMessageRating(
    chatId: string,
    messageId: string,
    rating: number,
    datacenterRegion?: IDatacenter_Region_Enum | null
  ) {
    const data = { rating }
    return postMavis(`/v1/chat/${chatId}/vote/${messageId}`, { data, datacenterRegion })
  }

  async analyzePlot(chatId: string, messageId: string, datacenterRegion?: IDatacenter_Region_Enum | null) {
    const data = {}
    return postMavis<IRemoteMessage>(`/v1/chat/${chatId}/analyze/${messageId}`, { data, datacenterRegion })
  }
}
