const path = require('path');
const { definedNoApiConfig } = require('@zmn/noapi');

module.exports = definedNoApiConfig({
  swUrl: 'https://test-api-crp-matter.xiujiadian.com/v2/api-docs?group=web',
  outDir: path.resolve('./src/api'),
  definition: {
    outDir: path.resolve('./src/model'),
  },
});
