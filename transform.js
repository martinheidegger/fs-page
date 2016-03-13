'use strict'

var processData = require('./processData')
var through2 = require('through2')

module.exports = function (options) {
  var buffers = []
  return through2.obj(
    function (chunk, enc, cb) {
      buffers.push(chunk)
      cb(null, null)
    },
    function (cb) {
      var buffer = Buffer.concat(buffers)
      var next = function (err, argument) {
        if (argument) {
          this.push(argument)
        }
        cb(err)
      }
      processData(buffer, options, next.bind(this))
    }
  )
}
