/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-19 15:07:17
 * @LastEditTime: 2024-03-22 17:18:32
 * @LastEditors: mohong@zmn.cn
 * @Description: 单元测试
 */
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
