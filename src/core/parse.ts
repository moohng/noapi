import { SWDefinitionProperty } from '@/types';
import { formatObjName } from '../utils/tools';

/**
 * 解析URL路径
 * 从URL路径中解析出api函数名、文件名、目录名、路径参数
 * @param url
 * @returns
 */
export function parseUrl(url: string) {
  // 根据URL路径确定目录结构
  const urlSplitArr = url.replace(/^\//, '').split('/');

  // 路径参数
  const pathStrParams: string[] = [];

  const getFuncName = () => {
    let name = urlSplitArr.pop()!;
    if (name.includes('{') || name.includes(':')) {
      // 获取path参数
      const matched = name.match(/\{(.+)\}/) || name.match(/:(.+)/);
      if (matched) {
        pathStrParams.push(matched[1]);
      }

      name = getFuncName();
    }
    return name;
  };

  // api函数名
  const funcName = getFuncName();
  // 文件名
  const fileName = urlSplitArr.pop() || 'common';
  // 目录名
  const dirName = urlSplitArr.join('/');

  return {
    funcName,
    fileName,
    dirName,
    pathStrParams,
  };
}

/**
 * 解析属性类型
 * @param {SWDefinitionProperty} property
 * @returns
 */
export function parseToTsType(
  property?: string | SWDefinitionProperty
): string {
  if (typeof property !== 'string') {
    // 数组类型
    if (property?.type === 'array') {
      const subType = property.items ? parseToTsType(property.items) : 'any';
      return `${subType}[]`;
    }

    // 对象引用
    if (property?.$ref) {
      const name = formatObjName(property.$ref);
      return `models.${name}`;
    }

    property = property?.type;
  }

  const map = {
    string: 'string',
    integer: 'number',
    boolean: 'boolean',
    object: 'object',
  };

  return map[property as keyof typeof map] || 'any';
}
