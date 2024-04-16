/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-19 11:45:05
 * @LastEditTime: 2024-04-16 14:10:15
 * @LastEditors: mohong@zmn.cn
 * @Description: 生成类型定义文件
 */
import fs from 'fs';
import path from 'path';

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
  objName: string;
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
 * @param objName 
 * @param outDir 
 * @returns 
 */
export function writeToIndexFile(objName: string, outDir: string) {

  const defFilePath = path.join(outDir, 'index.ts');

  // 新建
  if (!fs.existsSync(defFilePath)) {
    fs.writeFileSync(defFilePath, `export { default as ${objName} } from './${objName}';\n`);

    return defFilePath;
  }

  let defFileContent = fs.readFileSync(defFilePath, 'utf-8');
  // 判断是否已经导入
  if (defFileContent.indexOf(objName) === -1) {
    // 追加
    fs.appendFileSync(defFilePath, `export { default as ${objName} } from './${objName}';\n`);
  }

  return defFilePath;
}
