import path from 'path';
import bffDocs from './bffDocs.json';
import bfmDocs from './bfmDocs.json';
import { generateBatch as apiBatch } from '../src/core/api';

test('生成接口文件', () => {
  apiBatch(bfmDocs.paths, bfmDocs.definitions, {
    outDir: path.resolve('testOutput/bfm/api'),
  });

  apiBatch(bffDocs.paths, bfmDocs.definitions, {
    outDir: path.resolve('testOutput/bff/api'),
  });
});
