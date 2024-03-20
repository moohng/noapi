/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-19 11:45:05
 * @LastEditTime: 2024-03-19 15:56:01
 * @LastEditors: mohong@zmn.cn
 * @Description: 生成类型定义文件
 */
import fs from 'fs';
import path from 'path';

interface ObjProperty {
  type: 'string' | 'integer' | 'boolean' | 'object' | 'array';
  items?: ObjProperty,
}

/**
 * 解析属性类型
 * @param {ObjProperty} property
 * @returns
 */
function parseToTsType(property: ObjProperty): string {
  if (property.type === 'array') {
    const subType = property.items ? parseToTsType(property.items) : 'any';
    return `${subType}[]`;
  }
  const map = {
    string: 'string',
    integer: 'number',
    boolean: 'boolean',
    object: 'object',
  };
  return map[property.type] || 'any';
}

interface ObjDefinition {
  [key: string]: {
    required?: string[];
    properties?: Record<string, any>;
    description?: string;
    [key: string]: unknown;
  }
}

interface GenerateOptions {
  outDir: string,
  include?: (string | RegExp)[],
  exclude?: (string | RegExp)[],
  match?: RegExp,
}

/**
 * 生成定义文件
 * @param {ObjDefinition} definitions
 * @param {} options
 */
function generate(definitions: ObjDefinition, options: GenerateOptions) {
  console.time('生成类型定义文件耗时');
  // 创建输出目录
  const { outDir, include, exclude, match } = options;
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const definitionKeys = Object.keys(definitions);
  const definitionLength = definitionKeys.length;
  let definitionTotal = 0;
  definitionKeys.forEach((objKey, objIndex) => {
    const splits = objKey.split('.');
    const objName = splits[splits.length - 1].replace(/\W/g, '');

    const { required, properties, description: objDesc } = definitions[objKey];

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

    let templateStr = `export interface ${objName} {\n`;
    if (objDesc) {
      templateStr = `/** ${objDesc} */\n${templateStr}`;
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
      templateStr += propStr;
    });

    templateStr += '}\n';

    // 生成文件
    const filePath = path.join(outDir, `${objName}.ts`);
    fs.writeFileSync(filePath, templateStr);

    console.log(`----- ${filePath} ----- ${Math.floor(((objIndex + 1) * 10000) / definitionLength) / 100}%`);

    definitionTotal++;
  });

  console.log(`----- 类型定义文件生成完毕，共：${definitionTotal} 个 -----`);
  console.timeEnd('生成类型定义文件耗时');
}

export default generate;
