// Mock localStorage!!!

// https://auth0.com/blog/testing-react-applications-with-jest/
export const setLocalStorage = () => {
  global.localStorage = {
    getItem: function (key) {
      return this[key]
    },
    setItem: function (key, value) {
      this[key] = value
    },
    removeItem: function (key) {
      delete this[key]
    },
  }
}
