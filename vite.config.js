/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-06-24 11:50:05
 * @LastEditTime: 2024-06-24 13:47:58
 * @LastEditors: mohong@zmn.cn
 * @Description:
 */
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node16',
    lib: {
      entry: {
        noapi: './src/index.ts',
      },
      formats: ['es', 'cjs'],
    },
  },
});
