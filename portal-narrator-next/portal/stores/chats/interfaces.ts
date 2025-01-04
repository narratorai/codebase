import { IDatacenter_Region_Enum } from 'graph/generated'

export enum MessageTypes {
  Error = 'Error',
  Text = 'Text',
  ClassifiedQuestion = 'Classified Question',
  DatasetConfig = 'Dataset Config',
  PlotData = 'Plot Data',
  TableData = 'Table Data',
  BrainstormConfig = 'Brainstorm Config',
  CustomerJourneyConfig = 'Customer Journey Config',
  CustomerJourneyData = 'Customer Journey Data',
  ExampleCustomerJourneys = 'Example Journeys',
}

export interface IRemoteMessage {
  id: string
  type: MessageTypes
  data: Record<string, any>
  agent: string | null
  role: 'user' | 'mavis'
  created_at: string
  updated_at: string | null
  suggestions: string[]
  rerun: boolean
  request_id: string | null
  rating: number
}

export interface IRequest {
  request_id: string | null
}

export interface IRemoteChat {
  id: string
  table_id: string
  question: string
  rating: number
  messages: IRemoteMessage[]
  created_at: string
  created_by: string
}

export type IRemoteChats = Omit<IRemoteChat, 'messages'>[]

export interface IChat extends IRemoteChat {
  /** Set attributes on the model */
  set: (data: Partial<IRemoteChat>) => void

  /** Reset the state */
  reset: () => void

  /** Fetch the model from the server */
  fetch: (datacenterRegion?: IDatacenter_Region_Enum | null) => Promise<boolean>

  /** Rerun the chat */
  rerun: (datacenterRegion?: IDatacenter_Region_Enum | null) => Promise<IRemoteMessage>

  /** Add a message to the end of the chat */
  addMessage: (message: IRemoteMessage) => void

  /** Replace a message with new message */
  setMessage: (messageId: string, message: IRemoteMessage) => void

  /** Replace messages with the new set */
  setMessages: (messages: IRemoteMessage[]) => void

  /** Post a message to the chat */
  postMessage: (
    data: Record<string, unknown>,
    datacenterRegion?: IDatacenter_Region_Enum | null
  ) => Promise<IRemoteMessage>

  /** Create a training request for a chat */
  sendTrainingRequest: (
    data: Record<string, unknown>,
    datacenterRegion?: IDatacenter_Region_Enum | null
  ) => Promise<void>

  /** Post a rating for a message */
  postMessageRating: (
    messageId: string,
    rating: number,
    datacenterRegion?: IDatacenter_Region_Enum | null
  ) => Promise<void>

  /** Analyze plot message */
  analyzePlot: (messageId: string, datacenterRegion?: IDatacenter_Region_Enum | null) => Promise<void>
}

export interface IChats {
  total: number
  chats: IRemoteChats

  /** Fetch the collection from the server */
  fetch: (params?: Record<string, unknown>, datacenterRegion?: IDatacenter_Region_Enum | null) => Promise<IRemoteChats>

  /** Convenience to create a new instance of a model within a collection */
  create: (data: Record<string, unknown>, datacenterRegion?: IDatacenter_Region_Enum | null) => Promise<IRemoteChat>

  /** Perform an update of the collection. */
  set: (attrs: Partial<{ chats: IRemoteChats }>) => void

  /** Add a model to the beginning of the collection */
  unshift: (chat: IRemoteChats[0]) => void

  /** Remove a model from the collection. */
  remove: (chatId: string) => void
}

export interface IChatsSuggestions {
  initialSuggestions: string[]
  selectedSuggestion: string

  /** Set attributes on the model */
  set: (attrs: Partial<{ initialSuggestions: string[]; selectedSuggestion: string }>) => void

  /** Fetch initial suggestions for the chat from the server */
  fetchInitialSuggestions: () => Promise<void>
}
