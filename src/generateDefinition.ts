/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-19 11:45:05
 * @LastEditTime: 2024-03-20 11:10:17
 * @LastEditors: mohong@zmn.cn
 * @Description: 生成类型定义文件
 */
import fs from 'fs';
import path from 'path';
import { formatObjName, parseToTsType } from './utils';

export interface SWDefinitionObj {
  required?: string[];
  properties?: Record<string, any>;
  description?: string;
  [key: string]: unknown;
}

export interface SWDefinitionCollections {
  [key: string]: SWDefinitionObj;
}

export interface GenerateOptions {
  outDir: string,
  include?: (string | RegExp)[],
  exclude?: (string | RegExp)[],
  match?: RegExp,
}

/**
 * 生成类型定义文件
 * @param definitionKey 
 * @param definitionObj 
 * @param options 
 * @returns 
 */
export function generateDefinitionFile(definitionKey: string, definitionObj: SWDefinitionObj,  options: GenerateOptions) {
  // 对象名称
  const objName = formatObjName(definitionKey);

  const { required, properties, description: objDesc } = definitionObj;
  const { outDir, include, exclude, match } = options;

  // 过滤一些不合法类型
  if (
    !objName ||
    !properties ||
    exclude?.some((item) => (item instanceof RegExp ? item.test(objName) : item === objName)) ||
    (include && !include.some((item) => (item instanceof RegExp ? item.test(objName) : item === objName))) ||
    (match && !match.test(objName))
  ) {
    return;
  }

  // 拼接代码
  let codeStr = `export default interface ${objName} {\n`;
  if (objDesc) {
    codeStr = `/** ${objDesc} */\n${codeStr}`;
  }

  // 遍历属性
  Object.keys(properties).forEach((propKey) => {
    // 定义属性
    const isRequired = required?.includes(propKey);
    const property = properties[propKey];
    let propStr = `  ${propKey}${isRequired ? '' : '?'}: ${parseToTsType(property)};\n`;

    // 添加注释
    const descriptionComment = property.description ? ` ${property.description} ` : '';
    const minComment = property.minLength != null ? ` 最小长度：${property.minLength} ` : '';
    const maxComment = property.maxLength != null ? ` 最大长度：${property.maxLength} ` : '';
    if (descriptionComment || minComment || maxComment) {
      const comment = `  /**${descriptionComment}${minComment}${maxComment}*/`;
      propStr = `${comment}\n${propStr}`;
    }

    // 拼接属性
    codeStr += propStr;
  });

  codeStr += '}\n';

  // 创建输出目录
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 生成文件
  const filePath = path.join(outDir, `${objName}.ts`);
  fs.writeFileSync(filePath, codeStr);

  console.log(`----- 已生成 ${filePath} -----`);

  return { objName, fileName: objName, filePath };
}

/**
 * 批量生成定义文件
 * @param {SWDefinitionCollections} definitions
 * @param {GenerateOptions} options
 */
export function generateBatch(definitions: SWDefinitionCollections, options: GenerateOptions) {
  console.time('生成类型定义文件耗时');

  const definitionKeys = Object.keys(definitions);
  let definitionTotal = 0;
  definitionKeys.forEach((objKey) => {
    const result = generateDefinitionFile(objKey, definitions[objKey], options);

    if (result) {
      // 统计数量
      definitionTotal++;

      // 写入到defs.d.ts文件
    }
  });

  console.log(`----- 类型定义文件生成完毕，共：${definitionTotal} 个 -----`);
  console.timeEnd('生成类型定义文件耗时');
}
