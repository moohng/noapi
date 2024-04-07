import path from 'path';
import fs from 'fs';
import { defPrefix, formatObjName } from '../utils.js';
import {
  ApiParameter,
  GenerateDefinitionOptions,
  SWDefinitionCollections,
  generateDefinitionFile,
  generateQueryFile,
  writeToIndexFile,
} from './definition.js';

interface ApiResponse {
  200: {
    description?: string;
    schema?: {
      $ref?: string;
    };
  };
}

type ApiMethod = 'get' | 'post';

type ApiCollections = Record<
  ApiMethod | string,
  {
    tags?: string[];
    summary?: string;
    parameters?: ApiParameter[];
    responses?: ApiResponse;
  }
>;

export interface SWPathApiCollections {
  [key: string]: ApiCollections;
}

interface ApiContext {
  /** 默认取URL最后一段 */
  name: string;
  url: string;
  method: string;
  inType?: string;
  outType?: string;
  comment?: string;
}

export interface ApiOptions {
  outDir?: string;
  /**
   * 文件头部信息，import 信息
   */
  fileHeader?: string;
  /**
   * 自定义生成api方法转换
   */
  transform?: (apiContext: ApiContext) => string;
  /**
   * 生成api方法之前调用
   * @param apiContext
   * @returns
   */
  beforeFunc?: (apiContext: ApiContext) => string;
  /**
   * 生成api方法之后调用
   * @param apiContext
   * @returns
   */
  afterFunc?: (apiContext: ApiContext) => string;
  /**
   * 类型定义配置
   */
  definition?: GenerateDefinitionOptions;
}

function formatNameByUrl(url: string) {
  // 根据URL路径确定目录结构
  const urlSplitArr = url.split('/');

  const getFuncName = (arr: string[]) => {
    let name = arr.pop()!;
    if (name.includes('{')) {
      // 过滤掉path参数
      name = getFuncName(arr);
    }
    return name;
  };

  // api函数名
  const funcName = getFuncName(urlSplitArr);

  // 文件名
  const fileName = urlSplitArr.pop() || 'common';
  // 目录名
  const dirName = urlSplitArr.join('/');

  return {
    funcName,
    fileName,
    dirName,
  };
}

export function generateApiFile(
  url: string,
  apiCollections: ApiCollections,
  definitionCollections: SWDefinitionCollections,
  options: ApiOptions
) {
  const { funcName, fileName, dirName } = formatNameByUrl(url);

  console.log(
    `===== [url] ${url} [方法名] ${funcName} [文件名] ${fileName} [目录名] ${dirName}`
  );

  // 创建目录 TODO:默认输出目录待验证
  const dirPath = path.join(options.outDir || path.resolve('src/api'), dirName);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // 创建文件
  const filePath = path.join(dirPath, `${fileName}.ts`);
  if (!fs.existsSync(filePath)) {
    const importHeader =
      options.fileHeader ||
      `import { request } from '@/utils/request';\nimport * as models from '@/model';\n`;
    fs.writeFileSync(filePath, importHeader);
  }

  const methodKeys = Object.keys(apiCollections) as unknown as ApiMethod[];

  methodKeys.forEach((method) => {
    const api = apiCollections[method];

    // 入参
    const inResult = api.parameters
      ? generateQueryFile(
          api.parameters,
          definitionCollections,
          options.definition!
        )
      : undefined;

    // 出参
    let resRef = api.responses?.[200].schema?.$ref;

    if (resRef) {
      const definitionKey = resRef.replace('#/definitions/', '');
      generateDefinitionFile(
        definitionKey,
        definitionCollections,
        options.definition!
      );
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

    if (typeof options.transform === 'function') {
      apiFuncStr = options.transform(apiContext);
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
          return request<${resStr}>({ url: '${url}', data, method: '${method}' });
        }
      `;
    }

    fs.appendFileSync(filePath, apiFuncStr, 'utf-8');
  });

  console.log('===== [api]', filePath, '\n');
}

export function generateBatch(
  paths: SWPathApiCollections,
  definitionCollections: SWDefinitionCollections,
  options: ApiOptions
) {
  const pathKeys = Object.keys(paths);

  pathKeys.forEach((url) => {
    generateApiFile(url, paths[url], definitionCollections, options);
  });
}
