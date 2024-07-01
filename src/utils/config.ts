/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-06-26 15:14:28
 * @LastEditTime: 2024-07-01 15:02:04
 * @LastEditors: mohong@zmn.cn
 * @Description: 配置文件相关
 */
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
  const fileHeader = `/**
 * 语法提示请安装 @zmn/noapi 依赖包
 * @type {import('@zmn/noapi/lib/types').NoApiLocalConfig}
 */
`;

  const defaultConfig = `{
  swUrl: '${url || 'https://test-api-crp-matter.xiujiadian.com/v2/api-docs?group=web'}',
  swFile: './src/api/noapi-swagger-doc.json',
  apiBase: './src/api',
  defBase: './src/model',
  // customApi: (apiContext) => {
  //   // 自定义 api 函数
  //   // interface ApiContext { api: SWApiDefinition, sourceCode?: string; name: string; url: string; method: string; inType?: string; outType?: string; comment?: string; pathParams?: TypeFieldOption[]; }

  //   // do something...

  //   // 返回一个字符串代码或一个新的 apiContext
  //   // 注意：代码格式需要自己调整，该插件不会做任何转换
  //   return \`custom api code...\`;
  // },
}`;

  const configInput = `${fileHeader}module.exports = ${defaultConfig};\n`;

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
