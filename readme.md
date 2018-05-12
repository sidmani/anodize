# Anodize your webpages
Anodize is a static site generator and templating language. It's the magic behind https://www.sidmani.com and allows you to create no-frills websites from simple templates.

## Getting started:
`$ npm install -g anodize`  
`$ cd your-website-directory`  
`$ anodize run`

## How it works
### Markdown format
Markdown parsing is done by [ShowdownJS](https://github.com/showdownjs/showdown/). The only difference is that the first line of any markdown document must follow the special format:  
`title <key:value> <key:value>`  
The title and key-value pairs are accessible to the templating engine by their names (e.g. `title`) and the remainder of the document is accessible under the key `body`.   
The key `id` is special and refers to the name of the document (without the file extension).  
The key `sort`, if specified, is the sort key of the documents in their respective directory list.

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
`anodize run [-ieoc]` executes the template generator.  
`-i <directory>` specifies an input directory. Defaults to working directory.   
`-o <directory>` specifies an output directory. Defaults to working directory.  
`-e <file-extension>` sets the extension for generated files. Defaults to `.html`.  
`-c` Dry run. No files are modified.  

`anodize clean [-iec]` deletes all generated files.

`anodize watch [-ieocs]` watches the input directory and executes `anodize run` each time a file changes.

## About
I wrote this to power [my blog](https://sidmani.com). If you do something cool with this, a link back here or to my blog would be nice.  

## License
GNU-AGPLv3
