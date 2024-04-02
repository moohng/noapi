/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-19 11:45:05
 * @LastEditTime: 2024-04-02 14:40:56
 * @LastEditors: mohong@zmn.cn
 * @Description: 生成类型定义文件
 */
import fs from 'fs';
import path from 'path';
import { formatObjName, parseToTsType } from '../utils.js';

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

const GENERIC_TYPE_NAMES = ['T', 'K', 'U', 'V'];

/**
 * 生成类型定义文件
 * @param definitionKey
 * @param definitionObj
 * @param options
 * @returns
 */
export function generateDefinitionFile(
  definitionKey: string,
  definitionCollections: SWDefinitionCollections,
  options: GenerateDefinitionOptions
): GenerateDefinitionResult | undefined {
  // 对象名称
  let objName = formatObjName(definitionKey);
  // 去掉泛型（尖括号里面的类型）
  const idx = objName.indexOf('<');
  if (idx > -1) {
    objName = objName.substring(0, idx);
  }

  const { required, properties, description: objDesc } = definitionCollections[definitionKey];
  const { outDir, include, exclude, match } = options;

  const filePath = path.join(outDir, `${objName}.ts`);

  // 过滤一些不合法类型
  if (
    !objName ||
    !properties ||
    /^[a-z]/.test(objName) ||
    exclude?.some((item) =>
      item instanceof RegExp ? item.test(definitionKey) : item === objName
    ) ||
    (include &&
      !include.some((item) =>
        item instanceof RegExp ? item.test(definitionKey) : item === objName
      )) ||
    (match && !match.test(definitionKey))
  ) {
    return;
  }

  // 拼接代码 TODO:泛型处理
  let codeStr = `export default interface ${objName} {\n`;
  if (objDesc) {
    codeStr = `/** ${objDesc} */\n${codeStr}`;
  }

  let genericIndex = -1;
  const refList: string[] = [];
  const genericTypes: string[] = [];

  // 遍历属性
  Object.keys(properties).forEach((propKey) => {
    // 定义属性
    const property = properties[propKey];

    let tsType;

    // 引用类型，递归生成
    const hasRef = property.$ref || property.items?.$ref;
    if (hasRef) {
      const subDefinitionKey = hasRef.replace('#/definitions/', '');
      if (definitionKey === subDefinitionKey) {
        tsType = parseToTsType(property).replace('models.', '');
      } else {
        const result = definitionKey !== subDefinitionKey ? generateDefinitionFile(subDefinitionKey, definitionCollections, options) : undefined;
        if (result) {
          writeToIndexFile(result);
        }
        if (!refList.includes(hasRef)) {
          refList.push(hasRef);
          tsType = GENERIC_TYPE_NAMES[++genericIndex];
          genericTypes.push(tsType);
        } else {
          tsType = GENERIC_TYPE_NAMES[genericIndex];
        }
        tsType +=  property.items?.$ref ? '[]' : '';
      }
    } else {
      tsType = parseToTsType(property);
    }

    const isRequired = required?.includes(propKey);

    let propStr = `  ${propKey}${isRequired ? '' : '?'}: ${tsType};\n`;

    // 添加注释
    const descriptionComment = property.description
      ? ` ${property.description} `
      : '';
    const minComment =
      property.minLength != null ? ` 最小长度：${property.minLength} ` : '';
    const maxComment =
      property.maxLength != null ? ` 最大长度：${property.maxLength} ` : '';
    if (descriptionComment || minComment || maxComment) {
      const comment = `  /**${descriptionComment}${minComment}${maxComment}*/`;
      propStr = `${comment}\n${propStr}`;
    }

    // 拼接属性
    codeStr += propStr;
  });

  codeStr += '}\n';

  // 是否有泛型
  if (genericTypes.length > 0) {
    codeStr = codeStr.replace(`interface ${objName}`, `interface ${objName}<${genericTypes.join(', ')}>`);
  }

  // 创建输出目录
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 生成文件
  fs.writeFileSync(filePath, codeStr);

  console.log('===== [model]', filePath);

  return { objName, fileName: objName, filePath, outDir };
}

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

