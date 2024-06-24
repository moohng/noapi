/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 09:45:06
 * @LastEditTime: 2024-06-24 16:43:15
 * @LastEditors: mohong@zmn.cn
 * @Description: 工具函数
 */
import path from 'path';
import fs from 'fs/promises';
// import * as prettier from 'prettier';
// import standard from 'standard';
import { NoApiConfig } from '..';
import { TypeFieldOption } from './transform';

/**
 * 去掉后端对象名中的非法字符
 * 比如：com.zmn.common.dto2.ResponseDTO«List«ActivityListVO对象»»     ======>     List<ActivityListVO>
 * com.zmn.common.dto2.ResponseDTO«com.zmn.bff.crp.matter.common.dro.aftersales.order.SubmitAftersaleDRO»    ======>      SubmitAftersaleDRO
 * @param objName
 * @param keepOuter
 */
export function formatObjName(objName: string, keepOuter = false) {
  // 去掉包名 com.zmn.common.dto2.  、非法字符
  let name = objName.replace(/\w+(\.|\/)/g, '').replace(/«/g, '<').replace(/»/g, '>').replace(/[^0-9a-zA-Z<>]+/g, '');
  // 是否保留最外层对象
  if (!keepOuter) {
    name = name.match(/<(.+)>/)?.[1] || name;
  }
  return name;
}

export interface SWDefinitionProperty {
  type?: 'string' | 'integer' | 'boolean' | 'object' | 'array';
  items?: SWDefinitionProperty,
  description?: string;
  $ref?: string;
}

/**
 * 解析属性类型
 * @param {SWDefinitionProperty} property
 * @returns
 */
export function parseToTsType(property?: string | SWDefinitionProperty): string {
  if (typeof property !== 'string') {
    // 数组类型
    if (property?.type === 'array') {
      const subType = property.items ? parseToTsType(property.items) : 'any';
      return `${subType}[]`;
    }

    // 对象引用
    if (property?.$ref) {
      const name = formatObjName(property.$ref);
      return `models.${name}`;
    }

    property = property?.type;
  }

  const map = {
    string: 'string',
    integer: 'number',
    boolean: 'boolean',
    object: 'object',
  };

  return map[property as keyof typeof map] || 'any';
}

/**
 * 首字母大写
 * @param str
 */
export function upperFirstLatter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 是否是基本类型
 * @param type
 */
export function isBaseType(type: string) {
  return ['string', 'number', 'boolean', 'object', 'any', 'unknown'].includes(type);
}

/**
 * 对类型添加命名空间前缀，比如：AMISList<WorkItem> ===> models.AMISList<models.WorkItem>
 * @param type 
 */
export function defPrefix(type: string) {
  return isBaseType(type) ? type : type.replace(/\w+/g, (match) => {
    return isBaseType(match) ? match : `models.${match}`;
  });
}

/**
 * 加载配置项
 * @returns 
 */
export function loadConfig(configRootPath = process.cwd(), loader = (filePath: string) => require(filePath)): NoApiConfig | undefined {
  const configFilePath = path.join(configRootPath, 'noapi.config.js');
  let config: NoApiConfig;
  try {
    config = loader(configFilePath);
  } catch (error) {
    console.error('Error:', error);
    return undefined;
  }
  return config;
}

/**
 * 合并配置项
 * @param options 
 * @returns 
 */
export function mergeConfig(options: any) {
  // 过滤掉空值
  options = Object.fromEntries(Object.entries(options).filter((item) => item[1] !== undefined));
  const config = {
    ...(loadConfig() || {}),
    ...options,
  };

  return config;
}

/**
 * 报错并退出
 * @param message
 */
export function exitWithError(...messages: string[]) {
  console.error('Error:', ...messages);
  process.exit(1);
}

/**
 * 创建配置文件
 * @param url 接口文档地址
 * @param rootDir 项目根目录
 * @returns
 */
export async function createConfig(url?: string, rootDir = process.cwd()) {
  const configFilePath = path.resolve(rootDir, 'noapi.config.js');

  if (await checkExists(configFilePath)) {
    exitWithError('配置文件已存在！');
  }

  const fileHeader = `const { definedNoApiConfig } = require('@zmn/noapi');\n`;

  const defaultConfig = `{
    swUrl: '${url || 'https://test-api-crp-matter.xiujiadian.com/v2/api-docs?group=web'}',
    outDir: './src/api',
    definition: {
      outDir: './src/model',
    },
  }`;

  const configInput = await codeFormat(`${fileHeader}\nmodule.exports = definedNoApiConfig(${defaultConfig});\n`);

  await writeToFile(configFilePath, configInput);

  return configFilePath;
}

/**
 * 格式化代码
 * @param code 
 * @returns 
 */
export async function codeFormat(code: string) {
  // const formatted = await standard.format(code, {
  //   parser: 'babel-ts',
  //   singleQuote: true,
  //   trailingComma: 'es5',
  //   printWidth: 150,
  //   endOfLine: 'auto',
  // });
  // return formatted;
  return code;
}

/**
 * 写入文件
 * @param filePath 
 * @param content 
 */
export async function writeToFile(filePath: string, content: string) {
  // 创建输出文件
  const exists = await checkExists(filePath);
  if (!exists) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
  }

  // 生成文件
  return fs.writeFile(filePath, content, 'utf8');
}

/**
 * 追加内容到文件
 * @param filePath 
 * @param content 
 * @returns 
 */
export async function appendToFile(filePath: string, content: string) {
  // 创建输出文件
  const exists = await checkExists(filePath);
  if (!exists) {
    return writeToFile(filePath, content);
  }

  // 追加内容
  return fs.appendFile(filePath, content, 'utf8');
}

/**
 * 检查文件或目录是否存在
 * @param path 
 * @returns 
 */
export async function checkExists(path: string): Promise<boolean> {
  try {
    await fs.stat(path);
    return true; // 文件或目录存在
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false; // 文件或目录不存在
    }
    throw error; // 如果是其他错误，抛出该错误
  }
}

/**
 * 解析路径参数
 * @param url 
 * @returns 
 */
export function parsePathParams(url: string): TypeFieldOption[] {
  const params = url.match(/\/\{([a-zA-Z0-9]+)\}/g);
  if (params) {
    return params.map((item) => ({ name: item.replace(/\/|\{|\}/g, ''), required: true, type: 'string' }));
  }
  return [];
}

/**
 * 首字母大写
 * @param str 
 * @returns 
 */
export function upperFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
