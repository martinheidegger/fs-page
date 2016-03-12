'use strict'

var processImages = require('../processImages')

function test (name, method) {
  return require('tap').test('extracting images from html code should ' + name, method)
}

test('not fail if no images are found', function (t) {
  processImages('<html></html>', function (err, result) {
    var data = result.images
    t.equal(err, null)
    t.equal(data.length, 0)
    t.end()
  })
})
test('not fail if the content isn‘t valid html', function (t) {
  processImages('<x', function (err, result) {
    var data = result.images
    t.equal(err, null)
    t.equal(data.length, 0)
    t.end()
  })
})
test('return regular image paths', function (t) {
  processImages('<img src="hello">', function (err, result) {
    var data = result.images
    t.equal(err, null)
    t.equal(data.length, 1)
    var image = data[0]
    t.equal(image.type, 'img')
    t.equal(image.classes, null)
    t.equal(image.selector, 'img')
    t.equal(image.src, 'hello')
    t.end()
  })
})
test('return empty image paths', function (t) {
  processImages('<img>', function (err, result) {
    var data = result.images
    t.equal(err, null)
    t.equal(data.length, 1)
    t.equal(data[0].src, null)
    t.end()
  })
})
test('fill a complete selector', function (t) {
  processImages('<img id="a" class="b c">', function (ignoreError, result) {
    var data = result.images
    t.equal(data[0].selector, 'img#a.b.c')
    t.end()
  })
})
test('work with classes only', function (t) {
  processImages('<img class="b c">', function (ignoreError, result) {
    var data = result.images
    t.equal(data[0].selector, 'img.b.c')
    t.end()
  })
})
test('work with empty classes', function (t) {
  processImages('<img class=" ">', function (ignoreError, result) {
    var data = result.images
    t.equal(data[0].classes, null)
    t.end()
  })
})
test('parse the classes sorted by name', function (t) {
  processImages('<img class="c b">', function (ignoreError, result) {
    var data = result.images
    t.equal(data[0].selector, 'img.b.c')
    t.equal(data[0].classes[0], 'b')
    t.equal(data[0].classes[1], 'c')
    t.end()
  })
})
test('parse the classes with spaces before and after', function (t) {
  processImages('<img class=" c b ">', function (ignoreError, result) {
    var data = result.images
    t.equal(data[0].selector, 'img.b.c')
    t.equal(data[0].classes[0], 'b')
    t.equal(data[0].classes[1], 'c')
    t.end()
  })
})
test('parse two images', function (t) {
  processImages('<img src="a"><img src="b">', function (ignoreError, result) {
    var data = result.images
    t.equal(data[0].src, 'a')
    t.equal(data[1].src, 'b')
    t.end()
  })
})
test('prioritise a featured image ', function (t) {
  processImages('<img src="a"><img src="c"><img src="b" class="featured">', function (ignoreError, result) {
    var data = result.images
    t.equal(data[0].src, 'b')
    t.equal(data[1].src, 'a')
    t.end()
  })
})
test('prioritise a featured image B', function (t) {
  processImages('<img src="a" class="featured"><img src="c"><img src="b">', function (ignoreError, result) {
    var data = result.images
    t.equal(data[0].src, 'a')
    t.equal(data[1].src, 'c')
    t.end()
  })
})
test('prioritise a featured image C', function (t) {
  processImages('<img src="a"><img src="c" class="featured"><img src="b">', function (ignoreError, result) {
    var data = result.images
    t.equal(data[0].src, 'c')
    t.equal(data[1].src, 'a')
    t.end()
  })
})
test('ignore duplicate images', function (t) {
  processImages('<img src="a"><img src="a">', function (ignoreError, result) {
    var data = result.images
    t.equal(data[0].src, 'a')
    t.equal(data.length, 1)
    t.end()
  })
})
test('prioritze data-src over src of duplicate images', function (t) {
  processImages('<img data-src="b" src="ac"><img src="b">', function (ignoreError, result) {
    var data = result.images
    t.equal(data[0].src, 'b')
    t.equal(data.length, 1)
    t.end()
  })
})
test('store the original data-src and src url', function (t) {
  processImages('<img data-src="b" src="c">', {
    convertUrl: function () {
      return 'a'
    }
  }, function (ignoreError, result) {
    var node = result.$('img')[0]
    t.equal(node.attribs.src, 'a')
    t.equal(node.original.src, 'c')
    t.equal(node.original['data-src'], 'b')
    t.end()
  })
})
test('prioritze id over data-src of duplicate images', function (t) {
  processImages('<img data-id="b" data-src="c" src="ac"><img src="b">', function (ignoreError, result) {
    var data = result.images
    t.equal(data[0].src, 'c')
    t.equal(data.length, 1)
    t.end()
  })
})
test('allow processing of image paths', function (t) {
  processImages('<img src="ac">',
    {
      convertUrl: function (src) {
        return 'd'
      }
    },
    function (ignoreError, result) {
      var data = result.images
      t.equal(data[0].src, 'd')
      t.end()
    })
})
test('allow processing of absolute image paths', function (t) {
  processImages('<img src="http://ac">',
    {
      convertUrl: function (src) {
        return 'd'
      }
    },
    function (ignoreError, result) {
      var data = result.images
      t.equal(data[0].src, 'd')
      t.end()
    })
})
test('make file system paths relative to the current working directory', function (t) {
  processImages('<img src="../pro/b/../a">',
    function (ignoreError, result) {
      var data = result.images
      t.equal(data[0].simpleSrc, '../pro/a')
      t.end()
    })
})
test('make file system paths relative to the a specified working directory', function (t) {
  processImages('<img src="/abcd/e">', {cwd: '/abcd/d'},
    function (ignoreError, result) {
      var data = result.images
      t.equal(data[0].simpleSrc, '../e')
      t.end()
    })
})
test('allow processing of absolute https image paths', function (t) {
  processImages('<img src="https://ac">',
    {
      convertUrl: function (src) {
        return 'd'
      }
    },
    function (ignoreError, result) {
      var data = result.images
      t.equal(data[0].src, 'd')
      t.end()
    })
})
test('proper access of https? sources', function (t) {
  // covered by code-coverage
  processImages('<img src="http://test">',
    function (ignoreError, result) {
      var data = result.images
      t.equal(data[0].simpleSrc, 'http://test')
      t.end()
    })
})
