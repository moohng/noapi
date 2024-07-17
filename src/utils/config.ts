import path from 'path';
import { NoApiLocalConfig } from '../types';
import { writeToFile } from './write';

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
 * 语法提示请安装 @noapi/core 依赖包
 * @type {import('@noapi/core/lib/types').NoApiLocalConfig}
 */
`;

  const defaultConfig = `{
  swagUrl: '${url}',
  // cookie: '如果需要登录，请设置cookie',
  swagFile: './src/api/noapi-swagger-doc.json',
  apiBase: './src/api',
  defBase: './src/model',
  // fileHeader: 'import request from \\'@/utils/request\\';', // 自定义api文件头部代码，新建文件时会自动添加到文件顶部
  // customApi: (apiContext) => {
  //   // 自定义 api 函数
  //   // interface ApiContext { api: SWApiDefinition, sourceCode?: string; name: string; url: string; method: string; inType?: string; outType?: string; comment?: string; pathParams?: TypeFieldOption[]; }

  //   // do something...

  //   // 返回一个字符串代码或一个新的 apiContext
  //   // 注意：代码格式需要自己调整，该插件不会做任何转换
  //   return \`custom api code...\`;
  // },
  // ignoreTypes: ['string', /Response/], // 忽略类型，不生成对应的类型定义
  // matchTypes: ['string', /^xxx/], // 匹配类型，只生成对应的类型定义
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
    throw new Error(`配置文件加载失败：${error}`);
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
