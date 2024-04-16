/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 18:18:22
 * @LastEditTime: 2024-04-16 14:27:08
 * @LastEditors: mohong@zmn.cn
 * @Description: 入口函数
 */
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import {
  ApiContext,
  ApiMethod,
  ApiOptions,
  SWPathApiCollections,
  formatNameByUrl,
} from './utils/api.js';
import {
  ApiParameter,
  GENERIC_TYPE_NAMES,
  GenerateDefinitionResult,
  SWDefinitionCollections,
  writeToIndexFile,
} from './utils/definition.js';
import {
  defPrefix,
  exitWithError,
  formatObjName,
  parseToTsType,
} from './utils/tools.js';

interface SWJson {
  swagger: string;
  info: { title: string };
  host: string;
  basePath?: string;
  tags: Array<{ name: string; description: string }>;
  paths: SWPathApiCollections;
  definitions: SWDefinitionCollections;
}

interface NoApiConfig extends ApiOptions {
  swUrl: string;
  cookie?: string;
  swJson?: SWJson;
}

class NoApi {
  private config: NoApiConfig;

  constructor(config: NoApiConfig) {
    this.config = {
      outDir: path.resolve('/src/api'),
      ...config,
      definition: {
        outDir: path.resolve('/src/model'),
        ...config.definition,
      },
    };
  }

  get paths() {
    return this.config.swJson?.paths;
  }

  get definitions() {
    return this.config.swJson?.definitions;
  }

  /**
   * 全量生成所有api函数（适用于：初始化、重构项目时）
   * @returns
   */
  async auto() {
    // 获取数据
    await this.fetchDataSource();

    // generateBatch(this.paths!, this.definitions!, this.config);
  }

  /**
   * 根据URL生成api函数
   * @param urls
   */
  async generateByUrls(urls: string[]) {
    await this.fetchDataSource();

    console.log('开始生成api函数...');

    urls.forEach((url) => {
      this.generateApiFile(url);
    });
  }

  /**
   * 根据定义Key生成类型文件
   * @param defs
   */
  async generateByDefs(defs: string[], alias?: string[]) {
    await this.fetchDataSource();

    console.log('开始生成类型定义...');

    defs.forEach((defKey, index) => {
      this.generateDefinitionFile(defKey, alias?.[index]);
    });
  }

