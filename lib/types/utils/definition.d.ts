export interface SWDefinitionObj {
    required?: string[];
    properties?: Record<string, any>;
    description?: string;
    [key: string]: unknown;
}
export interface SWDefinitionCollections {
    [key: string]: SWDefinitionObj;
}
export interface GenerateDefinitionOptions {
    outDir: string;
    include?: (string | RegExp)[];
    exclude?: (string | RegExp)[];
    match?: RegExp;
}
export interface GenerateDefinitionResult {
    objName: string;
    fileName: string;
    filePath: string;
    outDir: string;
}
export declare const GENERIC_TYPE_NAMES: string[];
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
/**
 * 写入到index.ts
 * @param objName
 * @param outDir
 * @returns
 */
export declare function writeToIndexFile(objName: string, outDir: string): string;
/**
 * 批量生成定义文件
 * @param {SWDefinitionCollections} definitions
 * @param {GenerateDefinitionOptions} options
 */
export declare function generateBatch(definitions: SWDefinitionCollections, options: GenerateDefinitionOptions): void;
