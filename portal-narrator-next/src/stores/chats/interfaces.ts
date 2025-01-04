import { IRemoteDataset, IRemoteDataTable, IRemoteNarrativeDetails, IRemoteSimplePlot } from '@/stores/datasets'
import { IRemoteJourneyAttributes, IRemoteJourneyConfig, IRemoteJourneyEvents } from '@/stores/journeys'
import { DatacenterRegion } from '@/util/mavisClient'

export enum Role {
  User = 'user',
  Assistant = 'assistant',
  Tool = 'tool',
}

export interface IRemoteAnalyzable {
  featureId: string | null
  featureIds: string[] | null
  featureLabel: string | null
  featureLabels: string[] | null
  impactDirection: string
  isTest: boolean
  kpiFormat: string | null
  kpiId: string | null
  kpiLabel: string | null
  metricId: string | null
  rowName: string | null
  timeOptionId: string | null
  timeResolution: string
}

// TODO: Finish the update once we get the specs
export interface IRemotePlotData {
  analyzable: IRemoteAnalyzable | null
  columnMapping: Record<string, unknown>[]
  datasetId: string
  plotConfig: Record<string, unknown> | null
  plotData: IRemoteSimplePlot // TODO: Determine which type is this
  plotSlug: string
  sql: string
  tableData: Record<string, unknown>
  tabSlug: string
}

export interface IRemoteLoading {
  message: string
  percent: number
}

export enum MessageType {
  UserMessage = 'user_message',
  Reply = 'reply',
  Journey = 'journey',
  Dataset = 'dataset',
  Examples = 'examples',
}

export interface IRemoteMessageData {
  text: string
}

export interface IRemoteReplyData {
  content: string
  suggestions: string[]
}

export interface IRemoteJourneyData {
  attributes: IRemoteJourneyAttributes | null
  config: IRemoteJourneyConfig
  journey: IRemoteJourneyEvents | null
}

export interface IRemoteDatasetData {
  analysisNarrative: IRemoteNarrativeDetails | null
  analyzable: IRemoteAnalyzable | null
  columnMapping: Record<string, unknown>[] | null
  dataset: IRemoteDataset | null
  datasetSlug: string | null
  groupSlug: string | null
  plotData: IRemoteSimplePlot // TODO: Determine which type is this
  plotSlug: string | null
  sql: string | null
  tableData: IRemoteDataTable | null
}

export interface IRemoteEachJourney {
  customer: string
  row: Record<string, unknown>
}

export interface IRemoteExampleData {
  customerColumn: string
  customerKey: string
  datasetSlug: string
  examples: IRemoteEachJourney[]
}

export interface IRemoteLLMMessage {
  content: string | null
  data: IRemoteMessageData | IRemoteReplyData | IRemoteJourneyData | IRemoteDatasetData | IRemoteExampleData | null
  functionName: string | null
  hidden: boolean
  id: string
  isComplete: boolean
  loading: IRemoteLoading
  role: Role
  toolCallId: string | null
  toolRequest: Record<string, unknown> | null
  type: MessageType | null
}

export interface IRemoteChatMessage extends IRemoteLLMMessage {
  createdAt: string
  rating: number
  requestId: string | null
  suggestions: string[]
  updatedAt: string | null
}

export interface IRemoteChatMessageData {
  content: string
}

export interface IRemoteVoteData {
  rating: number
}

export enum RequestType {
  MissingActivity = 'Missing Activity',
  IncorrectData = 'Incorrect Data',
  AIFailedToAnswerMyQuestion = 'AI failed to Answer my question',
  Other = 'Other',
}

export interface IRemoteChatRequestData {
  context: string
  messageId: string | null
  requestType: RequestType
}

export interface IRemoteChatRequestResponse {
  requestId: string
}

export interface IRemoteCreateChatData {
  content: string
  tableId: string
}

export interface IRemoteChatMessages {
  createdAt: string | null
  createdBy: string | null
  id: string
  messages: IRemoteChatMessage[]
  tableId: string
}

