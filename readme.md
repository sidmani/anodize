# Anodize your webpages
Anodize is a static site generator and templating language. It's the magic behind https://www.sidmani.com and allows you to create no-frills websites from simple templates.

## Getting started:
`$ npm install -g anodize`  
`$ cd your-website-directory`  
`$ anodize init`  
`$ anodize run`

## How it works
### Markdown format
Markdown parsing is done by [ShowdownJS](https://github.com/showdownjs/showdown/).
Each file begins with a header in YAML format:  
```
title: My first post
sort: 5
some_key: true
this:
- is
- yaml
---
## this is markdown
```
The key-value pairs are accessible to the templating engine under the `object` key (e.g. `object.title`) and the remainder of the document is accessible under the key `object.body`.   
The key `object.id` is special and refers to the name of the document (without the `.md` file extension).  
The key `object.sort`, if specified, is the sort key of the documents in their respective directory list. Otherwise, they are sorted lexicographically by filename.

### Templates
Anodize uses the Liquid templating language through [liquidjs](https://github.com/harttle/liquidjs).

Four top-level objects are available:  

`object` contains the current file's metadata.
- `id`: the filename, excluding the `.md` file extension
- `directory`: the name of the parent directory
- `path`: the path of the file, relative to the root directory, excluding the `.md` file extension
- `layout`: the file in which this file's layout is defined
- `body`: the body of the file transformed into HTML
- `idx`: the index of the file in the sorted directory array  
All keys defined in the header YAML are also available.

`site` contains the parsed directory structure as both an array and a dictionary.
- `<object id>`: look up a file or folder by id
- `<sort index>`: look up a file or folder by sort index

`current` contains the file structure of the current directory.  
- `<object id>`: look up a file or folder by id

Each non-markdown file will be assigned two properties:  
- `id`: name **with** file extension
- `path`: path **with** file extension

`global` contains keys defined in `.anodize.yml` under the top-level `global` key.

For each `.md` file with a defined layout, Anodize will generate a corresponding `html` file.

Note that the `index.md` file is not included in a directory array.

### Server
Anodize comes with [live-server](https://github.com/tapio/live-server), a development webserver with live reloading. Just run  
`$ anodize watch --serve`  
and open `http://localhost:8000` in a browser.

### Indexify
It's more visually appealing for a URL to look like `example.com/page/` instead of `example.com/page.html`. Using the `--indexify` option on `anodize run` or `anodize watch` will create each non-index output as the index of its own subdirectory, allowing URLs to be specified without the `.html` extension. This will (obviously) break all URLs that still contain the `.html` portion.

### Command line interface
`$ anodize help`  
```
anodize [command]

Commands:
  anodize clean             delete all generated files
  anodize config <command>  manage the anodize configuration
  anodize init              create the directory structure
  anodize parse             parse the header of an input file
  anodize run               run the generator
  anodize serve             Serve files over HTTP from the target directory
  anodize watch             Execute the generator each time the source
                            directory changes

Options:
  --help                      Show help                                [boolean]
  --version                   Show version number                      [boolean]
  --working-dir, --input, -i  Set the working directory           [default: "."]
  --source, -s                The directory containing source files
  --target, -t                The directory in which to store generated files
  --template                  The directory containing template files
  --ignore                    Ignore files matching glob patterns        [array]

```

### Configuration

Settings are defined in a file named `.anodize.yml`, which is automatically created by running `anodize init`.

The keys `target`, `source`, `extension`, and `ignore` correspond to the command line options of the same name.

The key `head` specifies the contents of the `<head>` tag. Available sub-keys and corresponding tags:
- `title`: string, `<title>`
- `description`: string, `<meta name="description">`
- `keywords`: array, `<meta name="keywords">`
- `css`: array, `<link rel="stylesheet" href="path/to/file.css">`
- `raw`: array, inserts specified text into `<head>`.

The contents of the key `global` are available to the templating engine under the key `global`.

## About
I wrote this to power [my blog](https://sidmani.com). If you do something cool with this, a link back here or to my blog would be nice.  

## License
GNU-AGPLv3
