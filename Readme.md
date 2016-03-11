# fs-page

fs-page is a node.js library(package) to process files on the file-system as content-source for a html page rendered by a system.

## Why this system?

Various static site generators use files on the file system to generate html pages for blogs. This library takes care of various basic functionalities that make sense to put in a library:

- *Front matter*: It loads [frontmatter information](http://jekyllrb.com/docs/frontmatter/) from the file
- *Date detection*: Put a date in the file path and the date will be sortable
- *Slug creation*: If you want to create a url based on the file path, this library does it.
- *Excerpt creation*: automatically get excerpts for files
- *Image list extraction*: A standard way to get the used images of a file in the html code.
- *Published-check*: The default API comes with a "published" flag system that
only lists content that isn't explicitly "not published".
- *Link resolution*: Link files as you would on the fs 

## How does it work?

First: Install the package.

```
$ npm i fs-page --save
```

Then you can import its main functionality like this:

```JavaScript
var processFile = require('fs-page/processFile')

processFile('')
```

With this you can process any string:

## Note

If you just want to process the data using a string you can use

```JavaScript
var processData = require('fs-page/processData')
```

instead of `processFile`