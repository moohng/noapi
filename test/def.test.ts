import path from 'path';
import bffDocs from './bffDocs.json';
import bfmDocs from './bfmDocs.json';
import { generateBatch } from '../src/core/definition';

test('生成定义文件', () => {
  generateBatch(bfmDocs.definitions, {
    outDir: path.resolve('testOutput/bfm/definitions'),
    exclude: ['VO', /PageBody/, /SelectOptionQuery对象/],
  });

  generateBatch(bffDocs.definitions, {
    outDir: path.resolve('testOutput/bff/definitions'),
    exclude: ['VO', /PageBody/, /SelectOptionQuery对象/],
  });
});
