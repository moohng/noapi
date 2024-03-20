import path from 'path';
import apiDocs from './apiDocs.json';
import bfmDocs from './bfmDocs.json';
import { generateBatch } from './generateDefinition';
// import generateApi from './generateApi';

// export {
//   generateDefinitions,
//   generateApi,
// }

generateBatch(bfmDocs.definitions, {
  outDir: path.resolve('definitions'),
  exclude: ['VO', /^AMIS/, /AMISResponseDTO/, /PageBody/, /AMISListData/, /SelectOptionQuery对象/],
});

// @ts-ignore
// generateApi(apiDocs.paths, {
//   outDir: path.resolve('api'),
// });