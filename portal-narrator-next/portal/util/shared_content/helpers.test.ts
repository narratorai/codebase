import { makePlotCopiedContent } from './helpers'

describe('makePlotCopiedContent', () => {
  const datasetSlug = 'dataset-slug'
  const groupSlug = 'group-slug'
  const plotSlug = 'plot-slug'
  it('can remove group slug from plot slug if it exists', () => {
    const copiedContent = makePlotCopiedContent({ datasetSlug, groupSlug, plotSlug: `${groupSlug}.${plotSlug}` })

    expect(copiedContent.data.plot_slug).toBe(plotSlug)
  })

  it('can returns the original plot slug if no group slug found embedded in plot slug', () => {
    const copiedContent = makePlotCopiedContent({ datasetSlug, groupSlug, plotSlug })

    expect(copiedContent.data.plot_slug).toBe(plotSlug)
  })
})
