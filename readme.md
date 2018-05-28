# Anodize your webpages
Anodize is a static site generator and templating language. It's the magic behind https://www.sidmani.com and allows you to create no-frills websites from simple templates.

## Getting started:
`$ npm install -g anodize`  
`$ cd your-website-directory`  
`$ anodize init`  
`$ anodize run`

## How it works
### Markdown format
Markdown parsing is done by [ShowdownJS](https://github.com/showdownjs/showdown/). The only difference is that the first line of any markdown document must follow the special format:  
`title <key:value> <key:value>`  
The title and key-value pairs are accessible to the templating engine by their names (e.g. `title`) and the remainder of the document is accessible under the key `body`.   
The key `id` is special and refers to the name of the document (without the file extension).  
The key `sort`, if specified, is the sort key of the documents in their respective directory list. Otherwise, they are sorted lexicographically by filename.

### Template format
There are two types of templates in the Anodize template language.

#### Standard templates (`.t` files)
The following directives are legal in standard templates:  

`[[ path/to/file.t ]]` is a **direct replacement**. The contents of the specified file will directly replace the directive. Note that this works recursively, i.e. `file.t` can contain its own direct replacement directives.

`{{ key }}` is a **key-value replacement**. The keys available are those specified in the markdown document and the following special keys:  
`id` - the name of the file excluding the `.md` extension.  
`body` - everything after the title line of the file  
`prev` - the id of the file sorted before this one  
`next` - the id of the file sorted after this one  

`?? key | template ??` is a **conditional key-value replace**. If `key` exists, the template is parsed. Otherwise, the directive is elided. The directive can also be inverted by writing `!key`.

`<( #Hello! )>` executes an **inline markdown parse**. No keys are checked.

For each `.md` file in a folder containing a `template.t`, Anodize will generate a corresponding `html` file.

#### Transform templates (`.tt` files)
Transform templates allow the creation of dynamic lists.    
`<< source[lower,upper] | template >>` is a **list replacement**.
The first key `source` specifies a directory of items to index. The `lower` and `upper` bounds may be any of the following:
- `5` a number specifying a fixed index
- `$` the final index
- `$-5` any index before the final index  

The `template` key can be an inline template or direct replacement directive.

### Command line interface
`$ anodize help`  
```
anodize [command]

Commands:
  anodize clean             delete all generated files
  anodize config <command>  manage the anodize configuration
  anodize copy              Copy static files into the target directory
  anodize init              create the directory structure
  anodize run               run the generator

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
