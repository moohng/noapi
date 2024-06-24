import { ApiOptions, SWPathApiCollections, GenerateApiResult } from './utils/api.js';
import { GenerateDefinitionResult, SWDefinitionCollections } from './utils/definition.js';
interface SWJson {
    swagger: string;
    info: {
        title: string;
    };
    host: string;
    basePath?: string;
    tags: Array<{
        name: string;
        description: string;
    }>;
    paths: SWPathApiCollections;
    definitions: SWDefinitionCollections;
}
export interface NoApiConfig extends ApiOptions {
    swUrl?: string;
    swFile?: string;
    cookie?: string;
    swJson?: SWJson;
}
export interface ApiInfo {
    tag?: string;
    title: string;
    url: string;
    method: string;
    parameters: string;
    responses: string;
}
declare class NoApi {
    private config;
    private apis;
    private defKeyDone;
    constructor(config: NoApiConfig);
    get swJson(): SWJson | undefined;
    /**
     * 根据URL生成api函数
     * @param urls
     */
    generateByUrls(urls: (string | {
        url: string;
        filePath?: string;
        funcName?: string;
        method?: string;
    })[]): Promise<void>;
    /**
     * 根据定义Key生成类型文件
     * @param defs
     */
    generateByDefs(defs: string[], alias?: string[]): Promise<void>;
    /**
     * 列出Api接口信息
     */
    listApi(urls?: string[]): Promise<ApiInfo[] | undefined>;
    /**
     * 获取数据源
     */
    fetchDataSource(): Promise<SWJson | undefined>;
    /**
     * 生成api方法
     * @param url
     */
    generateApiCode({ url, method: onlyMethod, filePath, funcName, }: {
        url: string;
        method?: string;
        filePath?: string;
        funcName?: string;
    }, receiveHandler: (result: GenerateApiResult | GenerateDefinitionResult) => void): Promise<void>;
    /**
     * 生成类型定义
     * @param definitionKey
     * @param aliasName
     * @returns
     */
    generateDefinitionCode(definitionKey: string, receiveHandler: (result: GenerateDefinitionResult) => void, aliasName?: string): Promise<void>;
}
export declare function createNoApi(config: NoApiConfig): NoApi;
/**
 * 定义配置
 * @param config
 * @returns
 */
export declare function definedNoApiConfig(config: NoApiConfig): NoApiConfig;
export {};
