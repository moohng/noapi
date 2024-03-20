/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-19 15:07:17
 * @LastEditTime: 2024-03-20 18:05:35
 * @LastEditors: mohong@zmn.cn
 * @Description: 单元测试
 */
import path from 'path';
import apiDocs from './apiDocs.json';
import bfmDocs from './bfmDocs.json';
import { generateBatch as defBatch } from '../generateDefinition';
import { generateBatch as apiBatch } from '../generateApi';

test('生成定义文件', () => {
  defBatch(bfmDocs.definitions, {
    outDir: path.resolve(__dirname, 'definitions'),
    exclude: ['VO', /PageBody/, /SelectOptionQuery对象/],
  });
});

test('生成接口文件', () => {
  // @ts-ignore
  apiBatch(bfmDocs.paths, {
    outDir: path.resolve(__dirname, 'api'),
  });
});
