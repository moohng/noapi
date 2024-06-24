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
    sourceCode: string;
    typeName: string;
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
 * @param typeName
 * @param outDir
 * @returns
 */
export declare function writeToIndexFile(typeName: string, outDir: string, filePath?: string): Promise<string>;
