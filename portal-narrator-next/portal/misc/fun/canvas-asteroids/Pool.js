const Pool = (() => {
  //exposed methods:
  const create = (type, size) => {
    const obj = Object.create(def)
    obj.init(type, size)

    return obj
  }

  //Ship definition:
  var def = {
    _type: null,
    _size: null,
    _pointer: null,
    _elements: null,

    init(type, size) {
      this._type = type
      this._size = size
      this._pointer = size
      this._elements = []

      let i = 0
      const length = this._size

      for (i; i < length; ++i) {
        this._elements[i] = this._type.create()
      }
    },

    getElement() {
      if (this._pointer > 0) return this._elements[--this._pointer]

      return null
    },

    disposeElement(obj) {
      this._elements[this._pointer++] = obj
    },
  }

  return { create }
})()

export default Pool
