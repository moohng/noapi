/*
* @Author: mohong@zmn.cn
 * @Date: 2024-04-16 14:25:42
 * @LastEditTime: 2024-06-26 14:23:45
 * @LastEditors: mohong@zmn.cn
 * @Description: 入口
*/
import { NoApiConfig } from './types';

export { createNoApi } from './noapi';
export * from './utils/tools';

/**
 * 定义配置
 * @param config
 * @returns
 */
export function definedNoApiConfig(config: NoApiConfig) {
  return config;
}