'use strict'

var Lab = require('lab')
var code = require('code')
var lab = Lab.script()
var expect = code.expect
var fs = require('fs')
var describe = lab.describe
var it = lab.it
var processData = require('../processData')
var DEFAULT_FIELDS = ['published', 'categories', 'date', 'body', 'createExcerpt']
var LONG_TEXT = fs.readFileSync(__dirname + '/data/longtext')

describe('processing simple data', function () {
  it('should have at least the basic fields', function (done) {
    processData('', function (ignore, data) {
      expect(data.published).to.be.equal(true)
      expect(data.categories.length).to.be.equal(0)
      expect(data.date).to.be.equal(null)
      expect(data.body).to.be.equal('')
      expect(Object.keys(data)).to.only.once.include(DEFAULT_FIELDS)
      done()
    })
  })
  it('should process the front-matter data', function (done) {
    processData('---\na: b\n---', function (ignore, data) {
      expect(data.a).to.be.equal('b')
      expect(data.body).to.be.equal('')
      done()
    })
  })
  it('should allow overriding of defaults', function (done) {
    processData('---\npublished: false\n---', function (ignore, data) {
      expect(data.published).to.be.equal(false)
      done()
    })
  })
  it('should allow specifying categories', function (done) {
    processData('---\ncategories: \n - hello\n - world\n---', function (ignore, data) {
      expect(data.categories).to.only.once.include(['hello', 'world'])
      done()
    })
  })
})
describe('Using default options', function () {
  it('should be accepted', function (done) {
    processData('', {data: {test: 'hello'}}, function (ignore, data) {
      expect(data.test).to.be.equal('hello')
      done()
    })
  })
  it('should not override front-matter variables', function (done) {
    processData('---\na: b\n---', {data: {a: 'c'}}, function (ignore, data) {
      expect(data.a).to.be.equal('b')
      done()
    })
  })
})
describe('Capabilities to do custom links', function () {
  it('should be a simple function callback', function (done) {
    processData('', {data: {slug: 'fancy'}, linkIt: function (link) { return '/' + link }}, function (ignore, data) {
      expect(data.slug).to.be.equal('fancy')
      expect(data.link).to.be.equal('/fancy')
      done()
    })
  })
})
describe('processing file data', function () {
  it('should fill the file options', function (done) {
    processData('', {filepath: 'fancy'}, function (ignore, data) {
      expect(data.filepath).to.be.equal('fancy')
      expect(data.path).to.be.equal('fancy')
      expect(data.dir).to.be.equal('.')
      expect(data.slug).to.be.equal('fancy')
      expect(data.link).to.be.equal('fancy')
      expect(Object.keys(data)).to.only.once.include(DEFAULT_FIELDS.concat('filepath', 'dir', 'slug', 'link', 'path'))
      done()
    })
  })
  it('should make nice slugs from the file path', function (done) {
    var originalPath = 'funny Oh Bir7関西'
    processData('', {filepath: originalPath, slug: {lower: true}}, function (ignore, data) {
      expect(data.filepath).to.be.equal(originalPath)
      expect(data.slug).to.be.equal('funny-oh-bir7')
      expect(data.link).to.be.equal(data.slug)
      done()
    })
  })
  it('should prioritize the front matter slug over the path', function (done) {
    processData('---\nslug: b\n---', {filepath: 'a'}, function (ignore, data) {
      expect(data.slug).to.be.equal('b')
      done()
    })
  })
  it('should respect paths', function (done) {
    var originalPath = 'this/is/a/path/file'
    processData('', {filepath: originalPath}, function (ignore, data) {
      expect(data.filepath).to.be.equal(originalPath)
      expect(data.slug).to.be.equal('this-is-a-path-file')
      expect(data.link).to.be.equal(data.slug)
      done()
    })
  })
  it('should respect file endings', function (done) {
    var originalPath = 'this/is/a/path/file.md'
    processData('', {filepath: originalPath}, function (ignore, data) {
      expect(data.filepath).to.be.equal(originalPath)
      expect(data.slug).to.be.equal('this-is-a-path-file')
      expect(data.link).to.be.equal(data.slug)
      done()
    })
  })
  it('should respect file endings', function (done) {
    var originalPath = 'this/is/a/path/file.md'
    processData('', {filepath: originalPath}, function (ignore, data) {
      expect(data.filepath).to.be.equal(originalPath)
      expect(data.slug).to.be.equal('this-is-a-path-file')
      expect(data.link).to.be.equal(data.slug)
      done()
    })
  })
  it('should extract the date from the path', function (done) {
    var originalPath = '2013-03-02-file.md'
    processData('', {filepath: originalPath}, function (ignore, data) {
      expect(data.filepath).to.be.equal(originalPath)
      expect(data.slug).to.be.equal('2013-03-02-file')
      expect(data.link).to.be.equal(data.slug)
      expect(data.date.toString()).to.be.equal(new Date(2013, 2, 2).toString())
      done()
    })
  })
  it('should extract the date from the fs', function (done) {
    var originalPath = __dirname + '/data/just-a-file.md'
    processData('', {filepath: originalPath}, function (ignore, data) {
      expect(data.date.toString()).to.be.equal(fs.statSync(originalPath).mtime.toString())
      done()
    })
  })
  it('should not override the path date with the file date', function (done) {
    var originalPath = __dirname + '/data/2011-01-01-date-path.md'
    processData('', {filepath: originalPath, root: __dirname + '/data/'}, function (ignore, data) {
      expect(data.date.toString()).to.be.equal(new Date(2011, 0, 1).toString())
      done()
    })
  })
  it('should not override the yaml date with the date path', function (done) {
    var originalPath = __dirname + '/data/2010-01-02-yaml-date.md'
    processData('---\ndate: 2013-02-01\n---', {filepath: originalPath, root: __dirname + '/data/'}, function (ignore, data) {
      expect(data.date.toString()).to.be.equal(new Date(Date.UTC(2013, 1, 1)).toString())
      done()
    })
  })
  it('should not override the yaml string date with the date path', function (done) {
    var originalPath = __dirname + '/data/2010-01-02-yaml-date.md'
    processData('---\ndate: "2013-02-01"\n---', {filepath: originalPath, root: __dirname + '/data/'}, function (ignore, data) {
      expect(data.date.toString()).to.be.equal(new Date(2013, 1, 1).toString())
      done()
    })
  })
  it('should allow overriding of the link independently of the slug', function (done) {
    processData('---\nslug: abc\nlink: def\n---', function (ignore, data) {
      expect(data.slug).to.be.equal('abc')
      expect(data.link).to.be.equal('def')
      done()
    })
  })
})
describe('Custom compilers', function () {
  it('should be allowed', function (done) {
    processData('hello', {data: {check: true},
      compiler: function (ctx) {
        expect(ctx.data.body).to.be.equal('hello')
        expect(ctx.data.check).to.be.equal(true)
        ctx.data.html = 'world'
        return ctx
      }
    }, function (ignore, data) {
      expect(data.body).to.be.equal('hello')
      expect(data.check).to.be.equal(true)
      expect(data.html).to.be.equal('world')
      done()
    })
  })
  it('should optionally be async', function (done) {
    processData('hello', {data: {check: true},
      compiler: function (ctx, callback) {
        expect(ctx.data.body).to.be.equal('hello')
        expect(ctx.data.check).to.be.equal(true)
        ctx.data.html = 'world'
        setImmediate(callback.bind(null, null, ctx))
      }
    }, function (ignore, data) {
      expect(data.body).to.be.equal('hello')
      expect(data.check).to.be.equal(true)
      expect(data.html).to.be.equal('world')
      done()
    })
  })
  it('should pass errors in sync mode', function (done) {
    processData('', {
      compiler: function () {
        throw new Error('test')
      }
    }, function (err) {
      expect(err.message).to.be.equal('test')
      done()
    })
  })
  it('should pass errors in async mode', function (done) {
    processData('', {
      compiler: function (ctx, callback) {
        setImmediate(callback.bind(null, new Error('test')))
      }
    }, function (err) {
      expect(err.message).to.be.equal('test')
      done()
    })
  })
  it('should be able to access the options', function (done) {
    processData('', {test: true,
      compiler: function (ctx) {
        expect(ctx.options.test).to.be.equal(true)
        return ctx
      }
    }, done)
  })
})
describe('excerpts', function () {
  it('should just work', function (done) {
    processData('', {
      compiler: function (ctx) {
        ctx.data.html = LONG_TEXT
        return ctx
      }
    }, function (ignore, data) {
      expect(data.createExcerpt()).to.be.equal('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc ut finibus arcu. Vestibulum id suscipit mauris. Sed venenatis condimentum…')
      done()
    })
  })
  it('be predefinable', function (done) {
    processData('---\nexcerpt: hello\n---', {
      compiler: function (ctx) {
        ctx.data.html = LONG_TEXT
        return ctx
      }
    }, function (ignore, data) {
      expect(data.createExcerpt()).to.be.equal('hello')
      done()
    })
  })
  it('custom excerpt options', function (done) {
    processData('', {
      compiler: function (ctx) {
        ctx.data.html = LONG_TEXT
        return ctx
      }
    }, function (ignore, data) {
      expect(data.createExcerpt({pruneLength: 6})).to.be.equal('Lorem…')
      done()
    })
  })
})
describe('images should be extracted', function () {
  it('from html code', function (done) {
    processData('<img src="hi">', {images: true,
      compiler: function (ctx) {
        ctx.data.html = ctx.data.body
        return ctx
      }
    }, function (ignore, data) {
      expect(data.images[0].src).to.be.equal('hi')
      done()
    })
  })
})

exports.lab = lab
