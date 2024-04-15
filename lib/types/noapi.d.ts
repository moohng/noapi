import { ApiOptions, SWPathApiCollections } from './utils/api.js';
import { SWDefinitionCollections } from './utils/definition.js';
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
interface NoApiConfig extends ApiOptions {
    swUrl: string;
    cookie?: string;
    swJson?: SWJson;
}
declare class NoApi {
    private config;
    constructor(config: NoApiConfig);
    get paths(): SWPathApiCollections | undefined;
    get definitions(): SWDefinitionCollections | undefined;
    /**
     * 全量生成所有api函数（适用于：初始化、重构项目时）
     * @returns
     */
    auto(): Promise<void>;
    /**
     * 根据URL生成api函数
     * @param urls
     */
    generateByUrls(urls: string[]): Promise<void>;
    /**
     * 根据定义Key生成类型文件
     * @param defs
     */
    generateByDefs(defs: string[], alias?: string[]): Promise<void>;
    /**
     * 列出Api接口信息
     */
    listApi(urls?: string[]): Promise<void>;
    /**
     * 获取数据源
     */
    private fetchDataSource;
    /**
     * 生成api方法
     * @param url
     */
    private generateApiFile;
    /**
     * 生成类型定义
     * @param definitionKey
     * @param aliasName
     * @returns
     */
    private generateDefinitionFile;
    private generateQueryFile;
}
export declare function createNoApi(config: NoApiConfig): NoApi;
/**
 * 定义配置
 * @param config
 * @returns
 */
export declare function definedNoApiConfig(config: NoApiConfig): NoApiConfig;
export { createConfig, loadConfig } from './utils/tools';
