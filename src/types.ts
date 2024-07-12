// ============ SWagger API Definition ============
export interface SWApiParameter {
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

export interface SWDefinitionProperty {
  type?: 'string' | 'integer' | 'boolean' | 'object' | 'array';
  items?: SWDefinitionProperty,
  description?: string;
  $ref?: string;
}

interface SWApiResponse {
  200: {
    description?: string;
    schema?: SWDefinitionProperty;
  };
}

export interface SWApiOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  parameters?: SWApiParameter[];
  responses?: SWApiResponse;
  deprecated?: boolean;
  schemes?: 'http' | 'https' | 'ws' | 'wss';
}

export type SWApiMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

export type SWApiPathItem = Record<
  SWApiMethod | string,
  SWApiOperation
>;

export interface SWDefinitionObj {
  required?: string[];
  properties?: Record<string, any>;
  description?: string;
  [key: string]: unknown;
}

/**
 * SWagger JSON
 */
export interface SWJson {
  swagger: string;
  info: { title: string; description?: string; version: string };
  host?: string;
  schemes?: string[];
  basePath?: string;
  tags?: Array<{ name: string; description: string }>;
  paths: {
    [key: string]: SWApiPathItem;
  };
  definitions?: {
    [key: string]: SWDefinitionObj;
  };
}

// ============ NoApi 配置 ============
export interface NoApiConfig {
  /** swagger json 文档地址 */
  swagUrl?: string;
  /** 如果接口文档需要登录，则需要设置cookie */
  cookie?: string;
  /** swagger json 文档内容 */
  swagJson?: SWJson;
  /** api文件头部信息，如import导入等 */
  fileHeader?: string;
  /**
   * 自定义生成api方法，此时还没有生成源码
   */
  customApi?: (apiContext: ApiContext) => string | ApiContext | Promise<string | ApiContext>;
  /**
   * 自定义api代码转换，如代码格式化，此时已经生成源码
   */
  transformApi?: (apiContext: ApiContext) => ApiContext | Promise<ApiContext>;
  /**
   * 忽略匹配的类型定义，默认忽略最外层的Response类型
   */
  ignoreTypes?: (string | RegExp)[];
  /**
   * 只生成匹配的类型，比如只生成xxx开头的类型定义等
   */
  matchTypes?: (string | RegExp)[];
}

export interface NoApiLocalConfig extends NoApiConfig {
  /** api文件输出根目录 */
  apiBase?: string;
  /** 类型定义输出根目录 */
  defBase?: string;
  /** swagger 本地文件路径 */
  swagFile?: string;
}

export interface ApiInfo {
  tag?: string;
  summary: string;
  url: string;
  method: string;
  parameters: string;
  responses: string;
}

/**
 * 类型字段选项
 */
export interface TypeFieldOption {
  name: string;
  type?: string;
  required?: boolean;
  description?: string;
  minLength?: number;
  maxLength?: number;
}

export interface ApiContext {
  api: SWApiOperation,
  sourceCode?: string;
  /** 默认取URL最后一段 */
  name: string;
  url: string;
  method: string;
  inType?: string;
  outType?: string;
  comment?: string;
  pathParams?: TypeFieldOption[];
}

/**
 * 生成api的结果
 */
export interface GenerateApiResult {
  sourceType: 'api' | 'definition';
  sourceCode: string;
  fileName: string;
  fileDir: string;
  funcName?: string;
}

export interface GenerateDefinitionResult {
  sourceCode: string;
  typeName: string;
  fileName: string;
  fileDir: string;
}

export interface PrintApiCodeOption {
  url: string;
  method?: string;
  funcName?: string;
  onlyDef?: boolean;
}

export interface PrintDefinitionCodeOption {
  key: string;
  typeName?: string;
}