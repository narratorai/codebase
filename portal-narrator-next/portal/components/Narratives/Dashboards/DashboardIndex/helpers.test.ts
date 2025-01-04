import { getDashboardsByNonSharedTags } from './helpers'
import { RECENTLY_VIEWED, FAVORITES, POPULAR } from '../../../shared/IndexPages/constants'

const DASHBOARD_WITH_FAVORITE = {
  id: 'favorited',
  tags: [{ company_tag: { tag: FAVORITES } }],
}

const DASHBOARD_WITH_RECENTLY_VIEWED = {
  id: 'recentlyViewed',
  tags: [{ company_tag: { tag: RECENTLY_VIEWED } }],
}

const DASHBOARD_WITH_POPULAR = {
  id: 'popular',
  tags: [{ company_tag: { tag: POPULAR } }],
}

const DASHBOARD_WITH_FAVORITE_AND_RECENTLY_VIEWED = {
  id: 'favoritedAndRecentlyViewed',
  tags: [{ company_tag: { tag: FAVORITES } }, { company_tag: { tag: RECENTLY_VIEWED } }],
}

const UNIQUE_TAG = 'unique_tag'
const DASHBOARD_WITH_NON_SHARED_TAG = {
  id: 'nonSharedTag',
  tags: [{ company_tag: { tag: UNIQUE_TAG } }],
}

const UNIQUE_TAG_2 = 'unique_tag_2'
const DASHBOARD_WITH_NON_SHARED_TAG_2 = {
  id: 'nonSharedTag',
  tags: [{ company_tag: { tag: UNIQUE_TAG_2 } }],
}

const DASHBOARD_WITH_FAVORITE_AND_NON_SHARED_TAG = {
  id: 'favoriteAndNonShared',
  tags: [{ company_tag: { tag: FAVORITES } }, { company_tag: { tag: UNIQUE_TAG } }],
}

describe('#getDashboardsByNonSharedTags', () => {
  it('should return an empty object if no dashboards are passed', () => {
    expect(getDashboardsByNonSharedTags({ dashboards: undefined })).toStrictEqual({})
  })

  // single dashboards
  it('should return an empty object if passed dashboard with only recently viewed', () => {
    expect(getDashboardsByNonSharedTags({ dashboards: [DASHBOARD_WITH_RECENTLY_VIEWED] })).toStrictEqual({})
  })

  it('should return an empty object if passed dashboard with only favorited', () => {
    expect(getDashboardsByNonSharedTags({ dashboards: [DASHBOARD_WITH_FAVORITE] })).toStrictEqual({})
  })

  it('should return an empty object if passed dashboard with only popular', () => {
    expect(getDashboardsByNonSharedTags({ dashboards: [DASHBOARD_WITH_POPULAR] })).toStrictEqual({})
  })

  it('should return an empty object if passed dashboard with only multiple shared tags', () => {
    expect(getDashboardsByNonSharedTags({ dashboards: [DASHBOARD_WITH_FAVORITE_AND_RECENTLY_VIEWED] })).toStrictEqual(
      {}
    )
  })

  it('should return an empty object if passed dashboards with only multiple shared tags', () => {
    expect(getDashboardsByNonSharedTags({ dashboards: [DASHBOARD_WITH_FAVORITE_AND_RECENTLY_VIEWED] })).toStrictEqual(
      {}
    )
  })

  it('should add dashboard with only non-shared tag', () => {
    expect(getDashboardsByNonSharedTags({ dashboards: [DASHBOARD_WITH_NON_SHARED_TAG] })).toStrictEqual({
      [UNIQUE_TAG]: [DASHBOARD_WITH_NON_SHARED_TAG],
    })
  })

  it('should add dashboard with non-shared and shared tag', () => {
    expect(getDashboardsByNonSharedTags({ dashboards: [DASHBOARD_WITH_FAVORITE_AND_NON_SHARED_TAG] })).toStrictEqual({
      [UNIQUE_TAG]: [DASHBOARD_WITH_FAVORITE_AND_NON_SHARED_TAG],
    })
  })

  // multiple dashboards
  it('should return an empty object if passed multiple dashboards with only shared tags', () => {
    expect(
      getDashboardsByNonSharedTags({
        dashboards: [DASHBOARD_WITH_POPULAR, DASHBOARD_WITH_FAVORITE, DASHBOARD_WITH_RECENTLY_VIEWED],
      })
    ).toStrictEqual({})
  })

  it('should add dashboard with non-shared tag among other shared tag dashboards', () => {
    expect(
      getDashboardsByNonSharedTags({
        dashboards: [
          DASHBOARD_WITH_POPULAR,
          DASHBOARD_WITH_FAVORITE,
          DASHBOARD_WITH_RECENTLY_VIEWED,
          DASHBOARD_WITH_NON_SHARED_TAG,
        ],
      })
    ).toStrictEqual({ [UNIQUE_TAG]: [DASHBOARD_WITH_NON_SHARED_TAG] })
  })

  it('should add multiple dashboards with same non-shared tag among other shared tag dashboards', () => {
    expect(
      getDashboardsByNonSharedTags({
        dashboards: [
          DASHBOARD_WITH_POPULAR,
          DASHBOARD_WITH_FAVORITE,
          DASHBOARD_WITH_RECENTLY_VIEWED,
          DASHBOARD_WITH_NON_SHARED_TAG,
          DASHBOARD_WITH_FAVORITE_AND_NON_SHARED_TAG,
        ],
      })
    ).toStrictEqual({ [UNIQUE_TAG]: [DASHBOARD_WITH_NON_SHARED_TAG, DASHBOARD_WITH_FAVORITE_AND_NON_SHARED_TAG] })
  })

  it('should add multiple dashboards with different non-shared tag among other shared tag dashboards', () => {
    expect(
      getDashboardsByNonSharedTags({
        dashboards: [
          DASHBOARD_WITH_POPULAR,
          DASHBOARD_WITH_NON_SHARED_TAG,
          DASHBOARD_WITH_NON_SHARED_TAG_2,
          DASHBOARD_WITH_FAVORITE_AND_NON_SHARED_TAG,
        ],
      })
    ).toStrictEqual({
      [UNIQUE_TAG]: [DASHBOARD_WITH_NON_SHARED_TAG, DASHBOARD_WITH_FAVORITE_AND_NON_SHARED_TAG],
      [UNIQUE_TAG_2]: [DASHBOARD_WITH_NON_SHARED_TAG_2],
    })
  })
})
