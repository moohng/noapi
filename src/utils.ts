/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 09:45:06
 * @LastEditTime: 2024-03-22 14:02:43
 * @LastEditors: mohong@zmn.cn
 * @Description: 工具函数
 */
/**
 * 去掉后端对象名中的非法字符
 * 比如：com.zmn.common.dto2.ResponseDTO«List«ActivityListVO对象»»     ======>     List<ActivityListVO>
 * com.zmn.common.dto2.ResponseDTO«com.zmn.bff.crp.matter.common.dro.aftersales.order.SubmitAftersaleDRO»    ======>      SubmitAftersaleDRO
 * @param objName
 * @param keepOuter
 */
export function formatObjName(objName: string, keepOuter = false) {
  console.log('=====222===', objName);
  // 去掉包名 com.zmn.common.dto2.  、非法字符
  let name = objName.replace(/\w+(\.|\/)/g, '').replace(/«/g, '<').replace(/»/g, '>').replace(/[^0-9a-zA-Z<>]+/g, '');
  // 是否保留最外层对象
  if (!keepOuter) {
    name = name.match(/<(.+)>/)?.[1] || name;
  }
  return name;
}

export interface SWDefinitionProperty {
  type?: 'string' | 'integer' | 'boolean' | 'object' | 'array';
  items?: SWDefinitionProperty,
  description?: string;
  $ref?: string;
}

/**
 * 解析属性类型
 * @param {SWDefinitionProperty} property
 * @returns
 */
export function parseToTsType(property: SWDefinitionProperty): string {
  // 数组类型
  if (property.type === 'array') {
    const subType = property.items ? parseToTsType(property.items) : 'any';
    return `${subType}[]`;
  }

  // 对象引用
  if (property.$ref) {
    const name = formatObjName(property.$ref);
    return `defs.${name}`;
  }

  // 基本类型
  if (property.type) {
    const map = {
      string: 'string',
      integer: 'number',
      boolean: 'boolean',
      object: 'object',
    };
    return map[property.type] || 'any';
  }

  return 'any';
}

/**
 * 首字母大写
 * @param str
 */
export function upperFirstLatter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 是否是基本类型
 * @param type
 */
export function isBaseType(type: string) {
  return ['string', 'number', 'boolean', 'object', 'any', 'unknown'].includes(type);
}

/**
 * 对类型添加命名空间前缀，比如：AMISList<WorkItem> ===> defs.AMISList<defs.WorkItem>
 * @param type 
 */
export function defPrefix(type: string) {
  return isBaseType(type) ? type : type.replace(/\w+/g, (match) => {
    return isBaseType(match) ? match : `defs.${match}`;
  });
}