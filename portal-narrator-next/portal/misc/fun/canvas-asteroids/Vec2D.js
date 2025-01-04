const Vec2D = (() => {
  //exposed methods:
  const create = (x, y) => {
    const obj = Object.create(def)
    obj.setXY(x, y)

    return obj
  }

  //Vec2D definition:
  var def = {
    _x: 1,
    _y: 0,

    getX() {
      return this._x
    },

    setX(value) {
      this._x = value
    },

    getY() {
      return this._y
    },

    setY(value) {
      this._y = value
    },

    setXY(x, y) {
      this._x = x
      this._y = y
    },

    getLength() {
      return Math.sqrt(this._x * this._x + this._y * this._y)
    },

    setLength(length) {
      const angle = this.getAngle()
      this._x = Math.cos(angle) * length
      this._y = Math.sin(angle) * length
    },

    getAngle() {
      return Math.atan2(this._y, this._x)
    },

    setAngle(angle) {
      const length = this.getLength()
      this._x = Math.cos(angle) * length
      this._y = Math.sin(angle) * length
    },

    add(vector) {
      this._x += vector.getX()
      this._y += vector.getY()
    },

    sub(vector) {
      this._x -= vector.getX()
      this._y -= vector.getY()
    },

    mul(value) {
      this._x *= value
      this._y *= value
    },

    div(value) {
      this._x /= value
      this._y /= value
    },
  }

  return { create }
})()

export default Vec2D
