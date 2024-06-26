import path from 'path';
import { NoApiLocalConfig } from '@/types';
import { checkExists, writeToFile } from './write';
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
 * 创建配置文件
 * @param url 接口文档地址
 * @returns
 */
export async function createConfig(url: string, basePath = process.cwd()) {
  const configFilePath = path.join(basePath, CONFIG_FILE_NAME);

  if (await checkExists(configFilePath)) {
    exitWithError(`配置文件已存在，请删除后再尝试创建！`);
  }

  const fileHeader = `const { definedNoApiConfig } = require('@zmn/noapi');\n`;

  const defaultConfig = `{
  swUrl: '${url || 'https://test-api-crp-matter.xiujiadian.com/v2/api-docs?group=web'}',
  outDir: './src/api',
  definition: {
    outDir: './src/model',
  },
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
