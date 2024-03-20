/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-19 11:45:05
 * @LastEditTime: 2024-03-20 15:58:43
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

/**
 * 生成类型定义文件
 * @param definitionKey
 * @param definitionObj
 * @param options
 * @returns
 */
export function generateDefinitionFile(
  definitionKey: string,
  definitionObj: SWDefinitionObj,
  options: GenerateOptions
): GenerateDefinitionResult | undefined {
  // 对象名称
  const objName = formatObjName(definitionKey);

  const { required, properties, description: objDesc } = definitionObj;
  const { outDir, include, exclude, match } = options;

  // 过滤一些不合法类型
  if (
    !objName ||
    !properties ||
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

  // 拼接代码
  let codeStr = `export interface ${objName} {\n`;
  if (objDesc) {
    codeStr = `/** ${objDesc} */\n${codeStr}`;
  }

  // 遍历属性
  Object.keys(properties).forEach((propKey) => {
    // 定义属性
    const isRequired = required?.includes(propKey);
    const property = properties[propKey];
    let propStr = `  ${propKey}${isRequired ? '' : '?'}: ${parseToTsType(
      property
    )};\n`;

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

  // 创建输出目录
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 生成文件
  const filePath = path.join(outDir, `${objName}.ts`);
  fs.writeFileSync(filePath, codeStr);

  console.log(`----- 已生成 ${filePath} -----`);

  return { objName, fileName: objName, filePath, outDir };
}

export function writeToDefsFile(result: GenerateDefinitionResult) {
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

  const defFilePath = path.join(outDir, 'defs.d.ts');
  const importMark = '/* --- import --- */';
  const exportMark = '/* --- export --- */';

  // 新建
  if (!fs.existsSync(defFilePath)) {
    fs.writeFileSync(
      defFilePath,
      `import { ${objName} } from './${objName}';\n${importMark}\n` +
        '\ndeclare global {\n  namespace defs {\n    export {\n' +
        `      ${objName},\n` +
        `      ${exportMark}\n` +
        '    };\n  }\n}'
    );

    return defFilePath;
  }

  // 追加
  let defFileContent = fs.readFileSync(defFilePath, 'utf-8');
  
  // 判断是否已经导入
  if (defFileContent.indexOf(`import { ${objName} }`) === -1) {
    defFileContent = defFileContent
      .replace(
        importMark,
        `import { ${objName} } from './${objName}';\n${importMark}`
      )
      .replace(exportMark, `${objName},\n      ${exportMark}`);
  
    // 写入文件
    fs.writeFileSync(defFilePath, defFileContent);
  }

  return defFilePath;
}

/**
 * 批量生成定义文件
 * @param {SWDefinitionCollections} definitions
 * @param {GenerateOptions} options
 */
export function generateBatch(
  definitions: SWDefinitionCollections,
  options: GenerateOptions
) {
  console.time('生成类型定义文件耗时');

  const definitionKeys = Object.keys(definitions);
  let definitionTotal = 0;
  definitionKeys.forEach((objKey) => {
    const result = generateDefinitionFile(objKey, definitions[objKey], options);

    if (result) {
      // 统计数量
      definitionTotal++;

      // 写入到defs.d.ts文件
      writeToDefsFile(result);
    }
  });

  console.log(`----- 类型定义文件生成完毕，共：${definitionTotal} 个 -----`);
  console.timeEnd('生成类型定义文件耗时');
}
