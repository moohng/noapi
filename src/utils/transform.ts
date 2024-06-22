/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-06-21 16:20:22
 * @LastEditTime: 2024-06-22 14:54:33
 * @LastEditors: mohong@zmn.cn
 * @Description: 类型转换
 */
import { SWDefinitionProperty, parseToTsType } from './tools';

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
export function transformTypeFieldCode(obj: TypeFieldOption) {
  const tsType = parseToTsType(obj as SWDefinitionProperty);
  let codeStr = `  ${obj.name.replace(/\W/g, '')}${obj.required ? '' : '?'}: ${tsType};`;

  const descriptionComment = obj.description ? ` ${obj.description} ` : '';
  const minComment =
    obj.minLength != null ? ` 最小长度：${obj.minLength} ` : '';
  const maxComment =
    obj.maxLength != null ? ` 最大长度：${obj.maxLength} ` : '';
  if (descriptionComment || minComment || maxComment) {
    const comment = `  /**${descriptionComment}${minComment}${maxComment}*/`;
    codeStr = `${comment}\n${codeStr}`;
  }

  return codeStr;
}

/**
 * 通过字段描述生成类型接口代码
 * @param params 
 * @param name 
 * @returns 
 */
export function transformTypeInterfaceCode(params: TypeFieldOption[], name: string) {
  let codeStr = params.map(transformTypeFieldCode).join('\n');
  codeStr = `export default interface ${name} {\n${codeStr}\n}\n`;
  return codeStr;
}
