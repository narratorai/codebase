import clsx from 'clsx'
import { SimpleLoader } from 'components/shared/icons/Loader'
import { Box, Flex } from 'components/shared/jawns'
import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import analytics from 'util/analytics'

import VideoPlayOverlay from './VideoPlayOverlay'

const ReactHlsPlayer = React.lazy(() => import(/* webpackChunkName: "hls-player" */ 'react-hls-player'))

const VideoWrapper = styled(Flex)`
  position: relative;
  cursor: pointer;

  &.video-playing {
    cursor: auto;
  }

  video {
    width: 100%;
    height: auto;
  }

  .video-overlay {
    position: absolute;
    z-index: 1000;
  }

  &.video-loading {
    .video-overlay {
      display: none;
    }
  }
`

interface Props {
  url: string
  title: string
}

export const VideoPlayer = ({ url, title }: Props) => {
  const playerRef = useRef<HTMLVideoElement | null>(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleMouseEnter = () => {
    setHovered(true)
  }

  const handleMouseLeave = () => {
    setHovered(false)
  }

  const handlePause = () => {
    setPlaying(false)
  }

  const handleCanPlay = () => {
    setReady(true)
  }

  const handlePlay = () => {
    setPlaying(true)
    analytics.track('played_video', { url, title })
  }

  return (
    <React.Suspense fallback={<SimpleLoader minHeight="500px" />}>
      <VideoWrapper
        data-test="video-wrapper"
        className={clsx({ 'video-playing': playing, 'video-loading': !ready })}
        alignItems="center"
        justifyContent="center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <VideoPlayOverlay playing={playing} hovered={hovered} playerRef={playerRef} />
        <Box>
          <ReactHlsPlayer
            playerRef={playerRef}
            title={title}
            src={url}
            controls
            onCanPlay={handleCanPlay}
            onPlay={handlePlay}
            onPause={handlePause}
          />
        </Box>
      </VideoWrapper>
    </React.Suspense>
  )
}
