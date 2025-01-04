import { colors } from 'util/constants'
import { Asteroid, Bullet, Particle, Pool, Ship, Vec2D } from '.'

const doublePI = Math.PI * 2
const getAnimationFrame =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  ((callback) => {
    window.setTimeout(callback, 16.6)
  })

// common vars
let canvas
let context
let screenWidth
let screenHeight

// game vars
let ship
let particlePool
let particles
let bulletPool
let bullets
let asteroidPool
let asteroids
let hScan
let asteroidVelFactor = 0

// keyboard vars
let keyLeft = false
let keyUp = false
let keyRight = false
let keySpace = false

class CanvasAsteroids {
  constructor(canvasElem) {
    canvas = canvasElem
    context = canvas.getContext('2d')

    this.onresize()

    this.keyboardInit()
    this.particleInit()
    this.bulletInit()
    this.asteroidInit()
    this.shipInit()

    this.loop()

    window.addEventListener('resize', this.onresize)
  }

  loop() {
    this.updateShip()
    this.updateParticles()
    this.updateBullets()
    this.updateAsteroids()

    this.checkCollisions()

    this.render()

    getAnimationFrame(() => this.loop())
  }

  onresize = () => {
    if (!canvas) return

    screenWidth = canvas.clientWidth
    screenHeight = canvas.clientHeight

    canvas.width = screenWidth
    canvas.height = screenHeight

    hScan = (screenHeight / 4) >> 0
  }

  keyboardInit() {
    window.onkeydown = (e) => {
      switch (e.keyCode) {
        //key A or LEFT
        case 65:
        case 37:
          keyLeft = true
          break

        //key W or UP
        case 87:
        case 38:
          keyUp = true
          break

        //key D or RIGHT
        case 68:
        case 39:
          keyRight = true
          break

        //key Space
        case 32:
          keySpace = true
          break
        default:
      }

      e.preventDefault()
    }

    window.onkeyup = (e) => {
      switch (e.keyCode) {
        //key A or LEFT
        case 65:
        case 37:
          keyLeft = false
          break

        //key W or UP
        case 87:
        case 38:
          keyUp = false
          break

        //key D or RIGHT
        case 68:
        case 39:
          keyRight = false
          break

        //key Space
        case 32:
          keySpace = false
          break
        default:
      }

      e.preventDefault()
    }
  }

  particleInit() {
    particlePool = Pool.create(Particle, 100)
    particles = []
  }

  bulletInit() {
    bulletPool = Pool.create(Bullet, 40)
    bullets = []
  }

  asteroidInit() {
    asteroidPool = Pool.create(Asteroid, 30)
    asteroids = []
  }

  shipInit() {
    ship = Ship.create(screenWidth >> 1, screenHeight >> 1, this)
  }

  updateShip() {
    ship.update()

    if (ship.idle) return

    if (keySpace) ship.shoot()
    if (keyLeft) ship.angle -= 0.1
    if (keyRight) ship.angle += 0.1

    if (keyUp) {
      ship.thrust.setLength(0.1)
      ship.thrust.setAngle(ship.angle)

      this.generateThrustParticle()
    } else {
      ship.vel.mul(0.94)
      ship.thrust.setLength(0)
    }

    if (ship.pos.getX() > screenWidth) ship.pos.setX(0)
    else if (ship.pos.getX() < 0) ship.pos.setX(screenWidth)

    if (ship.pos.getY() > screenHeight) ship.pos.setY(0)
    else if (ship.pos.getY() < 0) ship.pos.setY(screenHeight)
  }

  generateThrustParticle() {
    const p = particlePool.getElement()

    //if the particle pool doesn't have more elements, will return 'null'.

    if (!p) return

    p.radius = Math.random() * 3 + 2
    p.color = colors.black
    p.lifeSpan = 80
    p.pos.setXY(ship.pos.getX() + Math.cos(ship.angle) * -14, ship.pos.getY() + Math.sin(ship.angle) * -14)
    p.vel.setLength(8 / p.radius)
    p.vel.setAngle(ship.angle + (1 - Math.random() * 2) * (Math.PI / 18))
    p.vel.mul(-1)

    //particles[particles.length] = p; same as: particles.push(p);

    particles[particles.length] = p
  }

  updateParticles() {
    let i = particles.length - 1

    for (i; i > -1; --i) {
      const p = particles[i]

      if (p.blacklisted) {
        p.reset()

        particles.splice(particles.indexOf(p), 1)
        particlePool.disposeElement(p)

        continue
      }

      p.update()
    }
  }

