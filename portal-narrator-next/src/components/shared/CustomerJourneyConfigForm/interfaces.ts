import zod from 'zod'

import { ActivityAction } from '@/stores/journeys'

export { ActivityAction }

const CustomerSchema = zod.string()
const ActivityActionSchema = zod.nativeEnum(ActivityAction)
const ActivitiesSchema = zod.array(zod.string())
const DateSchema = zod.string().datetime().nullable()
const DateRangeSchema = zod.tuple([DateSchema, DateSchema])

export const schema = zod
  .object({
    customer: CustomerSchema,
    activityAction: ActivityActionSchema,
    activities: ActivitiesSchema,
    dateTimeRange: DateRangeSchema,
  })
  .required()

export type ICustomerJourneyConfigFormData = zod.TypeOf<typeof schema>
