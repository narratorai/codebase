import { PlayCircleTwoTone } from '@ant-design/icons'
import { Box } from 'components/shared/jawns'
import React from 'react'
import { colors } from 'util/constants'

interface Props {
  playing: boolean
  hovered: boolean
  playerRef: React.MutableRefObject<HTMLVideoElement | null>
}

const VideoPlayOverlay = ({ playing, hovered, playerRef }: Props) => {
  const iconColor = hovered ? colors.blurple400 : colors.gray400

  const handleClick = () => {
    playerRef.current?.play()
  }

  if (playing) return null
  return (
    <Box className="video-overlay" onClick={handleClick}>
      <PlayCircleTwoTone twoToneColor={iconColor} style={{ fontSize: '5em' }} />
    </Box>
  )
}

export default VideoPlayOverlay
