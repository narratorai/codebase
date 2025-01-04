import { ActivityAction } from '@/stores/journeys'

const data = {
  customer: {
    customer: 'customer@example.com',
    customerDisplayName: 'Customer Display Name',
  },
  customerOptions: [],
  activities: [
    {
      name: 'Activity 1',
      id: 'activity1',
      slug: 'activity1',
      description: 'Activity 1 description',
    },
    {
      name: 'Activity 2',
      id: 'activity2',
      slug: 'activity2',
      description: 'Activity 2 description',
    },
    {
      name: 'Activity 3',
      id: 'activity3',
      slug: 'activity3',
      description: 'Activity 3 description',
    },
  ],
  activityAction: ActivityAction.Include,
  fromTime: '2024-03-30T00:00:00.000Z',
  toTime: '2024-07-30T00:00:00.000Z',
}

export default data
