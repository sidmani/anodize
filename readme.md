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
The key-value pairs are accessible to the templating engine by their names (e.g. `title`) and the remainder of the document is accessible under the key `body`.   
The key `id` is special and refers to the name of the document (without the `.md` file extension).  
The key `sort`, if specified, is the sort key of the documents in their respective directory list. Otherwise, they are sorted lexicographically by filename.

### Templates
Anodize uses the Liquid templating language (through liquidjs).

Two top-level objects are available:  

`object` contains the current file's metadata.
- `id`: the filename, excluding the `.md` file extension
- `directory`: the name of the parent directory
- `path`: the path of the file, relative to the root directory, excluding the `.md` file extension
- `layout`: the file in which this file's layout is defined
- `next`: the next sorted object in the same directory
- `prev`: the previous sorted object in the same directory
- `body`: the body of the file transformed into HTML

`site` contains the parsed directory structure.
- `id`: the name of the directory, or `_root` if root
- `path`: the path of the directory relative to the root directory
- `directory`: the name of the parent directory, or `undefined` if root
- `sort`: the sort value defined in the index file
- `directories`: array of subdirectories
- `files`: array of file metadata objects

For each `.md` file with a defined layout, Anodize will generate a corresponding `html` file.

### Command line interface
`$ anodize help`  
```
anodize [command]

Commands:
  anodize clean             delete all generated files
  anodize config <command>  manage the anodize configuration
  anodize copy              Copy static files into the target directory
  anodize init              create the directory structure
  anodize parse             parse the header of an input file
  anodize run               run the generator
  anodize watch             Execute the generator each time the source or static
                            directories change

Options:
  --help                      Show help                                [boolean]
  --version                   Show version number                      [boolean]
  --working-dir, --input, -i  Set the working directory           [default: "."]
  --source, -s                The directory containing source files
  --static                    A directory containing static assets
  --target, -t                The directory in which to store generated files
  --extension, -e             The file extension to append to generated files
  --ignore                    Ignore files matching glob patterns        [array]

```

### Configuration

Settings are defined in a file named `.anodize.yml`, which is automatically created by running `anodize init`.

The keys `target`, `source`, `static`, `extension`, and `ignore` correspond to the command line options of the same name.

The key `head` specifies the contents of the `<head>` tag. Available sub-keys and corresponding tags:
- `title`: string, `<title>`
- `description`: string, `<meta name="description">`
- `keywords`: array, `<meta name="keywords">`
- `css`: array, `<link rel="stylesheet" href="path/to/file.css">`
- `raw`: array, inserts specified text into `<head>`.

## About
I wrote this to power [my blog](https://sidmani.com). If you do something cool with this, a link back here or to my blog would be nice.  

## License
GNU-AGPLv3
