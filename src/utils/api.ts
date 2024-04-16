import {
  ApiParameter,
  GenerateDefinitionOptions,
} from './definition.js';

interface ApiResponse {
  200: {
    description?: string;
    schema?: {
      $ref?: string;
    };
  };
}

export type ApiMethod = 'get' | 'post';

export type ApiCollections = Record<
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

export interface ApiContext {
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
