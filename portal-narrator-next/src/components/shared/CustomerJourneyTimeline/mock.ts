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

const data = generateEvents()

export default data
