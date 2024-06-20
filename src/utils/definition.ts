/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-19 11:45:05
 * @LastEditTime: 2024-06-20 17:32:41
 * @LastEditors: mohong@zmn.cn
 * @Description: 生成类型定义文件
 */
import fs from 'fs/promises';
import path from 'path';
import { checkExists } from '..';

export interface SWDefinitionObj {
  required?: string[];
  properties?: Record<string, any>;
  description?: string;
  [key: string]: unknown;
}

export interface SWDefinitionCollections {
  [key: string]: SWDefinitionObj;
}

export interface GenerateDefinitionOptions {
  outDir: string;
  include?: (string | RegExp)[];
  exclude?: (string | RegExp)[];
  match?: RegExp;
}

export interface GenerateDefinitionResult {
  sourceCode: string;
  typeName: string;
  fileName: string;
  filePath: string;
  outDir: string;
}

export const GENERIC_TYPE_NAMES = ['T', 'K', 'U', 'V'];

export interface ApiParameter {
  /** 'body' | 'query' | 'path' */
  in: string;
  name: string;
  type?: string;
  default?: any;
  description?: string;
  required?: boolean;
  schema?: {
    [key: string]: any;
    '$ref'?: string;
  };
}

/**
 * 写入到index.ts
 * @param typeName 
 * @param outDir 
 * @returns 
 */
export async function writeToIndexFile(typeName: string, outDir: string) {

  const defFilePath = path.join(outDir, 'index.ts');

  // 新建
  if (!await checkExists(defFilePath)) {
    await fs.writeFile(defFilePath, `export { default as ${typeName} } from './${typeName}';\n`);

    return defFilePath;
  }

  let defFileContent = await fs.readFile(defFilePath, 'utf-8');
  // 判断是否已经导入
  if (defFileContent.indexOf(typeName) === -1) {
    // 追加
    await fs.appendFile(defFilePath, `export { default as ${typeName} } from './${typeName}';\n`);
  }

  return defFilePath;
}
