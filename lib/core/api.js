"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBatch = exports.generateApiFile = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const utils_1 = require("../utils");
const definition_1 = require("./definition");
function generateApiFile(url, apiCollections, definitionCollections, options) {
    // 根据URL路径确定目录结构
    const urlSplitArr = url.split('/');
    // api函数名
    let funcName = urlSplitArr.pop();
    if (funcName.includes('{')) { // 过滤掉path参数
        funcName = urlSplitArr.pop();
    }
    // 文件名
    const fileName = urlSplitArr.pop();
    // 目录名
    const dirName = urlSplitArr.join('/');
    console.log(`===== [url] ${url} =====`, funcName, fileName);
    // 创建目录 TODO:默认输出目录待验证
    const dirPath = path_1.default.join(options.outDir || path_1.default.resolve('src/api'), dirName);
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
    }
    // 创建文件
    const filePath = path_1.default.join(dirPath, `${fileName}.ts`);
    if (!fs_1.default.existsSync(filePath)) {
        fs_1.default.writeFileSync(filePath, `import { request } from '@/utils/request';\nimport * as models from '@/model'`);
    }
    const methodKeys = Object.keys(apiCollections);
    methodKeys.forEach(method => {
        var _a, _b;
        const api = apiCollections[method];
        // 入参
        // const param = api.parameters
        const inType = 'InType';
        // 出参
        let resRef = (_b = (_a = api.responses) === null || _a === void 0 ? void 0 : _a[200].schema) === null || _b === void 0 ? void 0 : _b.$ref;
        // 生成类型定义文件
        if (resRef) {
            const definitionKey = resRef.replace('#/definitions/', '');
            const result = (0, definition_1.generateDefinitionFile)(definitionKey, definitionCollections, options.definition);
            if (result) {
                (0, definition_1.writeToIndexFile)(result);
            }
        }
        let outType = resRef ? (0, utils_1.formatObjName)(resRef) : 'any';
        // 处理泛型前缀
        outType = (0, utils_1.defPrefix)(outType);
        // 生成api函数
        let apiFuncStr = '';
        if (typeof options.transform === 'function') {
            apiFuncStr = options.transform({ name: funcName, method, url, outType, comment: api.summary });
        }
        else {
            apiFuncStr = `
        /**
         * ${api.summary || ''}
         */
        export function ${funcName}(data: ${inType}) {
          return request<${outType}>({ url: '${url}', data, method: '${method}' });
        }
      `;
        }
        fs_1.default.appendFileSync(filePath, apiFuncStr, 'utf-8');
    });
    console.log(`===== [api filePath] ${filePath} =====`);
}
exports.generateApiFile = generateApiFile;
function generateBatch(paths, definitionCollections, options) {
    const pathKeys = Object.keys(paths);
    pathKeys.forEach(url => {
        generateApiFile(url, paths[url], definitionCollections, options);
    });
}
exports.generateBatch = generateBatch;
