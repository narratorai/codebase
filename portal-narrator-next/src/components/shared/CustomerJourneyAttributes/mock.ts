const getAttribute = (index: number) => ({
  name: `Attribute ${index}`,
  value: `value${index}`,
})

const generateAttributes = (count: number, generator: any) => Array.from(new Array(count), (e, i) => generator(i))

const data = {
  attributes: generateAttributes(5, getAttribute),
  nullAttributes: generateAttributes(5, (i: number) => `Null Attribute ${i}`),
}

export default data
