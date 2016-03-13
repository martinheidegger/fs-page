'use strict'

var fs = require('fs')
var processData = require('./processData')

module.exports = function (filepath, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  options.filepath = filepath
  try {
    var stream = fs.createReadStream(filepath)
    processData(stream, options, callback)
  } catch (e) {
    console.log('ERRROR!')
    setImmediate(callback.bind(null, e))
  }
}
