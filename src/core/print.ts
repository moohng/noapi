import { ApiContext } from '@/types';
import { transformTypeFieldCode } from './transform';

export function print(opt: any, printHandler: any) {
  console.log('print');
  return printHandler(opt);
}

/**
 * 输出 api 函数代码
 * @param apiContext
 * @returns
 */
export function printApi(apiContext: ApiContext) {
  const { inType, outType, comment, name, url, method, pathParams } = apiContext;
  let paramStr = inType ? `data: ${inType}` : '';
  let urlStr = `'${url}'`;
  if (pathParams?.length! > 0) {
    let codeStr = pathParams!.map(transformTypeFieldCode).join('\n');
    paramStr = `params: {\n${codeStr}\n}`;
    // 转换 url
    const paramUrl = url.replace(/\{(.*?)\}/g, (_, $1) => `\${params.${$1}\}`);
    urlStr = `\`${paramUrl}\``;
  }
  const resStr = outType?.includes('List<') ? `${outType.match(/(models\.)?List<(.*)>/)![2]}[]` : outType;
  let apiFuncStr = `
export function ${name}(${paramStr}) {
  return request<${resStr}>({ url: ${urlStr},${inType ? ' data,' : ''} method: '${method.toUpperCase()}' });
}
`;
  if (comment) {
    apiFuncStr =
      `
/**
 * ${comment}
 * @NOAPI[${method}:${url}]
 */` + apiFuncStr;
  } else {
    apiFuncStr =
      `
/**
 * @NOAPI[${method}:${url}]
 */` + apiFuncStr;
  }
  return apiFuncStr;
}

export function printDef() {
  console.log('printDef');
}
