'use strict'

var cheerio = require('cheerio')
var path = require('path')

function isFeatured (data) {
  return data.classes && data.classes.indexOf('featured') !== -1
}

function getImageDataById (images, id) {
  for (var i = 0; i < images.length; i++) {
    var image = images[i]
    if (image.id === id) {
      return image
    }
  }
}

function getSimpleSrc (cwd, src) {
  if (/^https?\:\/\//.test(src)) {
    return src
  }

  return path.relative(cwd, path.resolve(cwd, src))
}

function addToImageList (options, image, images) {
  var selector = 'img'
  var classes
  if (image.attribs.id) {
    selector += '#' + image.attribs.id
  }
  if (image.attribs['class']) {
    classes = image.attribs.class.split(/\s+/ig)
    if (classes[0] === '') {
      classes.shift()
    }
    if (classes[classes.length - 1] === '') {
      classes.pop()
    }
    if (classes.length > 0) {
      classes.sort()
      selector += '.' + classes.join('.')
    } else {
      classes = null
    }
  } else {
    classes = null
  }
  var src = image.attribs['data-src'] || image.attribs['src'] || null
  var simpleSrc = typeof src === 'string' ? getSimpleSrc(options.cwd || '.', src) : null
  var id = image.attribs['data-id'] || src || selector
  var data = getImageDataById(images, id)
  if (!data) {
    images.push({
      id: id,
      src: src,
      type: 'img',
      classes: classes,
      selector: selector,
      simpleSrc: simpleSrc
    })
  }
}

function modifyAttribute (node, attrib, modifier) {
  if (node.attribs[attrib]) {
    if (!node.original) {
      node.original = {}
    }
    node.original[attrib] = node.attribs[attrib]
    node.attribs[attrib] = modifier(node.attribs[attrib], node)
  }
}

module.exports = function processImages (html, options) {
  if (!options) {
    options = {}
  }
  var $ = cheerio.load(html)
  var images = []
  $('img').each(function (nr, image) {
    if (options.convertUrl) {
      modifyAttribute(image, 'src', options.convertUrl)
      modifyAttribute(image, 'data-src', options.convertUrl)
    }
    addToImageList(options, image, images)
  })
  images.sort(function (a, b) {
    // Prioritize featuredness
    return (!isFeatured(a) && isFeatured(b)) ? 1 : -1
  })
  return {
    images: images,
    $: $
  }
}
