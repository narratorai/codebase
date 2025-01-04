import { Vec2D } from '.'
import { colors } from 'util/constants'

const Bullet = (() => {
  //exposed methods:
  const create = () => {
    const obj = Object.create(def)
    obj.radius = 4
    obj.color = colors.black
    obj.pos = Vec2D.create(0, 0)
    obj.vel = Vec2D.create(0, 0)
    obj.blacklisted = false

    return obj
  }

  //Bullet definition:
  var def = {
    radius: null,
    color: null,
    pos: null,
    vel: null,
    blacklisted: null,

    update() {
      this.pos.add(this.vel)
    },

    reset() {
      this.blacklisted = false
    },
  }

  return { create }
})()

export default Bullet
