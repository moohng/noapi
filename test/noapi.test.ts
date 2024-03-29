/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 18:18:35
 * @LastEditTime: 2024-03-25 16:33:10
 * @LastEditors: mohong@zmn.cn
 * @Description: 类方法测试
 */
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
    swUrl: 'https://test-admin.xiujiadian.com/bfm-crp/v2/api-docs?group=web',
    outDir: path.resolve('testOutput/api'),
    definition: {
      outDir: path.resolve('testOutput/model'),
      // exclude: ['VO', /AMISResponseDTO/, /PageBody/, /SelectOptionQuery对象/],
    },
  });

  await noapi.generateByUrls(['/bfm-crp/base/engineer/listServSkill', '/bfm-crp/base/engineer/modifySkill']);
});
