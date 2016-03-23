'use strict'

var fs = require('fs')
var parse = require('./parse')

module.exports = function (filepath, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  options.filepath = filepath
  parse(fs.createReadStream(filepath), options, callback)
}
