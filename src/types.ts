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
  /** swagger 数据源 */
  swagSource: string | SWJson | (() => SWJson | Promise<SWJson>);
  /**
   * 自定义 apiContext 信息
   */
  beforeApi?: (apiContext: ApiContext) => ApiContext | Promise<ApiContext>;
  /**
   * 自定义生成api方法，此时还没有生成源码
   */
  customApi?: (apiContext: ApiContext) => string | ApiContext | Promise<string | ApiContext>;
  /**
   * 自定义api代码转换，如：代码格式化，此时已经生成源码
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
  /**
   * 自定义类型映射，将文档中的类型映射到ts类型，比如将String映射到string，将Integer映射到number等
   */
  typeMapping?: Record<string, string>;
}

/**
 * 为保证使用noapi的配置一致性，需要遵循此配置规范
 */
export interface NoApiLocalConfig extends NoApiConfig {
  /** api文件输出根目录，默认在./src/api目录下 */
  apiBase?: string;
  /** 类型定义输出根目录，默认在apiBase中当前api目录下创建的model目录 */
  defBase?: string;
  /** swagger 本地文件路径，默认在apiBase的根目录下创建 noapi-swagger-doc.json */
  swagFile?: string;
  /** api文件头部信息，如import导入等，第一次新建文件时生效 */
  fileHeader?: string | (() => string | Promise<string>);
  /** 是否导出所有类型定义到index.ts文件中，默认true */
  exportFromIndex?: boolean;
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
  /** 函数名称 */
  funcName?: string;
  /** 类型名称 Abc */
  typeName?: string;
  /** abc.ts */
  fileName: string;
  /** d:\zmn\noapi\src\api */
  fileDir: string;
  /** d:\zmn\noapi\src\api\abc.ts */
  filePath: string;
}

export interface GenerateDefinitionResult {
  sourceCode: string;
  /** 类型名称 Abc */
  typeName: string;
  /** abc.ts */
  fileName: string;
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
