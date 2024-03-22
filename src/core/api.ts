import path from 'path';
import fs from 'fs';
import { defPrefix, formatObjName, isBaseType } from '../utils';
import { GenerateDefinitionOptions, SWDefinitionCollections, generateDefinitionFile, writeToIndexFile } from './definition';

interface ApiParameter {
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

interface ApiResponse {
  200: {
    description?: string;
    schema?: {
      '$ref'?: string;
    }
  }
}

type ApiMethod = 'get' | 'post';

type ApiCollections = Record<ApiMethod | string, {
  tags?: string[];
  summary?: string;
  parameters?: ApiParameter[];
  responses?: ApiResponse;
}>;

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

export function generateApiFile(url: string, apiCollections: ApiCollections, definitionCollections: SWDefinitionCollections, options: ApiOptions) {
  // 根据URL路径确定目录结构
  const urlSplitArr = url.split('/');

  // api函数名
  let funcName = urlSplitArr.pop()!;
  if (funcName.includes('{')) { // 过滤掉path参数
    funcName = urlSplitArr.pop()!;
  }
  // 文件名
  const fileName = urlSplitArr.pop()!;
  // 目录名
  const dirName = urlSplitArr.join('/');
  
  console.log(`===== [url] ${url} =====`, funcName, fileName);

  // 创建目录 TODO:默认输出目录待验证
  const dirPath = path.join(options.outDir || path.resolve('src/api'), dirName);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // 创建文件
  const filePath = path.join(dirPath, `${fileName}.ts`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `import { request } from '@/utils/request';\nimport * as models from '@/model'`);
  }

  const methodKeys = Object.keys(apiCollections) as unknown as ApiMethod[];

  methodKeys.forEach(method => {
    const api = apiCollections[method];

    // 入参
    // const param = api.parameters
    const inType = 'InType'

    // 出参
    let resRef = api.responses?.[200].schema?.$ref;

    // 生成类型定义文件
    if (resRef) {
      const definitionKey = resRef.replace('#/definitions/', '');
      const result = generateDefinitionFile(definitionKey, definitionCollections, options.definition!);
      if (result) {
        writeToIndexFile(result);
      }
    }
    
    let outType = resRef ? formatObjName(resRef) : 'any';
    // 处理泛型前缀
    outType = defPrefix(outType);

    // 生成api函数
    let apiFuncStr = '';

    if (typeof options.transform === 'function') {
      apiFuncStr = options.transform({ name: funcName, method, url, outType, comment: api.summary })
    } else {
      apiFuncStr = `
        /**
         * ${api.summary || ''}
         */
        export function ${funcName}(data: ${inType}) {
          return request<${outType}>({ url: '${url}', data, method: '${method}' });
        }
      `;
    }

    fs.appendFileSync(filePath, apiFuncStr, 'utf-8');
  });

  console.log(`===== [api filePath] ${filePath} =====`);
}

export function generateBatch(paths: SWPathApiCollections, definitionCollections: SWDefinitionCollections, options: ApiOptions) {
  const pathKeys = Object.keys(paths);

  pathKeys.forEach(url => {
    generateApiFile(url, paths[url], definitionCollections, options);
  });
}
