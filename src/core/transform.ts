/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-06-21 16:20:22
 * @LastEditTime: 2024-06-26 11:45:35
 * @LastEditors: mohong@zmn.cn
 * @Description: 类型转换
 */
import { TypeFieldOption } from '@/types';
import { SWDefinitionProperty, parseToTsType } from '../utils/tools';

/**
 * 生成类型字段代码
 * @param obj 
 * @returns 
 */
export function transformTypeFieldCode(obj: TypeFieldOption | string) {
  if (typeof obj ==='string') {
    obj = { name: obj, required: true };
  }
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
