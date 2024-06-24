/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-06-24 11:50:05
 * @LastEditTime: 2024-06-24 15:45:23
 * @LastEditors: mohong@zmn.cn
 * @Description:
 */
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        noapi: './src/index.ts',
      },
      formats: ['cjs'],
    },
  },
});
