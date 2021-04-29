# Node Sass Token Importer

This package extends Patrick Mowrer's [node-sass-json-importer](https://github.com/pmowrer/node-sass-json-importer).

A token importer for [node-sass](https://github.com/sass/node-sass) that allows the importing of `.ts`, `.js`, `.json` and `.json5` files within Sass.

## Usage

### [node-sass](https://github.com/sass/node-sass)

This package hooks into the node-sass [importer api](https://github.com/sass/node-sass#importer--v200---experimental).

```javascript
var sass = require('node-sass');
var tokenImporter = require('node-sass-token-importer');

// Example 1
sass.render({
  file: scss_filename,
  importer: tokenImporter(),
  [, options..]
}, function(err, result) {
  console.log(result.css.toString())
});

// Example 2
var result = sass.renderSync({
  data: scss_content
  importer: [tokenImporter(), someOtherImporter]
  [, options..]
});
```

### [node-sass](https://github.com/sass/node-sass) CLI

To run this using node-sass CLI, point `--importer` to your installed `node-sass-token-importer`, for example:

```sh
./node_modules/.bin/node-sass --importer node_modules/node-sass-token-importer/dist/cli.js --recursive ./src --output ./dist
```

### Webpack / [sass-loader](https://github.com/jtangelder/sass-loader)

```javascript
import tokenImporter from 'node-sass-token-importer';

// Webpack config
export default {
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader
          {
            loader: 'sass-loader',
            options: {
              // Apply the JSON importer via sass-loader's options.
              sassOptions: {
                importer: tokenImporter(),
              },
            },
          },
        },
      ],
    ],
  },
};
```

#### ES Modules

To enable ES Module transpilation rename your `webpack.config.js` file to `webpack.config.babel.js`.

#### TypeScript

To enable TypeScript transpilation rename your `webpack.config.js` file to `webpack.config.babel.ts`.

## Importing

### Importing strings

Since JSON doesn't map directly to Sass's data types, a common source of confusion is how to handle strings. While [Sass allows strings to be both quoted and unquoted](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#sass-script-strings), strings containing spaces, commas and/or other special characters have to be wrapped in quotes. In terms of JSON, this means the string has to be double quoted:

##### Incorrect

```json
{
  "description": "A sentence with spaces."
}
```

##### Correct

```json
{
  "description": "'A sentence with spaces.'"
}
```

### Importing comma separated arguments

It is recommended that you import comma separated arguments as arrays. This will ensure the scalability of your variables, allowing for them to be stored as `!global` variables and values of a `map-key`.

##### Recommended

```json
{
  "fontFamily": ["'Open Sans'", "Helvetica", "Arial", "sans-serif"]
}
```

##### Not recommended

```json
{
  "fontFamily": "'Open Sans', Helvetica, Arial, sans-serif"
}
```

### Importing `.ts` and/or `.js` Files

You can also import `.js` and `.ts` files. This way you can use TypeScript or JavaScript to compose and export your tokens.

```javascript
// Example 1
const colorBrandPrimary = '#f0f';
const colorBrandSecondary = '#ff0';

module.exports = {
  colorBrandPrimary,
  colorBrandSecondary,
};
```

```typescript
// Example 2
const colorBrandPrimary: string = '#f0f';
const colorBrandSecondary: string = '#ff0';

const tokens: Record<string, string> = {
  colorBrandPrimary,
  colorBrandSecondary,
};

export {
  ...tokens,
  tokens as default,
};

/*
 * Please Note:
 * Default exports inherit the file's name in kebab-case format (instead of
 * $default). For example, if the source above was stored in a file named
 * 'tokens.ts' the default export will be assigned to $tokens in your Sass
 * environment.
 *
 * This behaviour is to avoid consecutive imports overwriting what is assigned
 * to the $default variable.
 */
```

## Custom resolver

Should you care to resolve paths, say, starting with `~/` relative to project root or some other arbitrary directory, you can do so as follows:

`json/tokens.json` file:

```json
{
  "body-margin": 0
}
```

`styles.scss` file:

```scss
@import '~/tokens.json';

body {
  margin: $body-margin;
}
```

```js
var path = require('path');
var sass = require('node-sass');
var tokenImporter = require('../dist/node-sass-token-importer');

sass.render(
  {
    file: './styles.scss',
    importer: tokenImporter({
      resolver: function (dir, url) {
        return url.startsWith('~/')
          ? path.resolve(dir, 'json', url.substr(2))
          : path.resolve(dir, url);
      },
    }),
  },
  function (err, result) {
    console.log(err || result.css.toString());
  },
);
```

## camelCase to kebab-case

If you want to convert camelCase keys into CSS/SCSS compliant kebab-case keys, for example:

`tokens.json` file:

```json
{
  "bgBackgroundColor": "#0ff"
}
```

For usage like so:

`styles.scss` file:

```scss
@import 'tokens.json';

div {
  background: $bg-background-color;
}
```

You can set the `convertCase` option to `true` as an argument in `tokenImporter` like so:

```javascript
sass.render(
  {
    file: './styles.scss',
    importer: tokenImporter({
      convertCase: true,
    }),
  },
  function (err, result) {
    console.log(err || result.css.toString());
  },
);
```

```sh
./node_modules/.bin/node-sass --importer node_modules/node-sass-token-importer/dist/cli.js --convertCase --recursive ./src --output ./dist
```
