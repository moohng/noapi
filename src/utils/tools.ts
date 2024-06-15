/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 09:45:06
 * @LastEditTime: 2024-06-15 11:44:05
 * @LastEditors: mohong@zmn.cn
 * @Description: 工具函数
 */
import { LoaderSync, cosmiconfigSync } from 'cosmiconfig';
import path from 'path';
import fs from 'fs';
import { NoApiConfig } from '..';

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
export function parseToTsType(property: SWDefinitionProperty): string {
  // 数组类型
  if (property.type === 'array') {
    const subType = property.items ? parseToTsType(property.items) : 'any';
    return `${subType}[]`;
  }

  // 对象引用
  if (property.$ref) {
    const name = formatObjName(property.$ref);
    return `models.${name}`;
  }

  // 基本类型
  if (property.type) {
    const map = {
      string: 'string',
      integer: 'number',
      boolean: 'boolean',
      object: 'object',
    };
    return map[property.type] || 'any';
  }

  return 'any';
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
export function loadConfig(configPath?: string, loader?: LoaderSync) {
  const explorerSync = cosmiconfigSync('noapi', {
    loaders: loader && {
      '.cjs': loader,
      '.js': loader,
      noExt: loader,
    },
  });
  const searchedFor = explorerSync.search(configPath);

  return searchedFor?.config as NoApiConfig;
}

/**
 * 合并配置项
 * @param options 
 * @returns 
 */
export function mergeConfig(options: any) {
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
export function createConfig(url?: string, rootDir = process.cwd()) {
  const configFilePath = path.resolve(rootDir, 'noapi.config.js');

  if (fs.existsSync(configFilePath)) {
    exitWithError('配置文件已存在！');
  }

  const fileHeader = `const path = require('path');\nconst { definedNoApiConfig } = require('@zmn/noapi');\n`;

  const defaultConfig = `{
  swUrl: '${url || 'https://test-api-crp-matter.xiujiadian.com/v2/api-docs?group=web'}',
  outDir: path.resolve('./src/api'),
  definition: {
    outDir: path.resolve('./src/model'),
  },
}`;

  fs.writeFileSync(configFilePath, `${fileHeader}\nmodule.exports = definedNoApiConfig(${defaultConfig});\n`);

  return configFilePath;
}