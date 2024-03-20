/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-19 15:07:17
 * @LastEditTime: 2024-03-20 18:17:44
 * @LastEditors: mohong@zmn.cn
 * @Description: 单元测试
 */
import path from 'path';
import bffDocs from './bffDocs.json';
import bfmDocs from './bfmDocs.json';
import { generateBatch as apiBatch } from '../src/api';

test('生成接口文件', () => {
  // @ts-ignore
  apiBatch(bfmDocs.paths, {
    outDir: path.resolve(__dirname, 'bfm/api'),
  });

  // @ts-ignore
  apiBatch(bffDocs.paths, {
    outDir: path.resolve(__dirname, 'bff/api'),
  });
});
