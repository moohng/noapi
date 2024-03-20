/**
 * 去掉后端对象名中的非法字符
 * 比如：com.zmn.common.dto2.ResponseDTO«List«ActivityListVO对象»»     ======>     List<ActivityListVO>
 * com.zmn.common.dto2.ResponseDTO«com.zmn.bff.crp.matter.common.dro.aftersales.order.SubmitAftersaleDRO»    ======>      SubmitAftersaleDRO
 * @param objName
 * @param keepOuter
 */
export function formatObjName(objName: string, keepOuter = false) {
  // 去掉包名 com.zmn.common.dto2.  、非法字符
  let name = objName.replace(/.*(\.|\/)|\W+/g, '').replace(/«/g, '<').replace(/»/g, '>');
  // 是否去掉最外层对象
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
    return name;
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