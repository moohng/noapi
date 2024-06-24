import { LoaderSync } from 'cosmiconfig';
import { NoApiConfig } from '..';
import { TypeFieldOption } from './transform';
/**
 * 去掉后端对象名中的非法字符
 * 比如：com.zmn.common.dto2.ResponseDTO«List«ActivityListVO对象»»     ======>     List<ActivityListVO>
 * com.zmn.common.dto2.ResponseDTO«com.zmn.bff.crp.matter.common.dro.aftersales.order.SubmitAftersaleDRO»    ======>      SubmitAftersaleDRO
 * @param objName
 * @param keepOuter
 */
export declare function formatObjName(objName: string, keepOuter?: boolean): string;
export interface SWDefinitionProperty {
    type?: 'string' | 'integer' | 'boolean' | 'object' | 'array';
    items?: SWDefinitionProperty;
    description?: string;
    $ref?: string;
}
/**
 * 解析属性类型
 * @param {SWDefinitionProperty} property
 * @returns
 */
export declare function parseToTsType(property?: string | SWDefinitionProperty): string;
/**
 * 首字母大写
 * @param str
 */
export declare function upperFirstLatter(str: string): string;
/**
 * 是否是基本类型
 * @param type
 */
export declare function isBaseType(type: string): boolean;
/**
 * 对类型添加命名空间前缀，比如：AMISList<WorkItem> ===> models.AMISList<models.WorkItem>
 * @param type
 */
export declare function defPrefix(type: string): string;
/**
 * 加载配置项
 * @returns
 */
export declare function loadConfig(configPath?: string, loader?: LoaderSync): NoApiConfig;
/**
 * 合并配置项
 * @param options
 * @returns
 */
export declare function mergeConfig(options: any): any;
/**
 * 报错并退出
 * @param message
 */
export declare function exitWithError(...messages: string[]): void;
/**
 * 创建配置文件
 * @param url 接口文档地址
 * @param rootDir 项目根目录
 * @returns
 */
export declare function createConfig(url?: string, rootDir?: string): Promise<string>;
/**
 * 格式化代码
 * @param code
 * @returns
 */
export declare function codeFormat(code: string): Promise<string>;
/**
 * 写入文件
 * @param filePath
 * @param content
 */
export declare function writeToFile(filePath: string, content: string): Promise<void>;
/**
 * 追加内容到文件
 * @param filePath
 * @param content
 * @returns
 */
export declare function appendToFile(filePath: string, content: string): Promise<void>;
/**
 * 检查文件或目录是否存在
 * @param path
 * @returns
 */
export declare function checkExists(path: string): Promise<boolean>;
/**
 * 解析路径参数
 * @param url
 * @returns
 */
export declare function parsePathParams(url: string): TypeFieldOption[];
/**
 * 首字母大写
 * @param str
 * @returns
 */
export declare function upperFirst(str: string): string;
