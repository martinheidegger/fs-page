'use strict'

var Lab = require('lab')
var code = require('code')
var fs = require('fs')
var lab = Lab.script()
var expect = code.expect
var describe = lab.describe
var it = lab.it
var processFile = require('../processFile')
var LONG_TEXT_PTH = 'data/longtext'
var LONG_TEXT_PATH = __dirname + '/' + LONG_TEXT_PTH
var LONG_TEXT = fs.readFileSync(LONG_TEXT_PATH, 'utf8')

describe('loading of files', function () {
  it('should result in the files to be present', function (done) {
    processFile(LONG_TEXT_PATH, function (ignoreError, data) {
      expect(data.body).to.equal(LONG_TEXT)
      expect(data.path).to.equal(LONG_TEXT_PATH)
      done()
    })
  })
  it('should result in the files to be relative, given a cwd', function (done) {
    processFile(LONG_TEXT_PATH, {root: __dirname}, function (ignoreError, data) {
      expect(data.path).to.equal(LONG_TEXT_PTH)
      done()
    })
  })
  it('should pass the error due to unknown file', function (done) {
    processFile(LONG_TEXT_PATH + '?', function (error) {
      expect(error).to.not.be.equal(null)
      done()
    })
  })
})

exports.lab = lab
