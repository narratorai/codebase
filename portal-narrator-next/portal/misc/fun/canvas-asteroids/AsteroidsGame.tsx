import './style.css'

import React, { useEffect, useRef, useState } from 'react'

import CanvasAsteroids from './CanvasAsteroids'

class GameErrorBoundary extends React.Component<{ children: React.ReactNode }> {
  state = {
    error: null,
  }

  static getDerivedStateFromError(error: Error) {
    return { error: error }
  }

  render() {
    // if there are any errors, just render null and fail silently
    return this.state.error ? null : this.props.children
  }
}

const AsteroidsGame = ({ delay = 5000 }) => {
  const [gameStarted, setGameStarted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setTimeout(() => {
      if (canvasRef.current) {
        new CanvasAsteroids(canvasRef.current)
        canvasRef.current.focus()
        setGameStarted(true)
      }
    }, delay)
  }, [delay])

  return (
    <GameErrorBoundary>
      <div
        id="asteroids__game"
        style={{
          opacity: gameStarted ? 1 : 0,
        }}
      >
        <canvas ref={canvasRef} id="asteroids__canvas" tabIndex={0} />
      </div>
    </GameErrorBoundary>
  )
}

export default AsteroidsGame
