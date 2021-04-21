const _ = require("lodash");
const isThere = require("is-there");
const path = require("path");
const resolve = require("path").resolve;
const basename = require("path").basename;
const extname = require("path").extname;
const dirname = require("path").dirname;

require("json5/lib/register"); // Enable JSON5 support

function jsonImporter(options = {}) {
  return function (url, prev) {
    if (!isJSONfile(url)) {
      return null;
    }

    let includePaths = this.options.includePaths
      ? this.options.includePaths.split(path.delimiter)
      : [];
    let paths = [].concat(dirname(prev)).concat(includePaths);

    const resolver = options.resolver || resolve;
    let fileName = paths
      .map((path) => resolver(path, url))
      .filter(isThere)
      .pop();

    if (!fileName) {
      return new Error(
        `Unable to find "${url}" from the following path(s): ${paths.join(
          ", "
        )}. Check includePaths.`
      );
    }

    // Prevent file from being cached by Node's `require` on continuous builds.
    // https://github.com/Updater/node-sass-json-importer/issues/21
    delete require.cache[require.resolve(fileName)];

    try {
      const fileContents = require(fileName);
      const extensionlessFilename = basename(fileName, extname(fileName));
      const json = Array.isArray(fileContents)
        ? { [extensionlessFilename]: fileContents }
        : fileContents;

      return {
        contents: transformJSONtoSass(json, options),
      };
    } catch (error) {
      return new Error(
        `node-sass-json-importer: Error transforming JSON/JSON5 to SASS. Check if your JSON/JSON5 parses correctly. ${error}`
      );
    }
  };
}

function isJSONfile(url) {
  return /\.js(on5?)?$/.test(url);
}

function transformJSONtoSass(json, opts = {}) {
  return Object.keys(json)
    .filter((key) => isValidKey(key))
    .filter((key) => json[key] !== "#")
    .map(
      (key) =>
        `$${opts.convertCase ? toKebabCase(key) : key}: ${parseValue(
          json[key],
          opts
        )};`
    )
    .join("\n");
}

function isValidKey(key) {
  return /^[^$@:].*/.test(key);
}

function toKebabCase(key) {
  return key
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+|\b)|[A-Z]?[a-z]+|[A-Z]|[0-9]+/g)
    .map((word) => word.toLowerCase())
    .join("-");
}

function parseValue(value, opts = {}) {
  if (_.isArray(value)) {
    return parseList(value, opts);
  } else if (_.isPlainObject(value)) {
    return parseMap(value, opts);
  } else if (value === "") {
    return '""'; // Return explicitly an empty string (Sass would otherwise throw an error as the variable is set to nothing)
  } else {
    return value;
  }
}

function parseList(list, opts = {}) {
  return `(${list.map((value) => parseValue(value)).join(",")})`;
}

function parseMap(map, opts = {}) {
  return `(${Object.keys(map)
    .filter((key) => isValidKey(key))
    .map(
      (key) =>
        `${opts.convertCase ? toKebabCase(key) : key}: ${parseValue(
          map[key],
          opts
        )}`
    )
    .join(",")})`;
}

jsonImporter.isJSONfile = isJSONfile;
jsonImporter.transformJSONtoSass = transformJSONtoSass;
jsonImporter.isValidKey = isValidKey;
jsonImporter.toKebabCase = toKebabCase;
jsonImporter.parseValue = parseValue;
jsonImporter.parseList = parseList;
jsonImporter.parseMap = parseMap;

module.exports = jsonImporter;
