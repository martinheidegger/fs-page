'use strict'

var test = require('tap').test
var Readable = require('stream').Readable

test('string stream should not break buffers', function (t) {
  var stream = new Readable({
    objectMode: true
  })
  var strings = ['hello']
  stream._read = function () {
    this.push(strings.shift() || null)
  }
  var result
  stream.pipe(require('../transform')())
    .on('data', function (data) {
      result = data
    })
    .on('error', function (err) {
      t.fail(err)
    })
    .on('end', function () {
      t.equal(result.body, 'hello')
      t.end()
    })
})
