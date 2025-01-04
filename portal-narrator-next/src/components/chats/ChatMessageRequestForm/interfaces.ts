import zod from 'zod'

import { RequestType } from '@/stores/chats'

export { RequestType }

export const schema = zod
  .object({
    context: zod.string().min(50).max(5_000),
    requestType: zod.nativeEnum(RequestType),
  })
  .required()

export type IChatMessageRequestFormData = zod.TypeOf<typeof schema>
