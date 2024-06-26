/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 18:18:22
 * @LastEditTime: 2024-06-26 14:42:10
 * @LastEditors: mohong@zmn.cn
 * @Description: NoApi 核心对象
 */
import {
  codeFormat,
  defPrefix,
  exitWithError,
  formatObjName,
  parseToTsType,
  upperFirst,
} from './utils/tools';
import { transformTypeInterfaceCode } from './core/transform';
import { parseUrl } from './core/parse';
import { printApi } from './core/print';
import {
  ApiContext,
  ApiInfo,
  ApiParameter,
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

    if (config.swUrl) {
      this.fetchDataSource();
    }
  }

  get swJson() {
    return this.config.swJson;
  }

  /**
   * 根据URL生成api函数
   * @param urls
   */
  async generateByUrls(
    urls: (string | PrintApiCodeOption)[],
    receiveHandler: (
      result: GenerateApiResult | GenerateDefinitionResult
    ) => void | Promise<void>
  ) {
    console.log('开始生成api函数...');

    try {
      if (Array.isArray(urls)) {
        urls.forEach((url) => {
          this.printApiCode(
            typeof url === 'string' ? { url } : url,
            receiveHandler
          );
        });
      } else {
        this.printApiCode(
          typeof urls === 'string' ? { url: urls } : urls,
          receiveHandler
        );
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
      defs.forEach((def) =>
        this.printDefinitionCode(
          typeof def === 'string' ? { key: def } : def,
          receiveHandler
        )
      );
    } else {
      this.printDefinitionCode(defs, receiveHandler);
    }
  }

  /**
   * 列出Api接口信息
   */
  async listApi(urls?: string[]) {
    const paths = this.config.swJson?.paths;
    if (!paths) {
      return [];
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
    const { swUrl, cookie } = this.config;

    console.log('开始获取api数据源...');

    const swaggerUrl = url || swUrl;
    if (!swaggerUrl) {
      exitWithError('请提供swagger文档地址！');
    }

    try {
      const res = await fetch(swaggerUrl!, {
        headers: { 'Content-Type': 'application/json', Cookie: cookie || '' },
      });
      const json = (await res.json()) as SWJson;
      console.log('获取api数据源成功');
      if (!json.swagger) {
        exitWithError('请提供有效的swagger文档地址！');
      } else {
        this.config.swJson = json;
        this.config.swUrl = swaggerUrl;
      }
    } catch (error) {
      exitWithError('数据源获取失败，请检查 swUrl 是否正确！');
    }

    return this.swJson;
  }

  /**
   * 生成api方法
   * @param url
   */
  public async printApiCode(
    { url, method: onlyMethod, funcName }: PrintApiCodeOption,
    receiveHandler: (
      result: GenerateApiResult | GenerateDefinitionResult
    ) => void | Promise<void>
  ) {
    const apiCollections = this.config.swJson!.paths![url];
    if (!apiCollections) {
      exitWithError(`${url} 不存在！`);
    }
    if (
      onlyMethod &&
      !apiCollections[(onlyMethod = onlyMethod.toLowerCase())]
    ) {
      exitWithError(`${url} 的 ${onlyMethod} 方法不存在！`);
    }

    const { transformApi, customApi } = this.config;

    let {
      funcName: defaultFuncName,
      fileName,
      dirName,
      pathStrParams,
    } = parseUrl(url);
    funcName = funcName || defaultFuncName;

    console.log(
      `===== [url] ${url} [方法名] ${funcName} [文件名] ${fileName} [目录名] ${dirName}`
    );

    const defTodo: string[] = [];
    const pathParams: TypeFieldOption[] = pathStrParams.map((item) => ({
      name: item,
      required: true,
    }));

    // 代码
    let codeStr = '';

    const methodKeys = Object.keys(apiCollections) as unknown as SWApiMethod[];

    methodKeys.forEach((method) => {
      if (onlyMethod && method !== onlyMethod) {
        return;
      }

      const api = apiCollections[method];

      // 入参类型名称
      let inTypeName = '';
      // 入参
      if (api.parameters) {
        // query path body
        const queryParams: ApiParameter[] = [];
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
            const definitionKey = param.schema?.$ref?.replace(
              '#/definitions/',
              ''
            );
            if (definitionKey) {
              inTypeName = formatObjName(definitionKey);
              defTodo.push(definitionKey);
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
            const idx = pathParams.findIndex(
              (item) => item.name === param.name
            );
            if (idx > -1) {
              pathParams[idx].description = param.description;
            }
          }
        });
        // 生成query类型
        if (queryParams.length > 0) {
          inTypeName = `${upperFirst(fileName)}${upperFirst(funcName)}Query`;
          const interfaceCode = transformTypeInterfaceCode(
            queryParams,
            inTypeName
          );
          const queryFileName = `${inTypeName}.ts`;
          const fileDir = 'query/' + queryFileName;
          receiveHandler({
            sourceType: 'definition',
            sourceCode: interfaceCode,
            fileName: queryFileName,
            fileDir,
            typeName: inTypeName,
          } as GenerateDefinitionResult);
        }
      }

      // 出参
      let resRef = api.responses?.[200]?.schema?.$ref;
      if (resRef) {
        const definitionKey = resRef.replace('#/definitions/', '');
        defTodo.push(definitionKey);
      }

      // 转换url
      if (pathParams.length > 0) {
        url = url.replace(/\{(.*?)\}/g, (_, $1) => `\${params.${$1}\}`);
      }

      const apiContext: ApiContext = {
        api,
        name: funcName,
        method,
        url,
        pathParams,
        inType: inTypeName ? defPrefix(inTypeName) : undefined,
        outType: defPrefix(resRef ? formatObjName(resRef) : 'any'),
        comment: api.summary,
      };

      // 生成api函数
      let apiFuncStr = '';

      if (typeof customApi === 'function') {
        apiFuncStr = customApi(apiContext);
      } else {
        apiFuncStr = printApi(apiContext);
      }

      if (typeof transformApi === 'function') {
        apiFuncStr = transformApi(apiFuncStr, apiContext);
      }

      codeStr += apiFuncStr;
    });

    // 创建目录 TODO:默认输出目录待验证
    const fileDir = `${dirName}/${fileName}.ts`;
    // if (!(await checkExists(fullFilePath))) {
    //   codeStr =
    //     fileHeader ||
    //     `import * as models from '@/model';\nimport request from '@/utils/request';\n` + codeStr;
    // }

    console.log('===== [api]', fileDir, '\n');

    receiveHandler({
      sourceType: 'api',
      sourceCode: await codeFormat(codeStr),
      fileName,
      fileDir,
    });

    defTodo.forEach((key) => {
      this.printDefinitionCode({ key }, (result) =>
        receiveHandler({ sourceType: 'definition', ...result })
      );
    });
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
    const keepOuter = false;
    if (!keepOuter) {
      definitionKey = definitionKey.match(/«(.+)»/)?.[1] || definitionKey;
    }

    const definitionCollection =
      this.config.swJson!.definitions![definitionKey];
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
    let objName = typeName || formatObjName(definitionKey);

    // 去掉泛型（尖括号里面的类型）
    const idx = objName.indexOf('<');
    if (idx > -1) {
      objName = objName.substring(0, idx);
    }

    const { required, properties, description: objDesc } = definitionCollection;
    const { include, exclude, match } = this.config.definition!;

    const fileDir = `${objName}.ts`;

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
    Object.keys(properties).forEach(async (propKey) => {
      // 定义属性
      const property = properties[propKey];

      let tsType;

      // 引用类型，递归生成
      const hasRef = property.$ref || property.items?.$ref;
      if (hasRef) {
        const subDefinitionKey = hasRef.replace('#/definitions/', '');
        // FIXME: 可能造成死循环
        console.log(
          '递归生成',
          this.defKeyDone,
          subDefinitionKey,
          this.defKeyDone.has(subDefinitionKey)
        );
        if (this.defKeyDone.has(subDefinitionKey)) {
          tsType = parseToTsType(property).replace('models.', '');
        } else {
          await this.printDefinitionCode(subDefinitionKey, receiveHandler);

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
              codeStr = `${importStr};\n${
                codeStr.includes('import') ? '' : '\n'
              }${codeStr}`;
            }
          }

          tsType += property.items?.$ref ? '[]' : '';
        }
      } else {
        tsType = parseToTsType(property);
      }

      const isRequired = required?.includes(propKey);
      // 过滤掉一些非法字符 如：key[]
      let propStr = `  ${propKey.replace(/\W/g, '')}${
        isRequired ? '' : '?'
      }: ${tsType};\n`;

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

    console.log('===== [model]', fileDir);

    await receiveHandler({
      sourceCode: await codeFormat(codeStr),
      typeName: objName,
      fileName: objName,
      fileDir,
    });
  }
}

/**
 * 创建NoApi实例
 * @param config
 * @returns
 */
export function createNoApi(config: NoApiConfig) {
  if (!config?.swUrl && !config?.swJson) {
    exitWithError('swUrl和swJson至少配置一个！');
  }
  return new NoApi(config);
}
