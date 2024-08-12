import { formatObjName, upperFirst } from './utils/tools';
import { transformTypeInterfaceCode } from './core/transform';
import { parseToTsType, parseUrl } from './core/parse';
import { printDefaultApi } from './core/print';
import {
  ApiContext,
  ApiInfo,
  SWApiParameter,
  GenerateApiResult,
  GenerateDefinitionResult,
  NoApiConfig,
  PrintApiCodeOption,
  PrintDefinitionCodeOption,
  SWApiMethod,
  SWJson,
  TypeFieldOption,
} from './types';

const GENERIC_TYPE_NAMES = ['T', 'K', 'U', 'V'];

class NoApi {
  private config: NoApiConfig;
  private apis: ApiInfo[] = [];

  // 已生成的类型Key，避免重复生成
  private defKeyDone: Set<string> = new Set();

  constructor(config: NoApiConfig) {
    this.config = config;
  }

  private swagJson?: SWJson;

  /**
   * 根据URL生成api函数
   * @param urls
   */
  async generateByUrls(
    urls: (string | PrintApiCodeOption)[],
    receiveHandler: (result: GenerateApiResult & Partial<GenerateDefinitionResult>) => void | Promise<void>
  ) {
    if (!this.apis?.length) {
      await this.listApi();
    }

    console.log('开始生成api函数...');

    try {
      if (Array.isArray(urls)) {
        for (const url of urls) {
          await this.printApiCode(typeof url === 'string' ? { url } : url, receiveHandler);
        }
      } else {
        this.printApiCode(typeof urls === 'string' ? { url: urls } : urls, receiveHandler);
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * 根据定义Key生成类型文件
   * @param defs
   */
  async generateByDefs(
    defs: (string | PrintDefinitionCodeOption)[],
    receiveHandler: (result: GenerateDefinitionResult) => void | Promise<void>
  ) {
    if (!this.apis?.length) {
      await this.listApi();
    }

    console.log('开始生成类型定义...');

    if (Array.isArray(defs)) {
      for (const def of defs) {
        await this.printDefinitionCode(typeof def === 'string' ? { key: def } : def, receiveHandler);
      }
    } else {
      this.printDefinitionCode(defs, receiveHandler);
    }
  }

  /**
   * 列出Api接口信息
   */
  async listApi(urls?: string[]) {
    if (!this.swagJson?.paths) {
      await this.fetchDataSource();
    }

    const paths = this.swagJson?.paths;
    if (!paths) {
      throw new Error('接口文档解析失败，请检查 swUrl 是否正确！');
    }

    urls = urls || Object.keys(paths);

    const apis = [];
    for (const url of urls) {
      const apiCollections = paths[url];
      if (!apiCollections) {
        break;
      }
      const tempApis = Object.keys(apiCollections).map((method) => {
        const api = apiCollections[method];
        return {
          url,
          tag: api.tags?.join('；'),
          summary: api.summary || url,
          method: method.toUpperCase(),
          parameters: JSON.stringify(api.parameters),
          responses: JSON.stringify(api.responses),
        };
      });
      apis.push(...tempApis);
    }

    this.apis = apis;

    return apis as ApiInfo[];
  }

  /**
   * 获取数据源
   */
  async fetchDataSource(url?: string) {
    const { swagUrl, swagSource, cookie } = this.config;

    if (typeof swagSource === 'object' && (swagSource as SWJson).swagger) {
      this.swagJson = swagSource as SWJson;
      return this.swagJson;
    }

    if (typeof swagSource === 'function') {
      try {
        this.swagJson = await swagSource();
        return this.swagJson;
      } catch (error) {
        console.error(error, '自定义数据源获取失败！');
      }
    }

    console.log('开始获取api数据源...');

    const swaggerUrl = url || (swagSource as string) || swagUrl;
    if (!swaggerUrl) {
      throw new Error('请提供swagger文档地址！');
    }

    try {
      const res = await fetch(swaggerUrl, {
        headers: { 'Content-Type': 'application/json', Cookie: cookie || '' },
      });
      const json = (await res.json()) as SWJson;
      console.log('获取api数据源成功');
      if (!json.swagger) {
        throw new Error('请提供有效的swagger文档地址！');
      } else {
        this.swagJson = json;
      }
    } catch (error) {
      throw new Error('数据源获取失败，请检查 swUrl 是否正确！');
    }

    return this.swagJson;
  }

  /**
   * 生成api方法
   * @param url
   */
  public async printApiCode(
    { url, method: onlyMethod, funcName, onlyDef }: PrintApiCodeOption,
    receiveHandler: (result: GenerateApiResult) => void | Promise<void>
  ) {
    const apiCollections = this.swagJson!.paths![url];
    if (!apiCollections) {
      throw new Error(`${url} 不存在！`);
    }
    if (onlyMethod && !apiCollections[(onlyMethod = onlyMethod.toLowerCase())]) {
      throw new Error(`${url} 的 ${onlyMethod} 方法不存在！`);
    }

    const { beforeApi, transformApi, customApi } = this.config;

    let { funcName: defaultFuncName, fileName: fileNameWithoutExt, dirName, pathStrParams } = parseUrl(url);
    funcName = funcName || defaultFuncName;

    console.log(`===== [url] ${url} [方法名] ${funcName} [文件名] ${fileNameWithoutExt} [目录名] ${dirName}`);

    const defTodo = new Set<string>();
    const pathParams: TypeFieldOption[] = pathStrParams.map((item) => ({
      name: item,
      required: true,
    }));

    // 代码
    let codeStr = '';

    const methodKeys = Object.keys(apiCollections) as unknown as SWApiMethod[];

    for (const method of methodKeys) {
      if (onlyMethod && method !== onlyMethod) {
        continue;
      }

      const api = apiCollections[method];

      // 入参类型名称
      let inTypeName = '';
      // 入参
      if (api.parameters) {
        // query path body
        const queryParams: SWApiParameter[] = [];
        api.parameters.forEach((param) => {
          if (param.in === 'body') {
            //   {
            //     "in": "body",
            //     "name": "modifyDIO",
            //     "description": "modifyDIO",
            //     "required": true,
            //     "schema": {
            //       "$ref": "#/definitions/CrpCooperationModifyDIO对象"
            //     }
            //   }
            const definitionKey = param.schema?.$ref?.replace('#/definitions/', '');
            if (definitionKey) {
              inTypeName = formatObjName(definitionKey);
              defTodo.add(definitionKey);
            }
          } else if (param.in === 'query') {
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
            queryParams.push(param);
          } else if (param.in === 'path') {
            //   {
            //     "name": "sign",
            //     "in": "path",
            //     "description": "sign",
            //     "required": true,
            //     "type": "string"
            //   }
            const idx = pathParams.findIndex((item) => item.name === param.name);
            if (idx > -1) {
              pathParams[idx].description = param.description;
            }
          }
        });
        // 生成query类型
        if (queryParams.length > 0) {
          inTypeName = `${upperFirst(fileNameWithoutExt)}${upperFirst(funcName)}Query`;
          const interfaceCode = transformTypeInterfaceCode(queryParams, inTypeName);
          const queryFileName = `${inTypeName}.ts`;
          const fileDir = (dirName ? dirName + '/' : '') + 'query';
          await receiveHandler({
            sourceType: 'definition',
            sourceCode: interfaceCode,
            fileName: queryFileName,
            fileDir,
            filePath: `${fileDir}/${queryFileName}`,
            typeName: inTypeName,
          });
        }
      }

      // 出参
      let outTypeName = 'any';
      if (api.responses?.[200]?.schema) {
        outTypeName = parseToTsType(api.responses[200].schema);
        outTypeName = outTypeName.match(/<(.+)>/)?.[1] || outTypeName;
        const { $ref, items } = api.responses[200].schema;
        const resRef = $ref || items?.$ref;
        if (resRef) {
          const definitionKey = resRef.replace('#/definitions/', '');
          defTodo.add(definitionKey);
        }
      }

      if (onlyDef) {
        continue;
      }

      let apiContext: ApiContext = {
        api,
        name: funcName,
        method,
        url,
        pathParams,
        inType: inTypeName,
        outType: outTypeName,
        comment: api.summary,
      };

      if (typeof beforeApi === 'function') {
        apiContext = await beforeApi(apiContext);
      }

      if (typeof customApi === 'function') {
        const result = await customApi(apiContext);
        console.log('自定义api', result);
        if (typeof result === 'string') {
          apiContext.sourceCode = result;
        } else if (result.sourceCode) {
          apiContext = { ...apiContext, ...result };
        } else {
          apiContext.sourceCode = printDefaultApi(apiContext);
        }
      } else {
        apiContext.sourceCode = printDefaultApi(apiContext);
      }

      if (typeof transformApi === 'function') {
        apiContext = await transformApi(apiContext);
      }

      codeStr += apiContext.sourceCode;
    }

    if (!onlyDef) {
      const fileName = `${fileNameWithoutExt}.ts`;
      const filePath = (dirName ? dirName + '/' : '') + fileName;

      console.log('===== [api]', filePath, '\n');

      await receiveHandler({
        sourceType: 'api',
        sourceCode: codeStr,
        fileName,
        fileDir: dirName,
        filePath,
        funcName,
      });
    }

    try {
      const fileDir = (dirName ? dirName + '/' : '') + 'model';
      for (let key of defTodo) {
        // TODO: 是否去掉最外层的类型
        key = key.match(/«(.+)»/)?.[1] || key;
        await this.printDefinitionCode(
          { key },
          async (result) => await receiveHandler({ sourceType: 'definition', ...result, fileDir, filePath: `${fileDir}/${result.fileName}` })
        );
      }
    } catch (error) {
      // 忽略错误
    }
  }

  /**
   * 生成类型定义
   * @param definitionKey
   * @param aliasName
   * @returns
   */
  public async printDefinitionCode(
    { key, typeName }: PrintDefinitionCodeOption,
    receiveHandler: (result: GenerateDefinitionResult) => void | Promise<void>
  ) {
    let definitionKey = key;
    // 忽略一些类型：List等
    ['List'].forEach((ignoreType) => {
      definitionKey = definitionKey.match(new RegExp(`${ignoreType}«(.+)»`))?.[1] || definitionKey;
    });

    const definitionCollection = this.swagJson!.definitions![definitionKey];
    if (!definitionCollection) {
      throw new Error(`${definitionKey} 不存在！`);
    }

    // 对象名称
    let objName = typeName || formatObjName(definitionKey);

    // 去掉泛型（尖括号里面的类型）
    const idx = objName.indexOf('<');
    if (idx > -1) {
      objName = objName.substring(0, idx);
    }

    const { required, properties, description: objDesc } = definitionCollection;

    if (!objName || !properties || /^[a-z]/.test(objName)) {
      return;
    }

    const { ignoreTypes, matchTypes } = this.config;
    // 过滤一些不合法类型
    if (
      ignoreTypes?.some((item) => (item instanceof RegExp ? item.test(definitionKey) : item === objName)) ||
      (matchTypes && !matchTypes.some((match) => (match instanceof RegExp ? match.test(definitionKey) : match === objName)))
    ) {
      // 是否有子类型
      const subDefs = Object.values(properties).filter((item) => item.$ref || item.items?.$ref)?.map((item) => (item.$ref || item.items?.$ref).replace('#/definitions/', '')) || [];
      for (const subDef of subDefs) {
        await this.printDefinitionCode({ key: subDef }, receiveHandler);
      }
      return;
    }

    this.defKeyDone.add(definitionKey);

    // 拼接代码
    let codeStr = `export default interface ${objName} {\n  // @NOAPI[${definitionKey}]\n`;
    if (objDesc) {
      codeStr = `/** ${objDesc} */\n${codeStr}`;
    }

    let genericIndex = -1;
    const refList: string[] = [];
    const genericTypes: string[] = [];

    // 遍历属性
    for (const propKey of Object.keys(properties)) {
      // 定义属性
      const property = properties[propKey];

      let tsType;

      // 引用类型，递归生成
      const hasRef = property.$ref || property.items?.$ref;
      if (hasRef) {
        const subDefinitionKey = hasRef.replace('#/definitions/', '');
        // FIXME: 可能造成死循环
        console.log('递归生成', this.defKeyDone, subDefinitionKey, this.defKeyDone.has(subDefinitionKey));
        if (this.defKeyDone.has(subDefinitionKey)) {
          tsType = parseToTsType(property);
        } else {
          await this.printDefinitionCode({ key: subDefinitionKey }, receiveHandler);

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
          }

          tsType += property.items?.$ref ? '[]' : '';
        }

        // 导入外部类型，泛型不导入
        const importType = tsType.replace(/\W/g, '');
        if (genericTypes.indexOf(importType) === -1) {
          const importStr = `import ${importType} from './${importType}'`;
          if (!codeStr.includes(importStr) && definitionKey !== subDefinitionKey) {
            codeStr = `${importStr};\n${codeStr.includes('import') ? '' : '\n'}${codeStr}`;
          }
        }
      } else {
        tsType = parseToTsType(property);
      }

      const isRequired = required?.includes(propKey);
      // 过滤掉一些非法字符 如：key[]
      let propStr = `  ${propKey.replace(/\W/g, '')}${isRequired ? '' : '?'}: ${tsType};\n`;

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
    }

    codeStr += '}\n';

    // 是否有泛型
    if (genericTypes.length > 0) {
      codeStr = codeStr.replace(`interface ${objName}`, `interface ${objName}<${genericTypes.join(', ')}>`);
    }

    const fileName = `${objName}.ts`;

    console.log('===== [model]', fileName);

    await receiveHandler({
      sourceCode: codeStr,
      typeName: objName,
      fileName,
    });
  }
}

/**
 * 创建NoApi实例
 * @param config
 * @returns
 */
export function createNoApi(config: NoApiConfig) {
  if (!config?.swagUrl && !config?.swagSource) {
    throw new Error('请配置 swagSource！');
  }
  return new NoApi(config);
}