export function generateQueryFile(params: ApiParameter[], definitionCollections: SWDefinitionCollections, options: GenerateDefinitionOptions): GenerateDefinitionResult | undefined {
  // 入参
  // "parameters": [
  //   {
  //     "name": "sign",
  //     "in": "path",
  //     "description": "sign",
  //     "required": true,
  //     "type": "string"
  //   }
  // ],
  // {
  //   "name": "categMatterId",
  //   "in": "query",
  //   "description": "categMatterId",
  //   "required": false,
  //   "type": "integer",
  //   "default": 0,
  //   "format": "int32"
  // },
  // "parameters": [
  //   {
  //     "in": "body",
  //     "name": "modifyDIO",
  //     "description": "modifyDIO",
  //     "required": true,
  //     "schema": {
  //       "$ref": "#/definitions/CrpCooperationModifyDIO对象"
  //     }
  //   }
  // ],
  const queryParams = params.filter((item) => item.in === 'query');
  if (queryParams.length > 0) {
    // 生成query类型
  }

  const pathParams = params.filter((item) => item.in === 'path');
  if (pathParams.length > 0) {
    // 生成path类型
  }

  const bodyParams = params.filter((item) => item.in === 'body');
  if (bodyParams.length > 0) {
    // 生成body类型
    const definitionKey = bodyParams[0].schema?.$ref?.replace('#/definitions/', '');
    return definitionKey ? generateDefinitionFile(definitionKey, definitionCollections, options) : undefined;
  }
}

export function writeToIndexFile(result: GenerateDefinitionResult) {
  /**
   * 文件模板
   * import { RepairWorkDetailVO } from './RepairWorkDetailVO';
   *
   * declare global {
   *   namespace defs {
   *     export {
   *       RepairWorkDetailVO,
   *     };
   *   }
   * }
   */
  const { objName, outDir } = result;

  const defFilePath = path.join(outDir, 'index.ts');
  // const importMark = '/* --- import --- */';
  // const exportMark = '/* --- export --- */';

  // 新建
  if (!fs.existsSync(defFilePath)) {
    // fs.writeFileSync(
    //   defFilePath,
    //   `import { ${objName} } from './${objName}';\n${importMark}\n` +
    //     '\ndeclare global {\n  namespace defs {\n    export {\n' +
    //     `      ${objName},\n` +
    //     `      ${exportMark}\n` +
    //     '    };\n  }\n}'
    // );
    fs.writeFileSync(defFilePath, `export { default as ${objName} } from './${objName}';\n`);

    return defFilePath;
  }

  // 追加
  let defFileContent = fs.readFileSync(defFilePath, 'utf-8');
  
  // 判断是否已经导入
  if (defFileContent.indexOf(objName) === -1) {
    // defFileContent = defFileContent
    //   .replace(
    //     importMark,
    //     `import { ${objName} } from './${objName}';\n${importMark}`
    //   )
    //   .replace(exportMark, `${objName},\n      ${exportMark}`);
  
    // // 写入文件
    // fs.writeFileSync(defFilePath, defFileContent);

    fs.appendFileSync(defFilePath, `export { default as ${objName} } from './${objName}';\n`);
  }

  return defFilePath;
}

/**
 * 批量生成定义文件
 * @param {SWDefinitionCollections} definitions
 * @param {GenerateDefinitionOptions} options
 */
export function generateBatch(
  definitions: SWDefinitionCollections,
  options: GenerateDefinitionOptions
) {
  console.time('生成类型定义文件耗时');

  const definitionKeys = Object.keys(definitions);
  let definitionTotal = 0;
  definitionKeys.forEach((objKey) => {
    const result = generateDefinitionFile(objKey, definitions, options);

    if (result) {
      // 统计数量
      definitionTotal++;

      // 写入到defs.d.ts文件
      writeToIndexFile(result);
    }
  });

  console.log(`===== 类型定义文件生成完毕，共：${definitionTotal} 个`);
  console.timeEnd('生成类型定义文件耗时');
}
