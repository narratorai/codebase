import React from 'react'
import styled from 'styled-components'
import _ from 'lodash'
import sanitize from 'util/sanitize'

/////////// COMPONENTS ///////////

export const Highlighted = styled(({ value, ...props }) => (
  <span dangerouslySetInnerHTML={{ __html: sanitize(value) }} {...props} />
))`
  .highlighted {
    background-color: ${(props) => props.theme.colors.blurple200};
  }
`

/////////// UTILS ///////////

// How many highlighted matches:
export const getMatchCount = (highlight) => _.flatten(_.values(highlight)).length

const mapFieldsToHighlight = (fields) => {
  return _.map(fields, (field) => {
    // This replaces the boots on the field. name^3 becomes name. Highlight needs the exact field name
    const fieldName = _.replace(field, new RegExp('\\^.+', 'g'), '')
    return { [fieldName]: {} }
  })
}

export const createElasticSearchQuery = ({ searchText, fields, fragmentSize, fieldValueFactor = null }) => {
  const lastTerm = _.last(searchText.split(' '))
  return {
    query: {
      function_score: {
        query: {
          dis_max: {
            queries: [
              {
                multi_match: {
                  query: searchText,
                  type: 'phrase',
                  boost: 20,
                  fields,
                },
              },
              {
                multi_match: {
                  query: searchText,
                  type: 'phrase_prefix',
                  boost: 10,
                  fields,
                },
              },
              {
                multi_match: {
                  query: searchText,
                  type: 'best_fields',
                  boost: 5,
                  fields,
                },
              },
              {
                multi_match: {
                  query: lastTerm,
                  type: 'phrase_prefix',
                  fields,
                },
              },
            ],
          },
        },
        field_value_factor: fieldValueFactor,
      },
    },
    highlight: {
      fragment_size: fragmentSize,
      pre_tags: ['<span class="highlighted">'],
      post_tags: ['</span>'],
      fields: mapFieldsToHighlight(fields),
    },
  }
}

// ES returns matches wrapped in <span>, we need the non marked up value to
// _.find in the columns and features arrays:
// Using the RegExp to replace all html. Simple replace doesn't replace more than 1 occurrence.
export const makeHighlightObjects = ({ highlight, getter }) => {
  return _.map(_.get(highlight, getter, []), (rawHighlight) => ({
    raw: rawHighlight,
    noMarkup: _.replace(
      _.replace(rawHighlight, new RegExp('<span class="highlighted">', 'g'), ''),
      new RegExp('</span>', 'g'),
      ''
    ),
  }))
}

// Given a highlight, find a value from all featureValues that matches that highlight
export const findMatchingFeature = ({ highlightedFeature, featureValues }) => {
  const exactMatch = _.find(featureValues, (featureValue) => {
    return featureValue.value === highlightedFeature.noMarkup
  })
  if (exactMatch) {
    return {
      ...exactMatch,
      exactMatch: true,
      matched: true,
    }
  }
  const fuzzyMatch = _.find(featureValues, (featureValue) => {
    const val = (featureValue.value || '').toString()
    return val.includes(highlightedFeature.noMarkup)
  })

  if (!fuzzyMatch) {
    return null
  }

  return {
    ...fuzzyMatch,
    exactMatch: false,
    matched: true,
  }
}

// What feature values should be seen (given highlights):
export const getShownFeatureValues = ({ featureValues, featureHighlights, truncateLengthOverride = 24 }) => {
  const highlights = _.uniqBy(featureHighlights, 'raw')

  const firstFive = _.slice(featureValues, 0, 5)
  const firstFiveValues = _.map(firstFive, (feature) => ({
    ...feature,
    value: _.truncate(feature.value || 'null', { length: truncateLengthOverride }),
    // keep originalValue to use as key in React array
    originalValue: feature.value,
  }))

  if (highlights.length === 0) {
    return firstFiveValues
  }

  // Check to see if there are any matches for this attribute's values
  const matchedFeatures = _.compact(
    _.map(highlights, (highlightedFeature) => findMatchingFeature({ highlightedFeature, featureValues }))
  )

  if (matchedFeatures.length === 0) {
    return firstFiveValues
  }

  // Find the feature that matches the highlighted value and sort by ratio
  const matchedValues = _.reverse(
    _.sortBy(
      _.compact(
        _.map(highlights, (highlightedFeature) => {
          const matchingFeature = findMatchingFeature({ highlightedFeature, featureValues })
          if (!matchingFeature) {
            return null
          }

          return {
            ...matchingFeature,
            value: <Highlighted value={highlightedFeature.raw} />,
            originalValue: matchingFeature.value,
          }
        }),
        ['ratio']
      )
    )
  )

  return matchedValues
}

// Similar to util/dataset getShownActivityAttributes(), but for <WarehouseSearch />
export const getShownColumnsAndValues = ({ columns, highlight, truncateLengthOverride }) => {
  const columnNameHighlights = makeHighlightObjects({
    highlight,
    getter: 'columns.name',
  })
  const columnValueHighlights = makeHighlightObjects({
    highlight,
    getter: 'columns.values.value',
  })

  return _.map(columns, (column) => {
    const highlightedLabel = _.find(columnNameHighlights, ['noMarkup', column.name]) || null

    const shownValues = getShownFeatureValues({
      featureValues: column.values,
      featureHighlights: columnValueHighlights,
      truncateLengthOverride,
    })

    return {
      column,
      highlightedLabel,
      shownValues,
    }
  })
}
