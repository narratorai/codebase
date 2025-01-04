import { cleanTreeData } from './helpers'

const treeData = [
  {
    title: '1',
    value: '1',
    selectable: false,
    children: [
      {
        title: '1a',
        value: '1a',
        selectable: false,
        children: [
          {
            title: '1ab',
            value: '1ab',
          },
          {
            title: '1ac',
            value: '1ac',
          },
        ],
      },
    ],
  },
  {
    title: '2',
    value: '2',
    selectable: false,
    children: [
      {
        title: '2a',
        value: '2a',
        selectable: false,
        children: [
          {
            title: '2ab',
            value: '2ab',
          },
          {
            title: '2ac',
            value: '2ac',
          },
          {
            title: '2ad',
            value: '2ad',
            selectable: false,
            children: [
              {
                title: '2adb',
                value: '2adb',
              },
              {
                title: '2adc',
                value: '2adc',
              },
            ],
          },
        ],
      },
    ],
  },
]

describe('#cleanTreeData', () => {
  it('returns an empty array if no enumValues present', () => {
    const enumValues = []
    expect(cleanTreeData({ treeData, enumValues })).toStrictEqual([])
  })

  it('returns one tree item when passed enumValues that matches only one tree item', () => {
    const enumValues = ['1ac']
    const cleanedData = cleanTreeData({ treeData, enumValues })
    expect(cleanedData).toStrictEqual([
      {
        title: '1',
        value: '1',
        selectable: false,
        children: [
          {
            title: '1a',
            value: '1a',
            selectable: false,
            children: [
              {
                title: '1ac',
                value: '1ac',
              },
            ],
          },
        ],
      },
    ])

    expect(cleanedData.length).toBe(1)
  })

  it('returns two tree items when passed enumValues that matches two tree items', () => {
    const enumValues = ['1ac', '2adc']
    const cleanedData = cleanTreeData({ treeData, enumValues })
    expect(cleanedData).toStrictEqual([
      {
        title: '1',
        value: '1',
        selectable: false,
        children: [
          {
            title: '1a',
            value: '1a',
            selectable: false,
            children: [
              {
                title: '1ac',
                value: '1ac',
              },
            ],
          },
        ],
      },
      {
        title: '2',
        value: '2',
        selectable: false,
        children: [
          {
            title: '2a',
            value: '2a',
            selectable: false,
            children: [
              {
                title: '2ad',
                value: '2ad',
                selectable: false,
                children: [
                  {
                    title: '2adc',
                    value: '2adc',
                  },
                ],
              },
            ],
          },
        ],
      },
    ])

    expect(cleanedData.length).toBe(2)
  })
})