  updateBullets() {
    let i = bullets.length - 1

    for (i; i > -1; --i) {
      const b = bullets[i]

      if (b.blacklisted) {
        b.reset()

        bullets.splice(bullets.indexOf(b), 1)
        bulletPool.disposeElement(b)

        continue
      }

      b.update()

      if (b.pos.getX() > screenWidth) b.blacklisted = true
      else if (b.pos.getX() < 0) b.blacklisted = true

      if (b.pos.getY() > screenHeight) b.blacklisted = true
      else if (b.pos.getY() < 0) b.blacklisted = true
    }
  }

  updateAsteroids() {
    let i = asteroids.length - 1

    for (i; i > -1; --i) {
      const a = asteroids[i]

      if (a.blacklisted) {
        a.reset()

        asteroids.splice(asteroids.indexOf(a), 1)
        asteroidPool.disposeElement(a)

        continue
      }

      a.update()

      if (a.pos.getX() > screenWidth + a.radius) a.pos.setX(-a.radius)
      else if (a.pos.getX() < -a.radius) a.pos.setX(screenWidth + a.radius)

      if (a.pos.getY() > screenHeight + a.radius) a.pos.setY(-a.radius)
      else if (a.pos.getY() < -a.radius) a.pos.setY(screenHeight + a.radius)
    }

    if (asteroids.length < 5) {
      const factor = (Math.random() * 2) >> 0

      this.generateAsteroid(screenWidth * factor, screenHeight * factor, 60, 'b')
    }
  }

  generateAsteroid(x, y, radius, type) {
    const a = asteroidPool.getElement()

    //if the bullet pool doesn't have more elements, will return 'null'.

    if (!a) return

    a.radius = radius
    a.type = type
    a.pos.setXY(x, y)
    a.vel.setLength(1 + asteroidVelFactor)
    a.vel.setAngle(Math.random() * (Math.PI * 2))

    //bullets[bullets.length] = b; same as: bullets.push(b);

    asteroids[asteroids.length] = a
    asteroidVelFactor += 0.025
  }

  checkCollisions() {
    this.checkBulletAsteroidCollisions()
    this.checkShipAsteroidCollisions()
  }

  checkBulletAsteroidCollisions() {
    let i = bullets.length - 1
    let j

    for (i; i > -1; --i) {
      j = asteroids.length - 1

      for (j; j > -1; --j) {
        const b = bullets[i]
        const a = asteroids[j]

        if (this.checkDistanceCollision(b, a)) {
          b.blacklisted = true

          this.destroyAsteroid(a)
        }
      }
    }
  }

  checkShipAsteroidCollisions() {
    let i = asteroids.length - 1

    for (i; i > -1; --i) {
      const a = asteroids[i]
      const s = ship

      if (this.checkDistanceCollision(a, s)) {
        if (s.idle) return

        s.idle = true

        this.generateShipExplosion()
        this.destroyAsteroid(a)
      }
    }
  }

  generateShipExplosion() {
    let i = 18

    for (i; i > -1; --i) {
      const p = particlePool.getElement()

      //if the particle pool doesn't have more elements, will return 'null'.

      if (!p) return

      p.radius = Math.random() * 6 + 2
      p.lifeSpan = 80
      p.color = colors.black
      p.vel.setLength(20 / p.radius)
      p.vel.setAngle(ship.angle + (1 - Math.random() * 2) * doublePI)
      p.pos.setXY(
        ship.pos.getX() + Math.cos(p.vel.getAngle()) * (ship.radius * 0.8),
        ship.pos.getY() + Math.sin(p.vel.getAngle()) * (ship.radius * 0.8)
      )

      //particles[particles.length] = p; same as: particles.push(p);

      particles[particles.length] = p
    }
  }

  checkDistanceCollision({ pos: pos1, radius: radius1 }, { pos: pos2, radius: radius2 }) {
    const vx = pos1.getX() - pos2.getX()
    const vy = pos1.getY() - pos2.getY()
    const vec = Vec2D.create(vx, vy)

    if (vec.getLength() < radius1 + radius2) {
      return true
    }

    return false
  }

  destroyAsteroid(asteroid) {
    asteroid.blacklisted = true

    this.generateAsteroidExplosion(asteroid)
    this.resolveAsteroidType(asteroid)
  }

  generateAsteroidExplosion({ radius, pos }) {
    let i = 18

    for (i; i > -1; --i) {
      const p = particlePool.getElement()

      //if the particle pool doesn't have more elements, will return 'null'.

      if (!p) return

      p.radius = Math.random() * (radius >> 2) + 2
      p.lifeSpan = 80
      p.color = colors.red400
      p.vel.setLength(20 / p.radius)
      p.vel.setAngle(ship.angle + (1 - Math.random() * 2) * doublePI)
      p.pos.setXY(
        pos.getX() + Math.cos(p.vel.getAngle()) * (radius * 0.8),
        pos.getY() + Math.sin(p.vel.getAngle()) * (radius * 0.8)
      )

      //particles[particles.length] = p; same as: particles.push(p);

      particles[particles.length] = p
    }
  }

