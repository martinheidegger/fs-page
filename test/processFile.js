'use strict'

var processFile = require('../processFile')
var fs = require('fs')
var path = require('path')
var LONG_TEXT_PTH = 'data/longtext'
var LONG_TEXT_PATH = path.join(__dirname, LONG_TEXT_PTH)
var LONG_TEXT = fs.readFileSync(LONG_TEXT_PATH, 'utf8')

function test (name, method) {
  return require('tap').test('loading of files ' + name, method)
}

test('should result in the files to be present', function (t) {
  processFile(LONG_TEXT_PATH, function (ignoreError, data) {
    t.equal(data.body, LONG_TEXT)
    t.equal(data.path, LONG_TEXT_PATH)
    t.end()
  })
})
test('should result in the files to be relative, given a cwd', function (t) {
  processFile(LONG_TEXT_PATH, {root: __dirname}, function (ignoreError, data) {
    t.equal(data.path, LONG_TEXT_PTH)
    t.end()
  })
})
test('should pass the error due to unknown file', function (t) {
  processFile(LONG_TEXT_PATH + '?', function (error) {
    console.log(error)
    t.notEqual(error, null)
    t.end()
  })
})
