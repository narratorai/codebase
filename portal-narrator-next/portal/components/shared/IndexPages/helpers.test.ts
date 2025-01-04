import { isSharedTag, hasSharedTags } from './helpers'
import { RECENTLY_VIEWED, FAVORITES, POPULAR } from './constants'
import { IDataset_Tags } from 'graph/generated'

// doesn't have company_tag.tag
const badTag = {
  company_tag: {
    id: 'not_real',
    color: '#DEDEDE',
  },
} as IDataset_Tags

const recentlyViewedTag = {
  company_tag: {
    id: 'not_real',
    color: '#DEDEDE',
    tag: RECENTLY_VIEWED,
  },
} as IDataset_Tags

const favoriteTag = {
  company_tag: {
    id: 'not_real',
    color: '#DEDEDE',
    tag: FAVORITES,
  },
} as IDataset_Tags

const popularTag = {
  company_tag: {
    id: 'not_real',
    color: '#DEDEDE',
    tag: POPULAR,
  },
} as IDataset_Tags

const sharedTagOne = {
  company_tag: {
    id: 'not_real',
    color: '#DEDEDE',
    tag: 'amazing_tag',
  },
} as IDataset_Tags

const sharedTagTwo = {
  company_tag: {
    id: 'not_real',
    color: '#DEDEDE',
    tag: 'super_awesome',
  },
} as IDataset_Tags

describe('#isSharedTag', () => {
  it('returns false if no tag passed as arg', () => {
    expect(isSharedTag(badTag)).toBe(false)
  })

  it('returns false for Recently Viewed', () => {
    expect(isSharedTag(recentlyViewedTag)).toBe(false)
  })

  it('returns false for Favorites', () => {
    expect(isSharedTag(favoriteTag)).toBe(false)
  })

  it('returns false for Popular', () => {
    expect(isSharedTag(popularTag)).toBe(false)
  })

  it('returns true for sharable tag', () => {
    expect(isSharedTag(sharedTagOne)).toBe(true)
  })
})

describe('#hasSharedTags', () => {
  it('returns false if there are no tags passed as arg', () => {
    expect(hasSharedTags([])).toBe(false)
  })

  it('returns false if there is a bad tag', () => {
    expect(hasSharedTags([badTag])).toBe(false)
  })

  it('returns false if there is a bad tag and non shared tag', () => {
    expect(hasSharedTags([badTag, favoriteTag])).toBe(false)
  })

  it('returns false if there are only non shared tags', () => {
    expect(hasSharedTags([popularTag, favoriteTag])).toBe(false)
  })

  it('returns true if there is a only a shared tag', () => {
    expect(hasSharedTags([sharedTagOne])).toBe(true)
  })

  it('returns true if there are a multiple shared tags', () => {
    expect(hasSharedTags([sharedTagOne, sharedTagTwo])).toBe(true)
  })

  it('returns true if there is a shared tag and a non shared tag', () => {
    expect(hasSharedTags([sharedTagOne, favoriteTag])).toBe(true)
  })

  it('returns true if there are multiple shared tags and a non shared tag', () => {
    expect(hasSharedTags([sharedTagOne, sharedTagTwo, favoriteTag])).toBe(true)
  })

  it('returns true if there are multiple shared tags and a non shared tag and a bad tag', () => {
    expect(hasSharedTags([sharedTagOne, sharedTagTwo, favoriteTag, badTag])).toBe(true)
  })
})
