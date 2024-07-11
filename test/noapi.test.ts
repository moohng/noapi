import path from 'path';
import bfmDocs from './bfmDocs.json';
import { createNoApi } from '../src/noapi';

// test('noapi for json', () => {
//   const noapi = createNoApi({
//     swJson: bfmDocs,
//     outDir: path.resolve('testOutput/api'),
//     definition: {
//       outDir: path.resolve('testOutput/model'),
//       // exclude: ['VO', /AMISResponseDTO/, /PageBody/, /SelectOptionQuery对象/],
//     },
//   });

//   // noapi.auto();
//   noapi.generateByUrls(['/bfm-crp/base/engineer/listServSkill', '/bfm-crp/base/engineer/modifySkill']);
// });

test('noapi for url', async () => {
  const noapi = createNoApi({
    swUrl: 'https://sw.bfm.cn/bfm-crp/api/v1/bfm-crp/swagger.json',
    outDir: path.resolve('testOutput/api'),
    definition: {
      outDir: path.resolve('testOutput/model'),
      // exclude: ['VO', /AMISResponseDTO/, /PageBody/, /SelectOptionQuery对象/],
    },
  });

  await noapi.generateByUrls(['/bfm-crp/base/engineer/listServSkill', '/bfm-crp/base/engineer/modifySkill']);
});
