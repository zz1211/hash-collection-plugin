const fsExtra = require('fs-extra');
const path = require('path');
const pluginName = 'hash-collection-plugin';
const cwd = process.cwd();
const defaultProcessor = hashMap => JSON.stringify(hashMap, null, 2);

function HashCollectionPlugin(options = {}) {
  this.options = options;
}

function collectHashMap(hashMap, asset, separator, pathRelative, reg, prefix = '') {
  if (reg.test(asset)) {
    hashMap[`${prefix}${asset.split(separator)[0]}`] = `${pathRelative}/${asset}`;
  }
}

/**
 * Hash collection plugin.
 * @param {Object} options plugin options.
 * @param {String} [outputPath=''./server/config''] output path of generated version file.
 * @param {String} [options.separator='_'] separator to split key from hashed resource name.
 * @param {Boolean} [options.isMerge=false] flag that mark whether js hash and css hash should be merged together.
 * @param {String} [options.filename='version'] filename of exported version file with prefix css_ and js_.
 * @param {String} [options.extension='json'] extension of exported version file.
 * @param {Function} [options.processor=json-like processor] processor function used to process exported file before it is written to destination folder.
 * @param {String} [options.prefix=''] prefix of each key of hash chunk.
 */
HashCollectionPlugin.prototype.apply = function (compiler) {
  const {
    separator = '_',
    outputPath = './server/config',
    isMerge = false,
    filename = 'version',
    extension = 'json',
    processor = defaultProcessor,
    prefix
  } = this.options;
  compiler
    .hooks
    .emit
    .tap(pluginName, compilation => {
      const {assets, outputOptions} = compilation;
      const pathRelative = path.relative(cwd, outputOptions.path);
      const cssHashMap = {};
      const jsHashMap = {};
      const jsReg = /^js\//;
      const cssReg = /^css\//;
      Object
        .keys(assets)
        .map(asset => {
          collectHashMap(cssHashMap, asset, separator, pathRelative, cssReg, prefix);
          collectHashMap(jsHashMap, asset, separator, pathRelative, jsReg, prefix);
        });
      if (isMerge) {
        const hashMap = {
          ...cssHashMap,
          ...jsHashMap
        };
        fsExtra.outputFileSync(path.resolve(cwd, outputPath, `${filename}.${extension}`), processor(hashMap));
      } else {
        fsExtra.outputFileSync(path.resolve(cwd, outputPath, `css_${filename}.${extension}`), processor(cssHashMap));
        fsExtra.outputFileSync(path.resolve(cwd, outputPath, `js_${filename}.${extension}`), processor(jsHashMap));
      }
      console.info('===> Version file is generated ~');
    });
};

module.exports = HashCollectionPlugin;
