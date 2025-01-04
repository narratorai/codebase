const getAttribute = (index: number) => ({
  name: `Attribute ${index}`,
  value: `value${index}`,
})

const generateAttributes = (count: number, generator: any) => Array.from(new Array(count), (e, i) => generator(i))

const getRow = (index: number, time: string) => ({
  id: `id ${index}`,
  ts: time,
  activity: `Activity ${index}`,
  attributes: Array.from(new Array(index), (e, i) => ({
    name: `Attribute ${index + i}`,
    value: `value${index + i}`,
  })),
  occurrence: index,
  revenue: 11.95 * index,
  link: `https://example.com/${index}`,
})

const generateEvents = () => {
  const events = []
  let value = 0
  for (let i = 0; i < 5; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      const date = `2024-05-${16 + i}T${13 + i + j}:30:45.678+00:00`
      events.push(getRow(value, date))
      value += 1
    }
  }
  return events
}

import { ActivityAction } from '@/stores/journeys'

const config = {
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

const attributes = {
  attributes: generateAttributes(5, getAttribute),
  nullAttributes: generateAttributes(5, (i: number) => `Null Attribute ${i}`),
}

const events = {
  totalCount: 5,
  page: 1,
  perPage: 100,
  data: generateEvents(),
}

const data = {
  attributes,
  events,
  config,
}

export default data
