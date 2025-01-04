import { sortNarratives } from './helpers'
import { FAVORITES, RECENTLY_VIEWED } from '../../../../components/shared/IndexPages/constants'

const CREATED_RECENTLY_NO_TAGS_ID = 'created-recently-no-tags'
const CREATED_RECENTLY_AND_RECENTLY_VIEWED_ID = 'created-recently-and-recently-viewed'
const CREATED_RECENTLY_AND_FAVORITE_ID = 'created-recently-and-favorite'

const CREATED_LONG_AGO_NO_TAGS_ID = 'created-long-ago-no-tags'
const CREATED_LONG_AGO_AND_RECENTLY_VIEWED_ID = 'created-long-ago-and-recently-viewed'
const CREATED_LONG_AGO_AND_FAVORITE_ID = 'created-long-ago-and-favorite'

describe('#sortNarratives', () => {
  const createdRecentlyNoTags = {
    id: CREATED_RECENTLY_NO_TAGS_ID,
    created_at: '2023-08-29T12:00:00.000000+00:00',
    tags: [],
  }

  const createdRecentlyNoTagsWithMeta = {
    ...createdRecentlyNoTags,
    _favorite: '1',
    _recentlyViewedOrCreatedAt: '2023-08-29T12:00:00.000000+00:00',
  }

  const createdRecentlyAndRecentlyViewed = {
    id: CREATED_RECENTLY_AND_RECENTLY_VIEWED_ID,
    created_at: '2023-08-29T12:00:00.000000+00:00',
    tags: [
      {
        id: '1234',
        updated_at: '2023-10-29T12:00:00.000000+00:00',
        company_tag: {
          id: '4567',
          tag: RECENTLY_VIEWED,
        },
      },
    ],
  }

  const createdRecentlyAndRecentlyViewedWithMeta = {
    ...createdRecentlyAndRecentlyViewed,
    _favorite: '1',
    _recentlyViewedOrCreatedAt: '2023-10-29T12:00:00.000000+00:00',
  }

  const createdRecentlyAndFavorite = {
    id: CREATED_RECENTLY_AND_FAVORITE_ID,
    created_at: '2023-08-29T12:00:00.000000+00:00',
    tags: [
      {
        id: '678',
        updated_at: '2023-10-29T12:00:00.000000+00:00',
        company_tag: {
          id: '987',
          tag: FAVORITES,
        },
      },
    ],
  }

  const createdRecentlyAndFavoriteWithMeta = {
    ...createdRecentlyAndFavorite,
    _favorite: '2023-10-29T12:00:00.000000+00:00',
    _recentlyViewedOrCreatedAt: '2023-08-29T12:00:00.000000+00:00',
  }

  const createdLongAgoNoTags = {
    id: CREATED_LONG_AGO_NO_TAGS_ID,
    created_at: '2020-08-29T12:00:00.000000+00:00',
    tags: [],
  }

  const createdLongAgoNoTagsWithMeta = {
    ...createdLongAgoNoTags,
    _favorite: '1',
    _recentlyViewedOrCreatedAt: '2020-08-29T12:00:00.000000+00:00',
  }

  const createdLongAgoAndRecentlyViewed = {
    id: CREATED_LONG_AGO_AND_RECENTLY_VIEWED_ID,
    created_at: '2020-08-29T12:00:00.000000+00:00',
    tags: [
      {
        id: 'abc',
        updated_at: '2022-10-29T12:00:00.000000+00:00',
        company_tag: {
          id: 'def',
          tag: RECENTLY_VIEWED,
        },
      },
    ],
  }

  const createdLongAgoAndRecentlyViewedWithMeta = {
    ...createdLongAgoAndRecentlyViewed,
    _favorite: '1',
    _recentlyViewedOrCreatedAt: '2022-10-29T12:00:00.000000+00:00',
  }

  const createdLongAgoAndFavorite = {
    id: CREATED_LONG_AGO_AND_FAVORITE_ID,
    created_at: '2020-08-29T12:00:00.000000+00:00',
    tags: [
      {
        id: 'ghi',
        updated_at: '2022-10-29T12:00:00.000000+00:00',
        company_tag: {
          id: 'jkl',
          tag: FAVORITES,
        },
      },
    ],
  }

  const createdLongAgoAndFavoriteWithMeta = {
    ...createdLongAgoAndFavorite,
    _favorite: '2022-10-29T12:00:00.000000+00:00',
    _recentlyViewedOrCreatedAt: '2020-08-29T12:00:00.000000+00:00',
  }

  it('returns an empty array if no narratives', () => {
    expect(sortNarratives()).toEqual([])
  })

  it('returns a single narrative if only one narrative provided', () => {
    expect(sortNarratives([createdRecentlyNoTags]).length).toEqual(1)
  })

  it('returns a favorited narrative before a recently viewed narrative', () => {
    const sortedNarratives = sortNarratives([createdRecentlyAndFavorite, createdRecentlyAndRecentlyViewed])
    expect(sortedNarratives).toEqual([createdRecentlyAndFavoriteWithMeta, createdRecentlyAndRecentlyViewedWithMeta])
  })

  it('returns a favorited narrative before a recently created narrative with no tags', () => {
    const sortedNarratives = sortNarratives([createdRecentlyNoTags, createdRecentlyAndFavorite])
    expect(sortedNarratives).toEqual([createdRecentlyAndFavoriteWithMeta, createdRecentlyNoTagsWithMeta])
  })

  it('returns a recently viewed narrative before a recently created narrative with no tags', () => {
    const sortedNarratives = sortNarratives([createdRecentlyNoTags, createdRecentlyAndRecentlyViewed])
    expect(sortedNarratives).toEqual([createdRecentlyAndRecentlyViewedWithMeta, createdRecentlyNoTagsWithMeta])
  })

  it('returns a favorited narrative before a narrative created a long time ago with no tags', () => {
    const sortedNarratives = sortNarratives([createdLongAgoNoTags, createdRecentlyAndFavorite])
    expect(sortedNarratives).toEqual([createdRecentlyAndFavoriteWithMeta, createdLongAgoNoTagsWithMeta])
  })

  it('returns a recently viewed narrative before a narrative created a long time ago with no tags', () => {
    const sortedNarratives = sortNarratives([createdLongAgoNoTags, createdRecentlyAndRecentlyViewed])
    expect(sortedNarratives).toEqual([createdRecentlyAndRecentlyViewedWithMeta, createdLongAgoNoTagsWithMeta])
  })

  it('returns a favorited narrative before a narrative created a long time ago with a recently viewed tag', () => {
    const sortedNarratives = sortNarratives([createdLongAgoAndRecentlyViewed, createdRecentlyAndFavorite])
    expect(sortedNarratives).toEqual([createdRecentlyAndFavoriteWithMeta, createdLongAgoAndRecentlyViewedWithMeta])
  })

  it('returns a more recently favorited narrative before a less recently favorited narrative', () => {
    const sortedNarratives = sortNarratives([createdLongAgoAndFavorite, createdRecentlyAndFavorite])
    expect(sortedNarratives).toEqual([createdRecentlyAndFavoriteWithMeta, createdLongAgoAndFavoriteWithMeta])
  })

  it('returns a more recently recently viewed narrative before a less recently recently viewed narrative', () => {
    const sortedNarratives = sortNarratives([createdLongAgoAndRecentlyViewed, createdRecentlyAndRecentlyViewed])
    expect(sortedNarratives).toEqual([
      createdRecentlyAndRecentlyViewedWithMeta,
      createdLongAgoAndRecentlyViewedWithMeta,
    ])
  })

  it('returns a narrative favorited a long time ago before a recently viewed narrative', () => {
    const sortedNarratives = sortNarratives([createdLongAgoAndFavorite, createdRecentlyAndRecentlyViewed])
    expect(sortedNarratives).toEqual([createdLongAgoAndFavoriteWithMeta, createdRecentlyAndRecentlyViewedWithMeta])
  })

  it('returns multiple narratives, some favorited, some recently viewed, some with no tags all in the right order', () => {
    const sortedNarratives = sortNarratives([
      createdRecentlyNoTags,
      createdRecentlyAndRecentlyViewed,
      createdRecentlyAndFavorite,
      createdLongAgoNoTags,
      createdLongAgoAndRecentlyViewed,
      createdLongAgoAndFavorite,
    ])

    expect(sortedNarratives).toEqual([
      createdRecentlyAndFavoriteWithMeta,
      createdLongAgoAndFavoriteWithMeta,
      createdRecentlyAndRecentlyViewedWithMeta,
      createdRecentlyNoTagsWithMeta,
      createdLongAgoAndRecentlyViewedWithMeta,
      createdLongAgoNoTagsWithMeta,
    ])
  })
})
