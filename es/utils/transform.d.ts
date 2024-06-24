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
/**
 * 生成类型字段代码
 * @param obj
 * @returns
 */
export declare function transformTypeFieldCode(obj: TypeFieldOption): string;
/**
 * 通过字段描述生成类型接口代码
 * @param params
 * @param name
 * @returns
 */
export declare function transformTypeInterfaceCode(params: TypeFieldOption[], name: string): string;