  /**
   * 列出Api接口信息
   */
  async listApi(urls?: string[]) {
    await this.fetchDataSource();

    if (!this.paths) {
      console.log('没有找到api！');
      return;
    }

    urls = urls || Object.keys(this.paths!);

    const apis = [];
    for (const url of urls) {
      const apiCollections = this.paths![url];
      if (!apiCollections) {
        break;
      }
      const tempApis = Object.keys(apiCollections).map((method) => {
        const api = apiCollections[method];
        return {
          tag: api.tags?.join('；'),
          title: api.summary,
          url: url.replace(/^\//, ''),
          method: method.toUpperCase(),
          parameters: JSON.stringify(api.parameters),
          responses: JSON.stringify(api.responses),
        };
      });
      apis.push(...tempApis);
    }

    if (apis.length === 0) {
      console.log('没有找到api！');
    } else {
      console.log(apis);
      console.log(`共找到${apis.length}条api`);
    }
  }

  // 私有函数

  /**
   * 获取数据源
   */
  private async fetchDataSource() {
    const { swUrl, cookie } = this.config;

    console.log('开始获取api数据源...');

    try {
      const res = await fetch(swUrl, {
        headers: { 'Content-Type': 'application/json', Cookie: cookie || '' },
      });
      this.config.swJson = (await res.json()) as SWJson;
      if (!this.config.swJson.swagger) {
        exitWithError('请提供有效的swagger文档地址！');
      }
      console.log('获取api数据源成功');
    } catch (error) {
      exitWithError('数据源获取失败，请检查 swUrl 是否正确！');
    }
  }

  /**
   * 生成api方法
   * @param url
   */
  private generateApiFile(url: string) {
    const apiCollections = this.paths![url];
    if (!apiCollections) {
      exitWithError(`${url} 不存在！`);
    }

    const { transform, fileHeader, outDir } = this.config;

    const { funcName, fileName, dirName } = formatNameByUrl(url);

    console.log(
      `===== [url] ${url} [方法名] ${funcName} [文件名] ${fileName} [目录名] ${dirName}`
    );

    // 创建目录 TODO:默认输出目录待验证
    const dirPath = path.join(outDir || path.resolve('src/api'), dirName);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // 创建文件
    const filePath = path.join(dirPath, `${fileName}.ts`);
    if (!fs.existsSync(filePath)) {
      const importHeader =
        fileHeader ||
        `import { request } from '@/utils/request';\nimport * as models from '@/model';\n`;
      fs.writeFileSync(filePath, importHeader);
    }

    const methodKeys = Object.keys(apiCollections) as unknown as ApiMethod[];

    methodKeys.forEach((method) => {
      const api = apiCollections[method];

      // 入参
      const inResult = api.parameters
        ? this.generateQueryFile(api.parameters)
        : undefined;

      // 出参
      let resRef = api.responses?.[200].schema?.$ref;

      if (resRef) {
        const definitionKey = resRef.replace('#/definitions/', '');
        this.generateDefinitionFile(definitionKey);
      }

      const apiContext: ApiContext = {
        name: funcName,
        method,
        url,
        inType: inResult?.objName && defPrefix(inResult?.objName),
        outType: defPrefix(resRef ? formatObjName(resRef) : 'any'),
        comment: api.summary,
      };

      // 生成api函数
      let apiFuncStr = '';

      if (typeof transform === 'function') {
        apiFuncStr = transform(apiContext);
      } else {
        const { inType, outType, comment, name, url, method } = apiContext;
        const paramStr = inType ? `data: ${inType}` : '';
        const resStr = outType?.includes('List<')
          ? `${outType.match(/List<(.*)>/)![1]}[]`
          : outType;
        apiFuncStr = `
/**
 * ${comment || ''}
 */
export function ${name}(${paramStr}) {
  return request<${resStr}>({ url: '${url}',${
          paramStr ? ' data,' : ''
        } method: '${method}' });
}
`;
      }

      fs.appendFileSync(filePath, apiFuncStr, 'utf-8');
    });

    console.log('===== [api]', filePath, '\n');
  }

  /**
   * 生成类型定义
   * @param definitionKey
   * @param aliasName
   * @returns
   */
  private generateDefinitionFile(
    definitionKey: string,
    aliasName?: string
  ): GenerateDefinitionResult | undefined {
    const keepOuter = false;
    if (!keepOuter) {
      definitionKey = definitionKey.match(/«(.+)»/)?.[1] || definitionKey;
    }

    const definitionCollection = this.definitions![definitionKey];
    if (!definitionCollection) {
      exitWithError(`${definitionKey} 不存在！`);
    }

    // 忽略一些类型：List等
    ['List'].forEach((ignoreType) => {
      definitionKey =
        definitionKey.match(new RegExp(`${ignoreType}«(.+)»`))?.[1] ||
        definitionKey;
    });

    // 对象名称
    let objName = aliasName || formatObjName(definitionKey);

    // 去掉泛型（尖括号里面的类型）
    const idx = objName.indexOf('<');
    if (idx > -1) {
      objName = objName.substring(0, idx);
    }

    const { required, properties, description: objDesc } = definitionCollection;
    const { outDir, include, exclude, match } = this.config.definition!;

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

    // 拼接代码
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
          if (definitionKey !== subDefinitionKey) {
            this.generateDefinitionFile(subDefinitionKey);
          }

          // 泛型
          if (definitionKey.includes(`«${subDefinitionKey}»`)) {
            if (!refList.includes(hasRef)) {
              refList.push(hasRef);
              tsType = GENERIC_TYPE_NAMES[++genericIndex];
              genericTypes.push(tsType);
            } else {
              tsType = GENERIC_TYPE_NAMES[genericIndex];
            }
          } else {
            tsType = formatObjName(subDefinitionKey);
            // 导入外部类型
            const importStr = `import ${tsType} from './${tsType}'`;
            if (!codeStr.includes(importStr)) {
              codeStr = `${importStr};\n${codeStr.includes('import') ? '' : '\n'}${codeStr}`;
            }
          }
          
          tsType += property.items?.$ref ? '[]' : '';
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
      codeStr = codeStr.replace(
        `interface ${objName}`,
        `interface ${objName}<${genericTypes.join(', ')}>`
      );
    }

    // 创建输出目录
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // 生成文件
    fs.writeFileSync(filePath, codeStr);

    console.log('===== [model]', filePath);

    // 写入Index文件
    writeToIndexFile(objName, outDir);

    return { objName, fileName: objName, filePath, outDir };
  }

  private generateQueryFile(
    params: ApiParameter[]
  ): GenerateDefinitionResult | undefined {
    // 入参
    // {
    //   "name": "categMatterId",
    //   "in": "query",
    //   "description": "categMatterId",
    //   "required": false,
    //   "type": "integer",
    //   "default": 0,
    //   "format": "int32"
    // },

    const queryParams = params.filter((item) => item.in === 'query');
    if (queryParams.length > 0) {
      // TODO: objName如何获取
      // let codeStr = `export default interface ${objName} {\n`;
      // // 生成query类型
      // queryParams.forEach((property) => {
      //   const tsType = parseToTsType(property as unknown as SWDefinitionProperty);
      //   const { name, required, description } = property;
      //   let propStr = `  ${name}${required ? '' : '?'}: ${tsType};\n`;
      //   if (description) {
      //     const comment = `  /** ${description} */`;
      //     propStr = `${comment}\n${propStr}`;
      //   }
      //   // 拼接属性
      //   codeStr += propStr;
      // });
      // codeStr += '}\n';
    }

    // "parameters": [
    //   {
    //     "name": "sign",
    //     "in": "path",
    //     "description": "sign",
    //     "required": true,
    //     "type": "string"
    //   }
    // ],
    const pathParams = params.filter((item) => item.in === 'path');
    if (pathParams.length > 0) {
      // 生成path类型
    }

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
    const bodyParams = params.filter((item) => item.in === 'body');
    if (bodyParams.length > 0) {
      // 生成body类型
      const definitionKey = bodyParams[0].schema?.$ref?.replace(
        '#/definitions/',
        ''
      );
      return definitionKey
        ? this.generateDefinitionFile(definitionKey)
        : undefined;
    }
    return;
  }
}

export function createNoApi(config: NoApiConfig) {
  if (!config?.swUrl) {
    exitWithError('请检查是否正确配置了swUrl地址！');
  }
  return new NoApi(config);
}

/**
 * 定义配置
 * @param config
 * @returns
 */
export function definedNoApiConfig(config: NoApiConfig) {
  return config;
}
