import React, { CSSProperties, Fragment } from 'react'

interface Props {
  folds?: number
  foldHeight?: number
  style?: CSSProperties
}

const PaperFold = ({ folds = 2, foldHeight = 40, style = {} }: Props) => (
  <div
    style={{
      height: folds * foldHeight,
      position: 'relative',
      zIndex: 1,
      transform: 'perspective(1000px)',
      transformStyle: 'preserve-3d',
      ...style,
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 0,
        backgroundColor: 'white',
        height: foldHeight,
        width: '100%',
        transformOrigin: '50% 0%',
        transform: 'rotateX(-60deg)',
        filter: 'brightness(96%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: 0,
        backgroundColor: 'white',
        height: foldHeight,
        width: '100%',
        transformOrigin: '50% 100%',
        transform: 'rotateX(60deg)',
        filter: 'brightness(99.5%)',
      }}
    />
    {folds > 1 &&
      [...Array(folds - 1).keys()].map((index) => (
        <Fragment key={index}>
          <div
            style={{
              position: 'absolute',
              top: foldHeight * (index + 1),
              backgroundColor: 'white',
              height: foldHeight,
              width: '100%',
              transformOrigin: '50% 0%',
              transform: 'rotateX(-60deg)',
              filter: 'brightness(96%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: foldHeight * (index + 1),
              backgroundColor: 'white',
              height: foldHeight,
              width: '100%',
              transformOrigin: '50% 100%',
              transform: 'rotateX(60deg)',
              filter: 'brightness(99.5%)',
            }}
          />
        </Fragment>
      ))}
  </div>
)

export default PaperFold
