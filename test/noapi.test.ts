/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 18:18:35
 * @LastEditTime: 2024-03-21 10:12:16
 * @LastEditors: mohong@zmn.cn
 * @Description: 类方法测试
 */
import path from 'path';
import bfmDocs from './bfmDocs.json';
import { createNoApi } from '../src/noapi';

test('noapi', () => {
  const noapi = createNoApi({
    swJson: bfmDocs,
    outDir: path.resolve('src/api'),
    // definition: {
    //   outDir: path.resolve(__dirname, 'bfm/definitions'),
    //   exclude: ['VO', /PageBody/, /SelectOptionQuery对象/],
    // },
  });

  noapi.auto();
});
