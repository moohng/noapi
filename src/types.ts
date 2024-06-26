// ============ SWagger API Definition ============
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

interface SWApiResponse {
  200: {
    description?: string;
    schema?: {
      $ref?: string;
    };
  };
}

export interface SWApiDefinition {
  tags?: string[];
  summary?: string;
  parameters?: ApiParameter[];
  responses?: SWApiResponse;
}

export type SWApiMethod = 'get' | 'post';

export type SWApiCollections = Record<
  SWApiMethod | string,
  SWApiDefinition
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
  info: { title: string };
  host: string;
  basePath?: string;
  tags: Array<{ name: string; description: string }>;
  paths: {
    [key: string]: SWApiCollections;
  };
  definitions: {
    [key: string]: SWDefinitionObj;
  };
}

// ============ NoApi 配置 ============
export interface GenerateDefinitionOptions {
  include?: (string | RegExp)[];
  exclude?: (string | RegExp)[];
  match?: RegExp;
}

export interface ApiOptions {
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

export interface NoApiConfig extends ApiOptions {
  swUrl?: string;
  cookie?: string;
  swJson?: SWJson;
}

export interface NoApiLocalConfig extends NoApiConfig {
  apiBase?: string;
  defBase?: string;
  swFile?: string;
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
  api: SWApiDefinition,
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
}

export interface PrintDefinitionCodeOption {
  key: string;
  typeName?: string;
}

export interface SWDefinitionProperty {
  type?: 'string' | 'integer' | 'boolean' | 'object' | 'array';
  items?: SWDefinitionProperty,
  description?: string;
  $ref?: string;
}
