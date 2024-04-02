const path = require('path');
const { definedNoApiConfig } = require('./lib/noapi');

module.exports = definedNoApiConfig({
  swUrl: 'https://test-admin.xiujiadian.com/bfm-crp/v2/api-docs?group=web',
  outDir: path.resolve('./testOutput/api'),
  cookie: 'Hm_lvt_b97569d26a525941d8d163729d284198=1711422891,1711941225; Hm_lvt_e8002ef3d9e0d8274b5b74cc4a027d08=1711422892,1711941225; test.zmn.id=af9382ab-e7bd-41a8-a452-271ea350e7a2; Hm_lpvt_b97569d26a525941d8d163729d284198=1712044538; Hm_lpvt_e8002ef3d9e0d8274b5b74cc4a027d08=1712044538; zmn_user=e468e4f1e8147bed55536a36a04ab5598e1b68d28fa5738d91c73c5e02cd33f865535587323155e50a2aa1fe55d17100',
  definition: {
    outDir: path.resolve('./testOutput/model'),
    // exclude: ['VO', /AMISResponseDTO/, /PageBody/, /SelectOptionQuery对象/],
  },
});
