import {
  ApiParameter,
  GenerateDefinitionOptions,
} from './definition.js';

interface SWApiResponse {
  200: {
    description?: string;
    schema?: {
      $ref?: string;
    };
  };
}

export type SWApiMethod = 'get' | 'post';

export interface SWApiDefinition {
  tags?: string[];
  summary?: string;
  parameters?: ApiParameter[];
  responses?: SWApiResponse;
}

export type SWApiCollections = Record<
  SWApiMethod | string,
  SWApiDefinition
>;

export interface SWPathApiCollections {
  [key: string]: SWApiCollections;
}

export interface ApiContext {
  api: SWApiDefinition,
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
   * 自定义生成api方法
   */
  customApi?: (apiContext: ApiContext) => string;
  /**
   * 自定义的一些其他代码转换
   */
  transformApi?: (source: string, apiContext: ApiContext) => string;
  /**
   * 类型定义配置
   */
  definition?: GenerateDefinitionOptions;
}

/**
 * 跟进url获取相关名称
 * @param url 
 * @returns 
 */
export function formatNameByUrl(url: string) {
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
