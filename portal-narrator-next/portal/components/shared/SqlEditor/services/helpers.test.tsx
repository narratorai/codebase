import { render } from '@testing-library/react'

import schemasData from '../../../../../test/fixtures/schemasData.json'
import { makeHighlightData, makeHighlightText, makeTreeData } from './helpers'

describe('#makeHighlightData', () => {
  it('should highlight text that matches the search value', () => {
    const highlightText = makeHighlightText(makeHighlightData('narrator', 'narra')) as JSX.Element
    const { asFragment } = render(highlightText)

    expect(asFragment()).toMatchSnapshot()
  })

  it('should not highlight any text if there is no match', () => {
    const highlightedText = makeHighlightText(makeHighlightData('narrator', 'xyz')) as JSX.Element
    const { asFragment } = render(highlightedText)

    expect(asFragment()).toMatchSnapshot(`"narrator"`)
  })
})

describe('#makeTreeData', () => {
  it('should make tree data from schemasData', () => {
    const treeData = makeTreeData(schemasData)
    expect(treeData).toEqual([
      {
        children: [
          {
            children: [
              {
                key: '0-0-0-0',
                title: 'author',
              },
              {
                key: '0-0-0-1',
                title: 'commit',
              },
              {
                key: '0-0-0-2',
                title: 'date',
              },
              {
                key: '0-0-0-3',
                title: 'details',
              },
              {
                key: '0-0-0-4',
                title: 'repo',
              },
            ],
            key: '0-0-0',
            title: 'github_dump',
          },
          {
            children: [
              {
                key: '0-0-1-0',
                title: '_fivetran_deleted',
              },
              {
                key: '0-0-1-1',
                title: '_fivetran_synced',
              },
              {
                key: '0-0-1-2',
                title: 'category_id',
              },
              {
                key: '0-0-1-3',
                title: 'company_id',
              },
              {
                key: '0-0-1-4',
                title: 'created_at',
              },
              {
                key: '0-0-1-5',
                title: 'deleted_at',
              },
              {
                key: '0-0-1-6',
                title: 'description',
              },
              {
                key: '0-0-1-7',
                title: 'id',
              },
              {
                key: '0-0-1-8',
                title: 'is_key',
              },
              {
                key: '0-0-1-9',
                title: 'is_pending',
              },
              {
                key: '0-0-1-10',
                title: 'kind',
              },
              {
                key: '0-0-1-11',
                title: 'level',
              },
              {
                key: '0-0-1-12',
                title: 'name',
              },
              {
                key: '0-0-1-13',
                title: 'script_lifecycle',
              },
              {
                key: '0-0-1-14',
                title: 'slug',
              },
              {
                key: '0-0-1-15',
                title: 'status',
              },
              {
                key: '0-0-1-16',
                title: 'updated_at',
              },
            ],
            key: '0-0-1',
            title: 'activities',
          },
        ],
        key: '0-0',
        title: 'ahmed_data',
      },
      {
        children: [
          {
            children: [
              {
                key: '0-1-0-0',
                title: '_fivetran_deleted',
              },
              {
                key: '0-1-0-1',
                title: '_fivetran_synced',
              },
              {
                key: '0-1-0-2',
                title: 'category_id',
              },
              {
                key: '0-1-0-3',
                title: 'company_id',
              },
              {
                key: '0-1-0-4',
                title: 'created_at',
              },
              {
                key: '0-1-0-5',
                title: 'deleted_at',
              },
              {
                key: '0-1-0-6',
                title: 'description',
              },
              {
                key: '0-1-0-7',
                title: 'id',
              },
              {
                key: '0-1-0-8',
                title: 'is_key',
              },
              {
                key: '0-1-0-9',
                title: 'is_pending',
              },
              {
                key: '0-1-0-10',
                title: 'kind',
              },
              {
                key: '0-1-0-11',
                title: 'level',
              },
              {
                key: '0-1-0-12',
                title: 'name',
              },
              {
                key: '0-1-0-13',
                title: 'script_lifecycle',
              },
              {
                key: '0-1-0-14',
                title: 'slug',
              },
              {
                key: '0-1-0-15',
                title: 'status',
              },
              {
                key: '0-1-0-16',
                title: 'updated_at',
              },
            ],
            key: '0-1-0',
            title: 'activities',
          },
          {
            children: [
              {
                key: '0-1-1-0',
                title: '_fivetran_deleted',
              },
              {
                key: '0-1-1-1',
                title: '_fivetran_synced',
              },
              {
                key: '0-1-1-2',
                title: 'company_id',
              },
              {
                key: '0-1-1-3',
                title: 'created_at',
              },
              {
                key: '0-1-1-4',
                title: 'deleted_at',
              },
              {
                key: '0-1-1-5',
                title: 'description',
              },
              {
                key: '0-1-1-6',
                title: 'happened_at',
              },
              {
                key: '0-1-1-7',
                title: 'id',
              },
              {
                key: '0-1-1-8',
                title: 'kind',
              },
              {
                key: '0-1-1-9',
                title: 'name',
              },
              {
                key: '0-1-1-10',
                title: 'segment_id',
              },
              {
                key: '0-1-1-11',
                title: 'updated_at',
              },
              {
                key: '0-1-1-12',
                title: 'user_id',
              },
            ],
            key: '0-1-1',
            title: 'annotations',
          },
        ],
        key: '0-1',
        title: 'api_db_public',
      },
    ])
  })
})
