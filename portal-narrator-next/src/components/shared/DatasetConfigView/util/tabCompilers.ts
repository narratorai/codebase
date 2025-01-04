import { filter, find, map } from 'lodash'

import { getBoldToken, getGreenTagToken, getRegularToken, getSpaceToken, IToken } from '@/components/shared/TagContent'
import { IRemoteGroupColumn, IRemoteTab, IRemoteTabPlot } from '@/stores/datasets'

import { KEYWORDS, PLOT_KIND, SPACE } from './constants'

export const compileLabels = (ids: string[], allColumns: IRemoteGroupColumn[]) => {
  const columns = map(ids, (id: string) => find(allColumns, { id }))
  const filteredColumns = filter(columns, (column): column is IRemoteGroupColumn => column !== undefined)
  return map(filteredColumns, (column) => getGreenTagToken(column.label))
}

export const compileTabPlot = (plot: IRemoteTabPlot, columns: IRemoteGroupColumn[]): IToken[] => {
  const { plotKind } = plot.config.axes
  const { xs, ys, colorBys } = plot.config.columns
  const kind = PLOT_KIND[plotKind]

  const spaceToken = getSpaceToken(SPACE)
  const plottingToken = getRegularToken(KEYWORDS.plotting)
  const byToken = getRegularToken(KEYWORDS.by)
  const coloredByToken = getRegularToken(KEYWORDS.colored_by)
  const usingToken = getRegularToken(KEYWORDS.using)
  const plotToken = getRegularToken(KEYWORDS.plot)
  const kindToken = getBoldToken(kind)
  const xsTokens = compileLabels(xs, columns)
  const ysTokens = compileLabels(ys, columns)
  const colorBysTokens = compileLabels(colorBys, columns)
  const colorTokens = colorBysTokens.length > 0 ? [spaceToken, coloredByToken, spaceToken, ...colorBysTokens] : []

  return [
    plottingToken,
    spaceToken,
    ...ysTokens,
    spaceToken,
    byToken,
    spaceToken,
    ...xsTokens,
    ...colorTokens,
    spaceToken,
    usingToken,
    spaceToken,
    kindToken,
    spaceToken,
    plotToken,
  ]
}

export const compileTabs = (tabs: IRemoteTab[], groupSlug: string, plotSlug: string): IToken[] => {
  const tab = find(tabs, { slug: groupSlug })
  if (!tab) return []
  const plot = find(tab.plots, { slug: plotSlug })
  if (!plot) return []

  return compileTabPlot(plot, tab.columns)
}
