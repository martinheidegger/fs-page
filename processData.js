'use strict'

var fs = require('fs')
var path = require('path')
var slug = require('slug')
var frontMatter = require('front-matter')
var dateParser = require('fs-date-parser')
var Readable = require('stream').Readable

function preparePathForSlug (pth) {
  var pos = pth.search(/\.[^.]+$/)
  if (pos !== -1) {
    pth = pth.substr(0, pos)
  }
  return pth.replace(/\//ig, '-')
}

function gatherDefaults (data, options, callback) {
  if (options.data) {
    Object.keys(options.data).forEach(function (key) {
      if (data[key] === undefined) {
        data[key] = options.data[key]
      }
    })
  }
  data.published = data.published !== false
  if (!data.categories) {
    data.categories = []
  }
  data.isText = options.isText
  if (options.filepath !== undefined) {
    data.filepath = options.filepath
    if (options.root) {
      data.path = path.relative(options.root, data.filepath)
    } else {
      data.path = data.filepath
    }
    data.dir = path.dirname(data.filepath)
  }
  if (typeof data.date !== 'object') {
    data.date = dateParser(data.date || data.path).date
  }
  if (data.slug || data.path) {
    data.slug = slug(data.slug || preparePathForSlug(data.path), options.slug)
  }
  if (!data.link && data.slug !== undefined) {
    data.link = data.slug
  }
  if (data.link && typeof options.linkIt === 'function') {
    data.link = options.linkIt(data.link)
  }
  data.stat = options.stat
  var oneLastThing = function () {
    if (!data.date && data.stat) {
      data.date = data.stat.mtime
    }
    callback(null, data, options)
  }
  if (data.filepath && !data.stat) {
    fs.stat(data.filepath, function (ignoreError, stat) {
      data.stat = stat
      oneLastThing()
    })
  } else {
    setImmediate(oneLastThing)
  }
}

function postCompiler (callback, err, compilerContext) {
  if (err) {
    return callback(err)
  }
  var data = compilerContext.data

  var options = compilerContext.options
  // This is a shortcut api. You could just as well use
  //
  // require('fs-page/createExcerpt')(data.html)
  //
  // programatically
  data.createExcerpt = function (options) {
    var excerptBase = data.excerpt ? '<p>' + data.excerpt + '</p>' : data.html
    return require('excerpt-html')(excerptBase, options)
  }
  if (data.html && options.images) {
    return require('./processImages')(data.html, options.linkIt, function (ignoreError, result) {
      data.html = result.html
      data.images = result.images
      callback(null, data)
    })
  }
  callback(null, data)
}

function processBuffer (buffer, opts, callback) {
  var data
  var body
  if (opts.isText) {
    var fm = frontMatter(buffer.toString())
    data = fm.attributes
    body = fm.body
  } else {
    data = {}
    body = buffer
  }
  gatherDefaults(data, opts, function (ignoreError, data, options) {
    data.body = body
    var compilerContext = {
      options: options,
      data: data
    }
    if (typeof options.compiler === 'function') {
      if (options.compiler.length > 1) {
        return options.compiler(compilerContext, postCompiler.bind(null, callback))
      }
      try {
        compilerContext = options.compiler(compilerContext)
      } catch (e) {
        return postCompiler(callback, e, compilerContext)
      }
    }
    postCompiler(callback, null, compilerContext)
  })
}

module.exports = function processData (raw, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  if (!options) {
    options = {}
  }
  if (raw === null || raw === undefined) {
    return setImmediate(callback.bind(null, new Error('No data given to process.')))
  }
  if (typeof raw === 'function') {
    raw = raw(options)
  }
  if (raw instanceof Readable) {
    var _onceDone = false
    var once = function (err, data) {
      if (_onceDone) return

      _onceDone = true
      callback(err, data)
    }
    raw.on('error', once)
    var stream = raw.pipe(require('./transform')(options))
    stream.on('data', once.bind(null, null))
    stream.on('error', once)
    return
  }
  if (options.isText !== null && options.isText !== undefined) {
    options.isText = (options.isText && true) || false
  } else if (raw instanceof Buffer) {
    options.isText = require('istextorbinary').isTextSync(options.path, raw)
  } else {
    options.isText = true
  }
  if (!(raw instanceof Buffer)) {
    raw = new Buffer(raw.toString())
  }
  return processBuffer(raw, options, callback)
}
