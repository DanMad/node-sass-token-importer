/* eslint-env mocha */
import tokenImporter, {
  isValidFile,
  isValidKey,
  toFileName,
  toKebabCase,
  parseValue,
} from '../src';
import sass from 'node-sass';
import { expect } from 'chai';
import { resolve } from 'path';

const requiredImporter = require('../src/index');
const EXPECTATION = 'body {\n  color: #c33; }\n';

describe('node-sass-token-importer', function () {
  // TODO: Added to verify named exports + CommonJS default export hack (see index.js).
  it('provides the default export when using node require to import', function () {
    let result = sass.renderSync({
      file: './test/fixtures/strings/style.scss',
      importer: requiredImporter(),
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  // TODO: Added to verify named exports + CommonJS default export hack (see index.js).
  it('provides named exports of internal methods', function () {
    expect(isValidFile('import.json')).to.be.true;
  });
});

describe('Import type test (JSON)', function () {
  it('imports strings', function () {
    let result = sass.renderSync({
      file: './test/fixtures/strings/style.scss',
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it('imports lists', function () {
    let result = sass.renderSync({
      file: './test/fixtures/lists/style.scss',
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql(
      'body {\n  color: #c33;\n  font: 700 1rem Helvetica, Arial, sans-serif; }\n',
    );
  });

  it('imports maps', function () {
    let result = sass.renderSync({
      file: './test/fixtures/maps/style.scss',
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql(
      'body {\n  color: #c33;\n  font: 700 1rem Helvetica, Arial, sans-serif; }\n',
    );
  });

  it('imports map from json with array as top level', function () {
    let result = sass.renderSync({
      file: './test/fixtures/array/style.scss',
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it('finds imports via includePaths', function () {
    let result = sass.renderSync({
      file: './test/fixtures/include-paths/style.scss',
      includePaths: ['./test/fixtures/include-paths/variables'],
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it('finds imports via multiple includePaths', function () {
    let result = sass.renderSync({
      file: './test/fixtures/include-paths/style.scss',
      includePaths: [
        './test/fixtures/include-paths/variables',
        './some/other/path/',
      ],
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it(`throws when an import doesn't exist`, function () {
    function render() {
      sass.renderSync({
        file: './test/fixtures/include-paths/style.scss',
        includePaths: ['./test/fixtures/include-paths/foo'],
        importer: tokenImporter(),
      });
    }

    expect(render).to.throw(
      'Unable to find "variables.json" from the following path(s): ' +
        `${resolve(
          process.cwd(),
          'test/fixtures/include-paths',
        )}, ${process.cwd()}, ./test/fixtures/include-paths/foo. ` +
        'Check includePaths.',
    );
  });

  it('allows for a custom resolver', function () {
    let result = sass.renderSync({
      file: './test/fixtures/include-paths/style.scss',
      importer: tokenImporter({
        resolver: function (dir, url) {
          return resolve(dir, 'variables', url);
        },
      }),
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it('ignores non-json imports', function () {
    let result = sass.renderSync({
      file: './test/fixtures/non-json/style.scss',
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it('imports empty strings correctly', function () {
    let result = sass.renderSync({
      file: './test/fixtures/empty-string/style.scss',
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql('body {\n  color: ""; }\n');
  });

  it('ignores variables starting with @, : or $', function () {
    let result = sass.renderSync({
      file: './test/fixtures/invalid-variables/style.scss',
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql('body {\n  color: ""; }\n');
  });

  it('filters out `#` as variable value', function () {
    let result = sass.renderSync({
      file: './test/fixtures-json5/invalid-variables/style.scss',
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql('body {\n  color: ""; }\n');
  });

  it('allows case conversion', function () {
    let result = sass.renderSync({
      file: './test/fixtures/convert-case/style.scss',
      importer: tokenImporter({
        convertCase: true,
      }),
    });

    expect(result.css.toString()).to.eql(
      'body {\n  color: #f00;\n  color: #0f0;\n  color: #00f;\n  color: #333; }\n',
    );
  });

  it('supports es6 imports', function () {
    let result = sass.renderSync({
      file: './test/fixtures/es6/style.scss',
      importer: tokenImporter({
        convertCase: true,
      }),
    });

    expect(result.css.toString()).to.eql(
      'body {\n  content: "(color-blue: #00f, color-green: #0f0, color-red: #f00)";\n  color: #f00;\n  color: #0f0;\n  color: #00f; }\n',
    );
  });

  it('supports typescript files', function () {
    let result = sass.renderSync({
      file: './test/fixtures/typescript/style.scss',
      importer: tokenImporter({
        convertCase: true,
      }),
    });

    expect(result.css.toString()).to.eql(
      'body {\n  content: "(color-blue: #00f, color-green: #0f0, color-red: #f00)";\n  color: #f00;\n  color: #0f0;\n  color: #00f; }\n',
    );
  });
});

describe('Import type test (JSON5)', function () {
  it('imports strings', function () {
    let result = sass.renderSync({
      file: './test/fixtures-json5/strings/style.scss',
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it('imports lists', function () {
    let result = sass.renderSync({
      file: './test/fixtures-json5/lists/style.scss',
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql(
      'body {\n  color: #c33;\n  font: 700 1rem Helvetica, Arial, sans-serif; }\n',
    );
  });

  it('imports maps', function () {
    let result = sass.renderSync({
      file: './test/fixtures-json5/maps/style.scss',
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql(
      'body {\n  color: #c33;\n  font: 700 1rem Helvetica, Arial, sans-serif; }\n',
    );
  });

  it('imports map from json with array as top level', function () {
    let result = sass.renderSync({
      file: './test/fixtures-json5/array/style.scss',
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it('finds imports via includePaths', function () {
    let result = sass.renderSync({
      file: './test/fixtures-json5/include-paths/style.scss',
      includePaths: ['./test/fixtures-json5/include-paths/variables'],
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it('finds imports via multiple includePaths', function () {
    let result = sass.renderSync({
      file: './test/fixtures-json5/include-paths/style.scss',
      includePaths: [
        './test/fixtures-json5/include-paths/variables',
        './some/other/path/',
      ],
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it(`throws when an import doesn't exist`, function () {
    function render() {
      sass.renderSync({
        file: './test/fixtures-json5/include-paths/style.scss',
        includePaths: ['./test/fixtures-json5/include-paths/foo'],
        importer: tokenImporter(),
      });
    }

    expect(render).to.throw(
      'Unable to find "variables.json5" from the following path(s): ' +
        `${resolve(
          process.cwd(),
          'test/fixtures-json5/include-paths',
        )}, ${process.cwd()}, ./test/fixtures-json5/include-paths/foo. ` +
        'Check includePaths.',
    );
  });

  it('allows for a custom resolver', function () {
    let result = sass.renderSync({
      file: './test/fixtures-json5/include-paths/style.scss',
      importer: tokenImporter({
        resolver: function (dir, url) {
          return resolve(dir, 'variables', url);
        },
      }),
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it('ignores non-json imports', function () {
    let result = sass.renderSync({
      file: './test/fixtures-json5/non-json/style.scss',
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it('imports empty strings correctly', function () {
    let result = sass.renderSync({
      file: './test/fixtures-json5/empty-string/style.scss',
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql('body {\n  color: ""; }\n');
  });

  it('ignores variables starting with @, : or $', function () {
    let result = sass.renderSync({
      file: './test/fixtures-json5/invalid-variables/style.scss',
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql('body {\n  color: ""; }\n');
  });

  it('filters out `#` as variable value', function () {
    let result = sass.renderSync({
      file: './test/fixtures-json5/invalid-variables/style.scss',
      importer: tokenImporter(),
    });

    expect(result.css.toString()).to.eql('body {\n  color: ""; }\n');
  });

  it('allows case conversion', function () {
    let result = sass.renderSync({
      file: './test/fixtures-json5/convert-case/style.scss',
      importer: tokenImporter({
        convertCase: true,
      }),
    });

    expect(result.css.toString()).to.eql(
      'body {\n  color: #c33;\n  color: #3c3;\n  color: #33c; }\n',
    );
  });
});

describe('parseValue', function () {
  it('returns comma-separated items wrapped in parentheses for an array', function () {
    expect(parseValue(['some', 'entries'])).to.eql('(some,entries)');
  });

  it('calls comma-separated key value pairs wrapped in parentheses for an object', function () {
    expect(parseValue({ key1: 'value1', key2: 'value2' })).to.eql(
      '(key1: value1,key2: value2)',
    );
  });

  it('returns an empty string in an empty for empty strings', function () {
    expect(parseValue('')).to.eql('""');
  });

  it('returns the raw value if not an array, object or empty string', function () {
    expect(parseValue(123)).to.eql(123);
  });

  it('can parse nested maps with invalid keys', function () {
    const nestedWithInvalid = {
      inner: {
        ':problem1': 'value1',
        $problem2: 'value2',
        '@problem3': 'value3',
        valid: 'value4',
      },
    };
    expect(parseValue(nestedWithInvalid)).to.eql('(inner: (valid: value4))');
  });
});

describe('isValidFile', function () {
  it('returns true if the given URL is a JSON file', function () {
    expect(isValidFile('/test/variables.json')).to.be.true;
  });

  it('returns true if the given URL is a JSON5 file', function () {
    expect(isValidFile('/test/variables.json5')).to.be.true;
  });

  it('returns true if the given URL is a JS file', function () {
    expect(isValidFile('/test/composed-variables.js')).to.be.true;
  });

  it('returns true if the given URL is a TS file', function () {
    expect(isValidFile('/test/composed-variables.ts')).to.be.true;
  });

  it('returns false if the given URL is not a JSON or JSON5 file', function () {
    expect(isValidFile('/test/variables.not-json-or-json5')).to.be.false;
  });
});

describe('isValidKey', function () {
  it('returns false if the given key starts with @', function () {
    expect(isValidKey('@invalid')).to.be.false;
  });

  it('returns false if the given key starts with :', function () {
    expect(isValidKey(':invalid')).to.be.false;
  });

  it('returns false if the given key starts with $', function () {
    expect(isValidKey('$invalid')).to.be.false;
  });

  it('returns true if the given key does not start with @, : or $', function () {
    expect(isValidKey('valid')).to.be.true;
  });
});

describe('toFileName', function () {
  it('can handle extensions with two characters', function () {
    expect(toFileName('../srcDir/namespace.js')).to.eql('namespace');
  });

  it('can handle extensions with three characters', function () {
    expect(toFileName('../a-long-directory-name/subSDir/namespace.tsx')).to.eql(
      'namespace',
    );
  });

  it('can handle extensions with four characters', function () {
    expect(toFileName('tokens.json')).to.eql('tokens');
  });

  it('can handle extensions with five characters (and/or digits)', function () {
    expect(toFileName('designSystemVars.json5')).to.eql('design-system-vars');
  });

  it('can handle filename with spaces', function () {
    expect(toFileName('../dir/ file name.ts')).to.eql('file-name');
  });
});

describe('toKebabCase', function () {
  it('can handle camelCase', function () {
    expect(toKebabCase('camelCase')).to.eql('camel-case');
  });

  it('can handle PascalCase', function () {
    expect(toKebabCase('PascalCase')).to.eql('pascal-case');
  });

  it('can handle ALLCAPSCase', function () {
    expect(toKebabCase('ALLCAPSCase')).to.eql('allcaps-case');
  });

  it('can even handle EDGECaseWELLCase', function () {
    expect(toKebabCase('EDGECaseWELLCase')).to.eql('edge-case-well-case');
  });
});
