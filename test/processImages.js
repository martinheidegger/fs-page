'use strict'

var Lab = require('lab')
var code = require('code')
var lab = Lab.script()
var expect = code.expect
var describe = lab.describe
var it = lab.it
var processImages = require('../processImages')

describe('extracting images from html code should', function () {
  it('not fail if no images are found', function (done) {
    processImages('<html></html>', function (err, result) {
      var data = result.images
      expect(err).to.equal(null)
      expect(data.length).to.equal(0)
      done()
    })
  })
  it('not fail if the content isn‘t valid html', function (done) {
    processImages('<x', function (err, result) {
      var data = result.images
      expect(err).to.equal(null)
      expect(data.length).to.equal(0)
      done()
    })
  })
  it('return regular image paths', function (done) {
    processImages('<img src="hello">', function (err, result) {
      var data = result.images
      expect(err).to.equal(null)
      expect(data.length).to.be.equal(1)
      var image = data[0]
      expect(image.type).to.equal('img')
      expect(image.classes).to.equal(null)
      expect(image.selector).to.equal('img')
      expect(image.src).to.equal('hello')
      done()
    })
  })
  it('return empty image paths', function (done) {
    processImages('<img>', function (err, result) {
      var data = result.images
      expect(err).to.equal(null)
      expect(data.length).to.be.equal(1)
      expect(data[0].src).to.deep.equal(null)
      done()
    })
  })
  it('fill a complete selector', function (done) {
    processImages('<img id="a" class="b c">', function (ignoreError, result) {
      var data = result.images
      expect(data[0].selector).to.be.equal('img#a.b.c')
      done()
    })
  })
  it('work with classes only', function (done) {
    processImages('<img class="b c">', function (ignoreError, result) {
      var data = result.images
      expect(data[0].selector).to.be.equal('img.b.c')
      done()
    })
  })
  it('work with empty classes', function (done) {
    processImages('<img class=" ">', function (ignoreError, result) {
      var data = result.images
      expect(data[0].classes).to.be.equal(null)
      done()
    })
  })
  it('parse the classes sorted by name', function (done) {
    processImages('<img class="c b">', function (ignoreError, result) {
      var data = result.images
      expect(data[0].selector).to.be.equal('img.b.c')
      expect(data[0].classes[0]).to.be.equal('b')
      expect(data[0].classes[1]).to.be.equal('c')
      done()
    })
  })
  it('parse the classes with spaces before and after', function (done) {
    processImages('<img class=" c b ">', function (ignoreError, result) {
      var data = result.images
      expect(data[0].selector).to.be.equal('img.b.c')
      expect(data[0].classes[0]).to.be.equal('b')
      expect(data[0].classes[1]).to.be.equal('c')
      done()
    })
  })
  it('parse two images', function (done) {
    processImages('<img src="a"><img src="b">', function (ignoreError, result) {
      var data = result.images
      expect(data[0].src).to.be.equal('a')
      expect(data[1].src).to.be.equal('b')
      done()
    })
  })
  it('prioritise a featured image ', function (done) {
    processImages('<img src="a"><img src="c"><img src="b" class="featured">', function (ignoreError, result) {
      var data = result.images
      expect(data[0].src).to.be.equal('b')
      expect(data[1].src).to.be.equal('a')
      done()
    })
  })
  it('prioritise a featured image B', function (done) {
    processImages('<img src="a" class="featured"><img src="c"><img src="b">', function (ignoreError, result) {
      var data = result.images
      expect(data[0].src).to.be.equal('a')
      expect(data[1].src).to.be.equal('c')
      done()
    })
  })
  it('prioritise a featured image C', function (done) {
    processImages('<img src="a"><img src="c" class="featured"><img src="b">', function (ignoreError, result) {
      var data = result.images
      expect(data[0].src).to.be.equal('c')
      expect(data[1].src).to.be.equal('a')
      done()
    })
  })
  it('ignore duplicate images', function (done) {
    processImages('<img src="a"><img src="a">', function (ignoreError, result) {
      var data = result.images
      expect(data[0].src).to.be.equal('a')
      expect(data.length).to.be.equal(1)
      done()
    })
  })
  it('prioritze data-src over src of duplicate images', function (done) {
    processImages('<img data-src="b" src="ac"><img src="b">', function (ignoreError, result) {
      var data = result.images
      expect(data[0].src).to.be.equal('b')
      expect(data.length).to.be.equal(1)
      done()
    })
  })
  it('store the original data-src and src url', function (done) {
    processImages('<img data-src="b" src="c">', {
      convertUrl: function () {
        return 'a'
      }
    }, function (ignoreError, result) {
      var node = result.$('img')[0]
      expect(node.attribs.src).to.be.equal('a')
      expect(node.original.src).to.be.equal('c')
      expect(node.original['data-src']).to.be.equal('b')
      done()
    })
  })
  it('prioritze id over data-src of duplicate images', function (done) {
    processImages('<img data-id="b" data-src="c" src="ac"><img src="b">', function (ignoreError, result) {
      var data = result.images
      expect(data[0].src).to.be.equal('c')
      expect(data.length).to.be.equal(1)
      done()
    })
  })
  it('allow processing of image paths', function (done) {
    processImages('<img src="ac">',
      {
        convertUrl: function (src) {
          return 'd'
        }
      },
      function (ignoreError, result) {
        var data = result.images
        expect(data[0].src).to.be.equal('d')
        done()
      })
  })
  it('allow processing of absolute image paths', function (done) {
    processImages('<img src="http://ac">',
      {
        convertUrl: function (src) {
          return 'd'
        }
      },
      function (ignoreError, result) {
        var data = result.images
        expect(data[0].src).to.be.equal('d')
        done()
      })
  })
  it('make file system paths relative to the current working directory', function (done) {
    processImages('<img src="../pro/b/../a">',
      function (ignoreError, result) {
        var data = result.images
        expect(data[0].simpleSrc).to.be.equal('../pro/a')
        done()
      })
  })
  it('make file system paths relative to the a specified working directory', function (done) {
    processImages('<img src="/abcd/e">', {cwd: '/abcd/d'},
      function (ignoreError, result) {
        var data = result.images
        expect(data[0].simpleSrc).to.be.equal('../e')
        done()
      })
  })
  it('allow processing of absolute https image paths', function (done) {
    processImages('<img src="https://ac">',
      {
        convertUrl: function (src) {
          return 'd'
        }
      },
      function (ignoreError, result) {
        var data = result.images
        expect(data[0].src).to.be.equal('d')
        done()
      })
  })
  it('proper access of https? sources', function (done) {
    // covered by code-coverage
    processImages('<img src="http://test">',
      function (ignoreError, result) {
        var data = result.images
        expect(data[0].simpleSrc).to.be.equal('http://test')
        done()
      })
  })

})

exports.lab = lab
