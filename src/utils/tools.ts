// import * as prettier from 'prettier';
// import standard from 'standard';

/**
 * 去掉后端对象名中的非法字符
 * 比如：com.xxx.common.dto2.ResponseDTO«List«ActivityListVO对象»»     ======>     ResponseDTO<List<ActivityListVO>>
 * com.xxx.common.dto2.ResponseDTO«com.xxx.bff.crp.matter.common.dro.aftersales.order.SubmitAftersaleDRO»    ======>      ResponseDTO<SubmitAftersaleDRO>
 * @param objName
 * @param keepOuter
 */
export function formatObjName(objName: string) {
  // 去掉包名 com.xxx.common.dto2.  、非法字符
  let name = objName.replace(/\w+(\.|\/)/g, '').replace(/«/g, '<').replace(/»/g, '>')
  name = name.replace(/[^<>]+/g, (match) => {
    return match.replace(/[^a-zA-Z0-9]/g, '') || match;
  });
  return name;
}

/**
 * 是否是基本类型
 * @param type
 */
export function isBaseType(type: string) {
  return ['string', 'number', 'boolean', 'object', 'any', 'unknown'].includes(type);
}

/**
 * 对类型添加命名空间前缀，比如：AMISList<WorkItem> ===> models.AMISList<models.WorkItem>
 * @param type 
 */
export function defPrefix(type: string, prefix = 'models') {
  return isBaseType(type) ? type : type.replace(/[^<>]+/g, (match) => {
    return isBaseType(match) ? match : `${prefix}.${match}`;
  });
}

/**
 * 格式化代码
 * @param code 
 * @returns 
 */
export async function codeFormat(code: string) {
  // const formatted = await standard.format(code, {
  //   parser: 'babel-ts',
  //   singleQuote: true,
  //   trailingComma: 'es5',
  //   printWidth: 150,
  //   endOfLine: 'auto',
  // });
  // return formatted;
  return code;
}

/**
 * 首字母大写
 * @param str 
 * @returns 
 */
export function upperFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
