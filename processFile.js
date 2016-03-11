'use strict'

var fs = require('fs')
var processData = require('./processData')

module.exports = function (filepath, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  options.filepath = filepath
  fs.readFile(filepath, 'utf-8', function (err, body) {
    if (err) {
      return callback(err)
    }
    processData(body, options, callback)
  })
}