  resolveAsteroidType({ type, pos }) {
    switch (type) {
      case 'b':
        this.generateAsteroid(pos.getX(), pos.getY(), 40, 'm')
        this.generateAsteroid(pos.getX(), pos.getY(), 40, 'm')
        break

      case 'm':
        this.generateAsteroid(pos.getX(), pos.getY(), 20, 's')
        this.generateAsteroid(pos.getX(), pos.getY(), 20, 's')
        break
      default:
    }
  }

  render() {
    context.fillStyle = colors.gray200
    context.globalAlpha = 0.4
    context.fillRect(0, 0, screenWidth, screenHeight)
    context.globalAlpha = 1

    this.renderShip()
    this.renderParticles()
    this.renderBullets()
    this.renderAsteroids()
    this.renderScanlines()
  }

  renderShip() {
    if (ship.idle) return

    context.save()
    context.translate(ship.pos.getX() >> 0, ship.pos.getY() >> 0)
    context.rotate(ship.angle)

    context.strokeStyle = colors.black
    context.lineWidth = Math.random() > 0.9 ? 2 : 1
    context.beginPath()
    context.moveTo(10, 0)
    context.lineTo(-10, -10)
    context.lineTo(-10, 10)
    context.lineTo(10, 0)
    context.stroke()
    context.closePath()

    context.restore()
  }

  renderParticles() {
    //inverse for loop = more performance.

    let i = particles.length - 1

    for (i; i > -1; --i) {
      const p = particles[i]

      context.beginPath()
      context.strokeStyle = p.color
      context.arc(p.pos.getX() >> 0, p.pos.getY() >> 0, p.radius, 0, doublePI)
      if (Math.random() > 0.4) context.stroke()
      context.closePath()
    }
  }

  renderBullets() {
    //inverse for loop = more performance.

    let i = bullets.length - 1

    for (i; i > -1; --i) {
      const b = bullets[i]

      context.beginPath()
      context.strokeStyle = b.color
      context.arc(b.pos.getX() >> 0, b.pos.getY() >> 0, b.radius, 0, doublePI)
      if (Math.random() > 0.2) context.stroke()
      context.closePath()
    }
  }

  renderAsteroids() {
    //inverse for loop = more performance.

    let i = asteroids.length - 1

    for (i; i > -1; --i) {
      const a = asteroids[i]

      context.beginPath()
      context.lineWidth = Math.random() > 0.2 ? 4 : 3
      context.strokeStyle = a.color

      let j = a.sides

      context.moveTo(
        (a.pos.getX() + Math.cos(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0,
        (a.pos.getY() + Math.sin(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0
      )

      for (j; j > -1; --j) {
        context.lineTo(
          (a.pos.getX() + Math.cos(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0,
          (a.pos.getY() + Math.sin(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0
        )
      }

      if (Math.random() > 0.2) context.stroke()

      context.closePath()
    }
  }

  renderScanlines() {
    //inverse for loop = more performance.

    let i = hScan

    context.globalAlpha = 0.05
    context.lineWidth = 1

    for (i; i > -1; --i) {
      context.beginPath()
      context.moveTo(0, i * 4)
      context.lineTo(screenWidth, i * 4)
      context.strokeStyle = Math.random() > 0.0001 ? colors.gray200 : colors.black
      context.stroke()
    }

    context.globalAlpha = 1
  }

  generateShot() {
    const b = bulletPool.getElement()

    //if the bullet pool doesn't have more elements, will return 'null'.

    if (!b) return

    b.radius = 1
    b.pos.setXY(ship.pos.getX() + Math.cos(ship.angle) * 14, ship.pos.getY() + Math.sin(ship.angle) * 14)
    b.vel.setLength(10)
    b.vel.setAngle(ship.angle)

    //bullets[bullets.length] = b; same as: bullets.push(b);

    bullets[bullets.length] = b
  }

  resetGame() {
    asteroidVelFactor = 0

    ship.pos.setXY(screenWidth >> 1, screenHeight >> 1)
    ship.vel.setXY(0, 0)

    this.resetAsteroids()
  }

  resetAsteroids() {
    let i = asteroids.length - 1

    for (i; i > -1; --i) {
      const a = asteroids[i]
      a.blacklisted = true
    }
  }
}

export default CanvasAsteroids
