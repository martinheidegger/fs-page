'use strict'

var fs = require('fs')
var path = require('path')
var slug = require('slug')
var frontMatter = require('front-matter')
var dateParser = require('fs-date-parser')

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
  if (!data.date && data.filepath) {
    fs.stat(data.filepath, function (err, stat) {
      if (!err) {
        data.date = stat.mtime
      }
      callback(null, data)
    })
  } else {
    setImmediate(callback.bind(null, null, data))
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
  data.createExcerpt = require('./createExcerpt').bind(null, data.excerpt ? '<p>' + data.excerpt + '</p>' : data.html)
  if (data.html && options.images) {
    return require('./processImages')(data.html, options.linkIt, function (ignoreError, result) {
      data.html = result.html
      data.images = result.images
      callback(null, data)
    })
  }
  callback(null, data)
}

module.exports = function processData (raw, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  var fm = frontMatter(raw)
  gatherDefaults(fm.attributes, options, function (ignoreError, data) {
    data.body = fm.body
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
