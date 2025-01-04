import { FunctionOutlined } from '@ant-design/icons'
import _, { map } from 'lodash'
import styled from 'styled-components'
import Renderer from 'util/markdown/renderer'

import { IRelationshipTitle } from './interfaces'

const RelationshipTitle = styled(({ width, ...props }) => <div {...props} />)`
  /* This allows the title to go outside the width of the BorderGraphic */
  position: absolute;
  left: 36px;
  right: 0;
  top: -50px;
  transform: rotate(90deg);
  transform-origin: top left;
  width: ${({ width }) => width}px;

  p {
    margin-bottom: 0;
    text-align: center;
  }
`

const BorderGraphic = styled(({ noStart, noEnd, ...props }) => <div {...props} />)`
  height: 100%;
  width: 6px;
  border-right: 1px solid black;
  border-top: ${({ noStart }) => (noStart ? 'none' : '1px solid black')};
  border-bottom: ${({ noEnd }) => (noEnd ? 'none' : '1px solid black')};

  /* top arrow: */
  ${({ noStart }) =>
    noStart &&
    `
    ::before {
      content: "";
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 6px solid black;
      position: absolute;
      top: -6px;
    }
  `}

  /* bottom arrow: */
  ${({ noEnd }) =>
    noEnd &&
    `  
    ::after {
      content: "";
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid black;
      position: absolute;
      bottom: -6px;
    }
  `}
`

interface Props {
  indexPixelHeightMapping: number[]
  titles: IRelationshipTitle[]
}

const RelationshipTitles = ({ indexPixelHeightMapping, titles }: Props) => {
  return (
    <>
      {map(titles, (titleConfig) => {
        // Calculate the size of the title
        // EX - if you start at index 2 and end at index 4, the size should be as long as indexes 2, 3, and 4
        const startIndex = titleConfig.start || 0
        const endIndex =
          _.isInteger(titleConfig.end) && titleConfig.end !== null
            ? titleConfig.end + 1
            : indexPixelHeightMapping.length
        const containingRows = _.slice(indexPixelHeightMapping, startIndex, endIndex)

        // also subtract lastNodeBottomMargin px for the extra margin added by Timeline.Item
        // note, if there's no titleConfig.end we know that's the final arrow so needs to be a fixed length
        const lastNodeBottomMargin = indexPixelHeightMapping[endIndex] > 46 ? 36 : 20
        const containingHeight = _.sum(containingRows)
        const totalHeight =
          titleConfig.end === null && containingHeight < 50 ? 100 : _.sum(containingRows) - lastNodeBottomMargin

        // Calculate where the title needs to start
        // topPosition is the height of all preceeding rows
        // EX - if you start at index 2, add 42px + 42px to the topPosition
        const beforeStartRows = _.slice(indexPixelHeightMapping, 0, startIndex)
        // also subtract 8px because of how Timeline spaces it's items:
        const topPosition = _.sum(beforeStartRows) - 8

        // Subtract 11px to account for 22px height of NULL or Agg label
        // to appear at center of RelationshipTitleWrapper
        const extraTopPosition = totalHeight / 2 - 11

        return (
          <div
            key={titleConfig.title + titleConfig.start}
            style={{ top: topPosition, right: -36, height: totalHeight, position: 'absolute' }}
          >
            {/* because of rotate(90deg); totalHeight becomes the width! */}
            <RelationshipTitle width={totalHeight + 100}>
              <Renderer source={titleConfig.title} />
            </RelationshipTitle>

            {titleConfig.showNull && (
              <div style={{ position: 'absolute', left: -50, top: extraTopPosition }}>
                <i>NULL</i>
              </div>
            )}
            {titleConfig.aggFunction && (
              <div style={{ position: 'absolute', left: -36, top: extraTopPosition }}>
                <FunctionOutlined />
              </div>
            )}

            <BorderGraphic noStart={titleConfig.start === null} noEnd={titleConfig.end === null} />
          </div>
        )
      })}
    </>
  )
}

export default RelationshipTitles
