'use strict'

var fs = require('fs')
var processData = require('./processData')

module.exports = function (filepath, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  options.filepath = filepath
  processData(fs.createReadStream(filepath), options, callback)
}
