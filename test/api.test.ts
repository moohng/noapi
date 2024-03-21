/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-19 15:07:17
 * @LastEditTime: 2024-03-21 16:35:41
 * @LastEditors: mohong@zmn.cn
 * @Description: 单元测试
 */
import path from 'path';
import bffDocs from './bffDocs.json';
import bfmDocs from './bfmDocs.json';
import { generateBatch as apiBatch } from '../src/core/api';

test('生成接口文件', () => {
  apiBatch(bfmDocs.paths, bfmDocs.definitions, {
    outDir: path.resolve(__dirname, 'bfm/api'),
  });

  apiBatch(bffDocs.paths, bfmDocs.definitions, {
    outDir: path.resolve(__dirname, 'bff/api'),
  });
});
