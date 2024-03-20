import path from 'path';
import apiDocs from './apiDocs.json';
import bfmDocs from './bfmDocs.json';
import { generateBatch as defBatch } from './generateDefinition';
import { generateBatch as apiBatch } from './generateApi';

// export {
//   generateDefinitions,
//   generateApi,
// }

defBatch(bfmDocs.definitions, {
  outDir: path.resolve('definitions'),
  exclude: ['VO', /PageBody/, /SelectOptionQuery对象/],
});

// @ts-ignore
apiBatch(bfmDocs.paths, {
  outDir: path.resolve('api'),
});
