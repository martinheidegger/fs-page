'use strict'

var fs = require('fs')
var path = require('path')
var parse = require('../parse')
var DEFAULT_FIELDS = ['published', 'categories', 'date', 'body']
var LONG_TEXT = fs.readFileSync(path.join(__dirname, 'data', 'longtext'))

function includeOnce (t, keys, onlyOnce) {
  var counter = {}
  keys.forEach(function (key) {
    counter[key] = (counter[key] || 0) + 1
  })
  onlyOnce.forEach(function (key) {
    if (!counter[key]) {
      t.fail('Key is missing in keys ' + key)
    }
    if (counter[key] !== 1) {
      t.fail('Key exists more than once ' + key)
    }
  })
}

function describe (prefix, handler) {
  handler(function it (name, method) {
    require('tap').test(prefix + ' ' + name, method)
  })
}
describe('processing simple data', function (it) {
  it('should evaluate if a buffer is text', function (t) {
    parse(new Buffer([400, 800, 20]), function (ignore, data) {
      t.equal(data.isText, false)
      t.end()
    })
  })
  it('should preserve isText=false marker', function (t) {
    parse(new Buffer(''), {isText: false}, function (ignore, data) {
      t.equal(data.isText, false)
      t.end()
    })
  })
  it('should have at least the basic fields', function (t) {
    parse('', null, function (ignore, data) {
      t.equal(data.published, true)
      t.equal(data.categories.length, 0)
      t.equal(data.date, null)
      t.equal(data.body, '')
      t.equal(data.isText, true)
      includeOnce(t, Object.keys(data), DEFAULT_FIELDS)
      t.end()
    })
  })
  it('should process the front-matter data', function (t) {
    parse('---\na: b\n---', function (ignore, data) {
      t.equal(data.a, 'b')
      t.equal(data.body, '')
      t.end()
    })
  })
  it('should allow overriding of defaults', function (t) {
    parse('---\npublished: false\n---', function (ignore, data) {
      t.equal(data.published, false)
      t.end()
    })
  })
  it('should allow specifying categories', function (t) {
    parse('---\ncategories: \n - hello\n - world\n---', function (ignore, data) {
      includeOnce(t, data.categories, ['hello', 'world'])
      t.end()
    })
  })
})
describe('Using default options', function (it) {
  it('should be accepted', function (t) {
    parse('', {data: {test: 'hello'}}, function (ignore, data) {
      t.equal(data.test, 'hello')
      t.end()
    })
  })
  it('should not override front-matter variables', function (t) {
    parse('---\na: b\n---', {data: {a: 'c'}}, function (ignore, data) {
      t.equal(data.a, 'b')
      t.end()
    })
  })
})
describe('Should accept uncommon input', function (it) {
  it('should resolve the function', function (t) {
    parse(function () { return 'hello' }, {}, function (ignore, data) {
      t.equal(data.body, 'hello')
      t.end()
    })
  })
  it('should not allow null or undefined', function (t) {
    parse(null, {}, function (error, data) {
      t.equal(error.message, 'No data given to process.')
      t.end()
    })
  })
  it('should stringify an object', function (t) {
    parse({
      toString: function () {
        return 'hello'
      }
    }, {}, function (ignore, data) {
      t.equal(data.body, 'hello')
      t.end()
    })
  })
})
describe('processing file data', function (it) {
  it('should use the stat given', function (t) {
    var someStat = {
      mtime: 'not processed'
    }
    parse('', {filepath: 'fancy', stat: someStat}, function (ignore, data) {
      t.equal(data.date, 'not processed')
      t.equal(data.stat, someStat)
      t.end()
    })
  })
  it('should fill the file options', function (t) {
    parse('', {filepath: 'fancy'}, function (ignore, data) {
      t.equal(data.filepath, 'fancy')
      t.equal(data.path, 'fancy')
      t.equal(data.dir, '.')
      t.equal(data.slug, 'fancy')
      t.equal(data.link, 'fancy')
      t.notEqual(data.stat, null)
      includeOnce(t, Object.keys(data), DEFAULT_FIELDS.concat('filepath', 'dir', 'slug', 'link', 'path'))
      t.end()
    })
  })
  it('should make nice slugs from the file path', function (t) {
    var originalPath = 'funny Oh Bir7関西'
    parse('', {filepath: originalPath, slug: {lower: true}}, function (ignore, data) {
      t.equal(data.filepath, originalPath)
      t.equal(data.slug, 'funny-oh-bir7')
      t.equal(data.link, data.slug)
      t.end()
    })
  })
  it('should prioritize the front matter slug over the path', function (t) {
    parse('---\nslug: b\n---', {filepath: 'a'}, function (ignore, data) {
      t.equal(data.slug, 'b')
      t.end()
    })
  })
  it('should respect paths', function (t) {
    var originalPath = 'this/is/a/path/file'
    parse('', {filepath: originalPath}, function (ignore, data) {
      t.equal(data.filepath, originalPath)
      t.equal(data.slug, 'this-is-a-path-file')
      t.equal(data.link, data.slug)
      t.end()
    })
  })
  it('should respect file endings', function (t) {
    var originalPath = 'this/is/a/path/file.md'
    parse('', {filepath: originalPath}, function (ignore, data) {
      t.equal(data.filepath, originalPath)
      t.equal(data.slug, 'this-is-a-path-file')
      t.equal(data.link, data.slug)
      t.end()
    })
  })
  it('should respect file endings', function (t) {
    var originalPath = 'this/is/a/path/file.md'
    parse('', {filepath: originalPath}, function (ignore, data) {
      t.equal(data.filepath, originalPath)
      t.equal(data.slug, 'this-is-a-path-file')
      t.equal(data.link, data.slug)
      t.end()
    })
  })
  it('should extract the date from the path', function (t) {
    var originalPath = '2013-03-02-file.md'
    parse('', {filepath: originalPath}, function (ignore, data) {
      t.equal(data.filepath, originalPath)
      t.equal(data.slug, '2013-03-02-file')
      t.equal(data.link, data.slug)
      t.equal(data.date.toString(), new Date(2013, 2, 2).toString())
      t.end()
    })
  })
  it('should extract the date from the fs', function (t) {
    var originalPath = path.join(__dirname, 'data', 'just-a-file.md')
    parse('', {filepath: originalPath}, function (ignore, data) {
      t.equal(data.date.toString(), fs.statSync(originalPath).mtime.toString())
      t.end()
    })
  })
  it('should not override the path date with the file date', function (t) {
    var originalPath = path.join(__dirname, 'data', '2011-01-01-date-path.md')
    parse('', {filepath: originalPath, root: path.join(__dirname, 'data')}, function (ignore, data) {
      t.equal(data.date.toString(), new Date(2011, 0, 1).toString())
      t.end()
    })
  })
  it('should not override the yaml date with the date path', function (t) {
    var originalPath = path.join(__dirname, 'data', '2010-01-02-yaml-date.md')
    parse('---\ndate: 2013-02-01\n---', {filepath: originalPath, root: path.join(__dirname, 'data')}, function (ignore, data) {
      t.equal(data.date.toString(), new Date(Date.UTC(2013, 1, 1)).toString())
      t.end()
    })
  })
  it('should not override the yaml string date with the date path', function (t) {
    var originalPath = path.join(__dirname, 'data', '2010-01-02-yaml-date.md')
    parse('---\ndate: "2013-02-01"\n---', {filepath: originalPath, root: path.join(__dirname, 'data')}, function (ignore, data) {
      t.equal(data.date.toString(), new Date(2013, 1, 1).toString())
      t.end()
    })
  })
  it('should allow overriding of the link independently of the slug', function (t) {
    parse('---\nslug: abc\nlink: def\n---', function (ignore, data) {
      t.equal(data.slug, 'abc')
      t.equal(data.link, 'def')
      t.end()
    })
  })
})
describe('Custom compilers', function (it) {
  it('should be allowed', function (t) {
    parse('hello', {data: {check: true},
      compiler: function (ctx) {
        t.equal(ctx.data.body, 'hello')
        t.equal(ctx.data.check, true)
        ctx.data.html = 'world'
        return ctx
      }
    }, function (ignore, data) {
      t.equal(data.body, 'hello')
      t.equal(data.check, true)
      t.equal(data.html, 'world')
      t.end()
    })
  })
  it('should optionally be async', function (t) {
    parse('hello', {data: {check: true},
      compiler: function (ctx, callback) {
        t.equal(ctx.data.body, 'hello')
        t.equal(ctx.data.check, true)
        ctx.data.html = 'world'
        setImmediate(callback.bind(null, null, ctx))
      }
    }, function (ignore, data) {
      t.equal(data.body, 'hello')
      t.equal(data.check, true)
      t.equal(data.html, 'world')
      t.end()
    })
  })
  it('should pass errors in sync mode', function (t) {
    parse('', {
      compiler: function () {
        throw new Error('test')
      }
    }, function (err) {
      t.equal(err.message, 'test')
      t.end()
    })
  })
  it('should pass errors in async mode', function (t) {
    parse('', {
      compiler: function (ctx, callback) {
        setImmediate(callback.bind(null, new Error('test')))
      }
    }, function (err) {
      t.equal(err.message, 'test')
      t.end()
    })
  })
  it('should be able to access the options', function (t) {
    parse('', {test: true,
      compiler: function (ctx) {
        t.equal(ctx.options.test, true)
        return ctx
      }
    }, t.end)
  })
})
describe('excerpts', function (it) {
  it('should just work', function (t) {
    parse('', {
      compiler: function (ctx) {
        ctx.data.html = LONG_TEXT
        return ctx
      },
      excerpt: true
    }, function (ignore, data) {
      t.equal(data.excerpt, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc ut finibus arcu. Vestibulum id suscipit mauris. Sed venenatis condimentum…')
      t.end()
    })
  })
  it('not break if the compiler doesnt create html', function (t) {
    parse('', {
      excerpt: true
    }, function (ignore, data) {
      t.equal(data.excerpt, '')
      t.end()
    })
  })
  it('be predefinable', function (t) {
    parse('---\nexcerpt: hello\n---', {
      compiler: function (ctx) {
        ctx.data.html = LONG_TEXT
        return ctx
      },
      excerpt: true
    }, function (ignore, data) {
      t.equal(data.excerpt, 'hello')
      t.end()
    })
  })
  it('custom excerpt options', function (t) {
    parse('', {
      compiler: function (ctx) {
        ctx.data.html = LONG_TEXT
        return ctx
      },
      excerpt: {
        pruneLength: 6
      }
    }, function (ignore, data) {
      t.equal(data.excerpt, 'Lorem…')
      t.end()
    })
  })
})
describe('images should be extracted', function (it) {
  it('from html code', function (t) {
    parse('<img src="hi">', {images: true,
      compiler: function (ctx) {
        ctx.data.html = ctx.data.body
        return ctx
      }
    }, function (ignore, data) {
      t.equal(data.images[0].src, 'hi')
      t.end()
    })
  })
})
