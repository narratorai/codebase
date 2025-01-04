import { colors } from 'util/constants'
import { Vec2D } from '.'

const Asteroid = (() => {
  //exposed methods:
  const create = () => {
    const obj = Object.create(def)
    obj.radius = 40
    obj.color = colors.red400
    obj.pos = Vec2D.create(0, 0)
    obj.vel = Vec2D.create(0, 0)
    obj.blacklisted = false
    obj.type = 'b'
    obj.sides = (Math.random() * 2 + 7) >> 0
    obj.angle = 0
    obj.angleVel = (1 - Math.random() * 2) * 0.01

    return obj
  }

  //Ship definition:
  var def = {
    radius: null,
    color: null,
    pos: null,
    vel: null,
    blacklisted: null,
    type: null,
    sides: null,
    angle: null,
    angleVel: null,

    update() {
      this.pos.add(this.vel)
      this.angle += this.angleVel
    },

    reset() {
      this.blacklisted = false
    },
  }

  return { create }
})()

export default Asteroid
