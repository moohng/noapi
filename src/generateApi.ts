import path from 'path';
import fs from 'fs';
import { formatObjName } from './utils';

interface ApiParameter {
  in: 'body' | 'query' | 'path';
  name: string;
  type?: string;
  default?: any;
  description?: string;
  required?: boolean;
  schema?: {
    '$ref'?: string;
  };
}

interface ApiResponse {
  200: {
    description?: string;
    schema?: {
      '$ref'?: string;
    }
  }
}

type ApiMethod = 'get' | 'post';

interface PathApi {
  [key: string]: {
    [x in ApiMethod]: {
      tags?: string[];
      summary?: string;
      parameters?: ApiParameter[];
      responses?: ApiResponse;
    }
  }
}

interface ApiContext {
  /** 默认取URL最后一段 */
  name: string;
  url: string;
  method: string;
  inType?: string;
  outType?: string;
  comment?: string;
}

interface ApiOptions {
  outDir: string;
  transform?: (apiContext: ApiContext) => string;
}

export function generateApiFile(paths: PathApi, options: ApiOptions) {
  const pathKeys = Object.keys(paths);

  pathKeys.forEach(url => {
    // 根据URL路径确定目录结构
    const urlSplitArr = url.split('/');

    // api函数名
    let funcName = urlSplitArr.pop()!;
    if (funcName.includes('{')) { // 过滤掉path参数
      funcName = urlSplitArr.pop()!;
    }
    // 文件名
    const fileName = urlSplitArr.pop()!;
    // 目录名
    const dirName = urlSplitArr.join('/');
    
    console.log(`===== [url] ${url} =====`, funcName, fileName);
    // 创建目录
    const dirPath = path.join(options.outDir, dirName);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }


    // 创建文件
    const filePath = path.join(dirPath, `${fileName}.ts`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, `import { request } from '@/utils/request';\n`);
    }

    const apiCollection = paths[url];
    const methodKeys = Object.keys(apiCollection) as unknown as ApiMethod[];

    methodKeys.forEach(method => {
      const api = apiCollection[method];

      // 入参
      // const param = api.parameters
      const inType = 'InType'

      // 出参
      let resRef = api.responses?.[200].schema?.$ref;
      const outType = resRef ? formatObjName(resRef) : 'any';

      let apiFuncStr = '';

      if (typeof options.transform === 'function') {
        apiFuncStr = options.transform({ name: funcName, method, url, outType, comment: api.summary })
      } else {
        apiFuncStr = `
          /**
           * ${api.summary || ''}
           */
          export function ${funcName} (data: ${inType}) {
            return request<defs.${outType}>({ url: '${url}', data, method: '${method}' });
          }
        `;
      }

      fs.appendFileSync(filePath, apiFuncStr, 'utf-8');
    });
  });
}

/**
 * 首字母大写
 * @param str
 */
function upperFirstLatter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