export interface IRemoteChat {
  createdAt: string
  createdBy: string | null
  detailedSummary: string | null
  favorited: boolean
  id: string
  sharedWithEveryone: boolean
  summary: string
  tableId: string
  tagIds: string[]
  teamIds: string[]
  totalFavorites: number
}

export interface IRemoteChats {
  data: IRemoteChat[]
  page: number
  perPage: number
  totalCount: number
}

export interface IRemoteRangeParam {
  gte?: string
  lte?: string
}

export interface IRemoteChatsParams {
  createdAt?: IRemoteRangeParam
  favorited?: boolean
  page?: number
  perPage?: number
  search?: string
  tableId?: string
  teamIds?: string[]
  userId?: string
}

export interface IRemoteChatSuggestions {
  data: string[]
  totalCount: number
}

export interface IChat extends IRemoteChat {
  /** Add a message to the end of the chat */
  addMessage: (message: IRemoteChatMessage) => void

  /** Analyze plot message */
  analyzeMessage: (messageId: string, datacenterRegion?: DatacenterRegion) => Promise<IRemoteChatMessage>

  /** Mark chat as favorite */
  favoriteChat: (datacenterRegion?: DatacenterRegion) => Promise<void>

  /** Get the data from the server */
  getMessages: (datacenterRegion?: DatacenterRegion) => Promise<IRemoteChatMessages | null>

  /** Initiate chat conversation */
  initiateChat: (datacenterRegion?: DatacenterRegion) => Promise<void>

  messages: IRemoteChatMessage[]

  /** Post a message to the chat */
  postMessage: (prompt: string, datacenterRegion?: DatacenterRegion) => Promise<void>

  /** Post a rating for a message */
  rateMessage: (messageId: string, rating: number, datacenterRegion?: DatacenterRegion) => Promise<void>

  /** Create a training request for a chat */
  requestTraining: (
    data: IRemoteChatRequestData,
    datacenterRegion?: DatacenterRegion
  ) => Promise<IRemoteChatRequestResponse>

  /** Reset the state */
  reset: () => void

  /** Set attributes on the model */
  set: (attributes: Partial<IRemoteChat> | Partial<Pick<IChat, 'messages'>>) => void

  /** Replace a message with new message */
  setMessage: (messageId: string, message: IRemoteChatMessage) => void

  /** Replace messages with the new set */
  setMessages: (messages: IRemoteChatMessage[]) => void

  /** Unmark chat as favorite */
  unfavoriteChat: (datacenterRegion?: DatacenterRegion) => Promise<void>

  /** Upsert a message in the chat */
  upsertMessage: (message: IRemoteChatMessage) => void
}

export interface IChats extends IRemoteChats {
  /** Convenience to create a new instance of a model within a collection */
  createChat: (data: IRemoteCreateChatData, datacenterRegion?: DatacenterRegion) => Promise<IRemoteChat>

  /** Retrieve a chat from the collection given the chat ID */
  getChat: (chatId: string) => IRemoteChat | null

  /** Fetch the next set of chats from the server */
  getNextPage: (datacenterRegion?: DatacenterRegion) => Promise<IRemoteChats | null>

  params: IRemoteChatsParams | null

  /** Remove a chat from the collection */
  removeChat: (chatId: string) => void

  /** Reset the state */
  reset: () => void

  /** Search chats on the server */
  searchChats: (params?: IRemoteChatsParams, datacenterRegion?: DatacenterRegion) => Promise<IRemoteChats>

  /** Set attributes on the model */
  set: (attributes: Partial<IRemoteChats> | Partial<Pick<IChats, 'params'>>) => void

  /** Add a chat to the beginning of the collection */
  unshiftChat: (chat: IRemoteChat) => void
}

export interface IChatSuggestions extends IRemoteChatSuggestions {
  /** Get suggestions for the chat from the server */
  getSuggestions: (datacenterRegion?: DatacenterRegion) => Promise<IRemoteChatSuggestions>

  /** Reset the state */
  reset: () => void

  selectedSuggestion: string

  /** Set attributes on the model */
  set: (attributes: Partial<Pick<IChatSuggestions, 'totalCount' | 'data' | 'selectedSuggestion'>>) => void

  setSelectedSuggestion: (suggestion: string) => void
}
