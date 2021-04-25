const _ = require("lodash");
const isThere = require("is-there");
const path = require("path");
const resolve = require("path").resolve;
const basename = require("path").basename;
const extname = require("path").extname;
const dirname = require("path").dirname;

require("json5/lib/register"); // Enable JSON5 support
require("../utils/babel-register");

function tokenImporter(options = {}) {
  return function (url, prev) {
    if (!isValidFile(url)) {
      return null;
    }

    let includePaths = this.options.includePaths
      ? this.options.includePaths.split(path.delimiter)
      : [];
    let paths = [].concat(dirname(prev)).concat(includePaths);

    const resolver = options.resolver || resolve;
    let filePath = paths
      .map((path) => resolver(path, url))
      .filter(isThere)
      .pop();

    if (!filePath) {
      return new Error(
        `Unable to find "${url}" from the following path(s): ${paths.join(
          ", "
        )}. Check includePaths.`
      );
    }

    // Prevent file from being cached by Node's `require` on continuous builds.
    // https://github.com/Updater/node-sass-json-importer/issues/21
    delete require.cache[require.resolve(filePath)];

    try {
      const fileContents = require(filePath);
      const extensionlessFilename = basename(filePath, extname(filePath));
      const json = Array.isArray(fileContents)
        ? { [extensionlessFilename]: fileContents }
        : fileContents;

      return {
        contents: transformJSONtoSass(json, filePath, options),
      };
    } catch (error) {
      return new Error(
        `node-sass-json-importer: Error transforming JSON/JSON5 to SASS. Check if your JSON/JSON5 parses correctly. ${error}`
      );
    }
  };
}

function isValidFile(url) {
  return /\.(ts|js(on5?)?)$/.test(url);
}

function transformJSONtoSass(json, filePath, opts = {}) {
  return Object.keys(json)
    .filter((key) => isValidKey(key))
    .filter((key) => json[key] !== "#")
    .map(
      (key) => {
        const isDefaultKey = key === 'default';
        const validKey = isDefaultKey ? toFileName(filePath) : key;

        return `$${opts.convertCase ? toKebabCase(validKey) : validKey}: ${parseValue(
          json[key],
            opts
          )};`
      }
    )
    .join("\n");
}

function isValidKey(key) {
  return /^[^$@:].*/.test(key);
}

function toFileName (filePath) {
  const fileName = filePath.match(/[_0-9a-z\.\-\s]+(?=\.[0-9a-z]{2,5}$)/i)[0];
  return toKebabCase(fileName);
}

function toKebabCase(key) {
  return key
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+|\b)|[A-Z]?[a-z]+|[A-Z]|[0-9]+/g)
    .map((word) => word.toLowerCase())
    .join("-");
}

function parseValue(value, opts = {}) {
  if (_.isArray(value)) {
    return parseList(value);
  } else if (/,/.test(value)) {
    return `(${value})`;
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

tokenImporter.isValidFile = isValidFile;
tokenImporter.isValidKey = isValidKey;
tokenImporter.parseList = parseList;
tokenImporter.parseMap = parseMap;
tokenImporter.parseValue = parseValue;
tokenImporter.toFileName  = toFileName;
tokenImporter.toKebabCase = toKebabCase;
tokenImporter.transformJSONtoSass = transformJSONtoSass;

module.exports = tokenImporter;
