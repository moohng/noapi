import path from 'path';
import { NoApiLocalConfig } from '@/types';
import { writeToFile } from './write';
import { exitWithError } from './tools';

export const CONFIG_FILE_NAME = 'noapi.config.js';

/**
 * 定义配置
 * @param config
 * @returns
 */
export function definedNoApiConfig(config: NoApiLocalConfig) {
  return config;
}

/**
 * 获取配置文件路径
 * @param basePath 
 * @returns 
 */
export function getConfigPath(basePath = process.cwd()) {
  return path.join(basePath, CONFIG_FILE_NAME);
}

/**
 * 创建配置文件
 * @param url 接口文档地址
 * @returns
 */
export async function createConfigFile(url: string, configFilePath = getConfigPath()) {
  const fileHeader = `const { definedNoApiConfig } = require('@zmn/noapi');\n`;

  const defaultConfig = `{
  swUrl: '${url || 'https://test-api-crp-matter.xiujiadian.com/v2/api-docs?group=web'}',
  apiBase: './src/api',
  defBase: './src/model',
}`;

  const configInput = `${fileHeader}\nmodule.exports = definedNoApiConfig(${defaultConfig});\n`;

  await writeToFile(configFilePath, configInput);

  return configFilePath;
}

/**
 * 加载配置项
 * @returns 
 */
export function loadConfig(configRootPath = process.cwd(), loader = (filePath: string) => require(filePath)) {
  const configFilePath = path.join(configRootPath, CONFIG_FILE_NAME);
  try {
    return loader(configFilePath) as NoApiLocalConfig;
  } catch (error) {
    exitWithError(`配置文件加载失败：${error}`);
    return;
  }
}

/**
 * 合并配置项
 * @param options 
 * @returns 
 */
export function mergeConfig(options: NoApiLocalConfig) {
  // 过滤掉空值
  options = Object.fromEntries(Object.entries(options).filter((item) => item[1] !== undefined));
  const config = {
    ...(loadConfig() || {}),
    ...options,
  };

  return config as NoApiLocalConfig;
}
