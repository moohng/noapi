import { ApiParameter, GenerateDefinitionOptions } from './definition.js';
import { TypeFieldOption } from './transform.js';
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
export type SWApiCollections = Record<SWApiMethod | string, SWApiDefinition>;
export interface SWPathApiCollections {
    [key: string]: SWApiCollections;
}
export interface ApiContext {
    api: SWApiDefinition;
    /** 默认取URL最后一段 */
    name: string;
    url: string;
    method: string;
    inType?: string;
    outType?: string;
    comment?: string;
    pathParams?: TypeFieldOption[];
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
 * 生成api的结果
 */
export interface GenerateApiResult {
    sourceType: 'api' | 'definition';
    sourceCode: string;
    fileName: string;
    filePath: string;
}
/**
 * 跟进url获取相关名称
 * @param url
 * @returns
 */
export declare function formatNameByUrl(url: string): {
    funcName: string;
    fileName: string;
    dirName: string;
};
export {};
