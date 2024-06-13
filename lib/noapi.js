"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.definedNoApiConfig = exports.createNoApi = void 0;
/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 18:18:22
 * @LastEditTime: 2024-06-13 22:25:41
 * @LastEditors: mohong@zmn.cn
 * @Description: 入口函数
 */
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const api_js_1 = require("./utils/api.js");
const definition_js_1 = require("./utils/definition.js");
const tools_js_1 = require("./utils/tools.js");
class NoApi {
    constructor(config) {
        // 待生成的类型定义
        this.defTodo = new Set();
        this.config = Object.assign(Object.assign({ outDir: path_1.default.resolve('/src/api') }, config), { definition: Object.assign({ outDir: path_1.default.resolve('/src/model') }, config.definition) });
    }
    get paths() {
        var _a;
        return (_a = this.config.swJson) === null || _a === void 0 ? void 0 : _a.paths;
    }
    get definitions() {
        var _a;
        return (_a = this.config.swJson) === null || _a === void 0 ? void 0 : _a.definitions;
    }
    /**
     * 全量生成所有api函数（适用于：初始化、重构项目时）
     * @returns
     */
    auto() {
        return __awaiter(this, void 0, void 0, function* () {
            // 获取数据
            yield this.fetchDataSource();
            // generateBatch(this.paths!, this.definitions!, this.config);
        });
    }
    /**
     * 根据URL生成api函数
     * @param urls
     */
    generateByUrls(urls) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fetchDataSource();
            console.log('开始生成api函数...');
            try {
                if (Array.isArray(urls)) {
                    urls.forEach((url) => {
                        this.generateApiFile(url);
                    });
                }
                else {
                    const { url, filePath, funcName } = urls;
                    this.generateApiFile(url, filePath, funcName);
                }
            }
            catch (error) {
                console.error(error);
            }
            console.log('开始生成类型定义...');
            this.defTodo.forEach((defKey) => {
                if (typeof defKey === 'string') {
                    this.generateDefinitionFile(defKey);
                }
                else {
                    this.generateQueryFile(defKey.parameters, defKey.name);
                }
            });
        });
    }
    /**
     * 根据定义Key生成类型文件
     * @param defs
     */
    generateByDefs(defs, alias) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fetchDataSource();
            console.log('开始生成类型定义...');
            defs.forEach((defKey, index) => {
                this.generateDefinitionFile(defKey, alias === null || alias === void 0 ? void 0 : alias[index]);
            });
        });
    }
    /**
     * 列出Api接口信息
     */
    listApi(urls) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fetchDataSource();
            if (!this.paths) {
                console.log('没有找到api！');
                return;
            }
            urls = urls || Object.keys(this.paths);
            const apis = [];
            for (const url of urls) {
                const apiCollections = this.paths[url];
                if (!apiCollections) {
                    break;
                }
                const tempApis = Object.keys(apiCollections).map((method) => {
                    var _a;
                    const api = apiCollections[method];
                    return {
                        tag: (_a = api.tags) === null || _a === void 0 ? void 0 : _a.join('；'),
                        title: api.summary,
                        url: url.replace(/^\//, ''),
                        method: method.toUpperCase(),
                        parameters: JSON.stringify(api.parameters),
                        responses: JSON.stringify(api.responses),
                    };
                });
                apis.push(...tempApis);
            }
            if (apis.length === 0) {
                console.log('没有找到api！');
            }
            else {
                console.log(apis);
                console.log(`共找到${apis.length}条api`);
            }
        });
    }
    // 私有函数
    /**
     * 获取数据源
     */
    fetchDataSource() {
        return __awaiter(this, void 0, void 0, function* () {
            const { swUrl, cookie } = this.config;
            console.log('开始获取api数据源...');
            try {
                const res = yield (0, node_fetch_1.default)(swUrl, {
                    headers: { 'Content-Type': 'application/json', Cookie: cookie || '' },
                });
                this.config.swJson = (yield res.json());
                if (!this.config.swJson.swagger) {
                    (0, tools_js_1.exitWithError)('请提供有效的swagger文档地址！');
                }
                console.log('获取api数据源成功');
            }
            catch (error) {
                (0, tools_js_1.exitWithError)('数据源获取失败，请检查 swUrl 是否正确！');
            }
        });
    }
    /**
     * 生成api方法
     * @param url
     */
    generateApiFile(url, filePath, funcName) {
        const apiCollections = this.paths[url];
        if (!apiCollections) {
            (0, tools_js_1.exitWithError)(`${url} 不存在！`);
        }
        const { transformApi, customApi, fileHeader, outDir } = this.config;
        let { funcName: defaultFuncName, fileName, dirName } = (0, api_js_1.formatNameByUrl)(url);
        funcName = funcName || defaultFuncName;
        if (filePath) {
            const { dir, name } = path_1.default.parse(filePath);
            dirName = dir || dirName;
            fileName = name || fileName;
        }
        console.log(`===== [url] ${url} [方法名] ${funcName} [文件名] ${fileName} [目录名] ${dirName}`);
        // 创建目录 TODO:默认输出目录待验证
        const dirPath = path_1.default.join(outDir || path_1.default.resolve('src/api'), dirName);
        if (!fs_1.default.existsSync(dirPath)) {
            fs_1.default.mkdirSync(dirPath, { recursive: true });
        }
        // 创建文件
        const fullFilePath = path_1.default.join(dirPath, `${fileName}.ts`);
        if (!fs_1.default.existsSync(fullFilePath)) {
            const importHeader = fileHeader ||
                `import { request } from '@/utils/request';\nimport * as models from '@/model';\n`;
            fs_1.default.writeFileSync(fullFilePath, importHeader);
        }
        const methodKeys = Object.keys(apiCollections);
        methodKeys.forEach((method) => {
            var _a, _b;
            const api = apiCollections[method];
            // 入参
            if (api.parameters) {
                this.defTodo.add({
                    name: '', // TODO:如何命名？
                    parameters: api.parameters,
                });
            }
            // 出参
            let resRef = (_b = (_a = api.responses) === null || _a === void 0 ? void 0 : _a[200].schema) === null || _b === void 0 ? void 0 : _b.$ref;
            if (resRef) {
                const definitionKey = resRef.replace('#/definitions/', '');
                this.defTodo.add(definitionKey);
            }
            const apiContext = {
                api,
                name: funcName,
                method,
                url,
                inType: '' || undefined,
                outType: (0, tools_js_1.defPrefix)(resRef ? (0, tools_js_1.formatObjName)(resRef) : 'any'),
                comment: api.summary,
            };
            // 生成api函数
            let apiFuncStr = '';
            if (typeof customApi === 'function') {
                apiFuncStr = customApi(apiContext);
            }
            else {
                const { inType, outType, comment, name, url, method } = apiContext;
                const paramStr = inType ? `data: ${inType}` : '';
                const resStr = (outType === null || outType === void 0 ? void 0 : outType.includes('List<'))
                    ? `${outType.match(/List<(.*)>/)[1]}[]`
                    : outType;
                apiFuncStr = `
/**
 * ${comment || ''}
 */
export function ${name}(${paramStr}) {
  return request<${resStr}>({ url: '${url}',${paramStr ? ' data,' : ''} method: '${method}' });
}
`;
            }
            let sourceStr = fs_1.default.readFileSync(fullFilePath, 'utf-8');
            sourceStr += apiFuncStr;
            if (typeof transformApi === 'function') {
                sourceStr = transformApi(sourceStr, apiContext);
            }
            fs_1.default.writeFileSync(fullFilePath, sourceStr, 'utf-8');
        });
        console.log('===== [api]', fullFilePath, '\n');
    }
    /**
     * 生成类型定义
     * @param definitionKey
     * @param aliasName
     * @returns
     */
    generateDefinitionFile(definitionKey, aliasName) {
        var _a;
        const keepOuter = false;
        if (!keepOuter) {
            definitionKey = ((_a = definitionKey.match(/«(.+)»/)) === null || _a === void 0 ? void 0 : _a[1]) || definitionKey;
        }
        const definitionCollection = this.definitions[definitionKey];
        if (!definitionCollection) {
            (0, tools_js_1.exitWithError)(`${definitionKey} 不存在！`);
        }
        // 忽略一些类型：List等
        ['List'].forEach((ignoreType) => {
            var _a;
            definitionKey =
                ((_a = definitionKey.match(new RegExp(`${ignoreType}«(.+)»`))) === null || _a === void 0 ? void 0 : _a[1]) ||
                    definitionKey;
        });
        // 对象名称
        let objName = aliasName || (0, tools_js_1.formatObjName)(definitionKey);
        // 去掉泛型（尖括号里面的类型）
        const idx = objName.indexOf('<');
        if (idx > -1) {
            objName = objName.substring(0, idx);
        }
        const { required, properties, description: objDesc } = definitionCollection;
        const { outDir, include, exclude, match } = this.config.definition;
        const filePath = path_1.default.join(outDir, `${objName}.ts`);
        // 过滤一些不合法类型
        if (!objName ||
            !properties ||
            /^[a-z]/.test(objName) ||
            (exclude === null || exclude === void 0 ? void 0 : exclude.some((item) => item instanceof RegExp ? item.test(definitionKey) : item === objName)) ||
            (include &&
                !include.some((item) => item instanceof RegExp ? item.test(definitionKey) : item === objName)) ||
            (match && !match.test(definitionKey))) {
            return;
        }
        // 拼接代码
        let codeStr = `export default interface ${objName} {\n`;
        if (objDesc) {
            codeStr = `/** ${objDesc} */\n${codeStr}`;
        }
        let genericIndex = -1;
        const refList = [];
        const genericTypes = [];
        // 遍历属性
        Object.keys(properties).forEach((propKey) => {
            var _a, _b;
            // 定义属性
            const property = properties[propKey];
            let tsType;
            // 引用类型，递归生成
            const hasRef = property.$ref || ((_a = property.items) === null || _a === void 0 ? void 0 : _a.$ref);
            if (hasRef) {
                const subDefinitionKey = hasRef.replace('#/definitions/', '');
                if (definitionKey === subDefinitionKey) {
                    tsType = (0, tools_js_1.parseToTsType)(property).replace('models.', '');
                }
                else {
                    if (definitionKey !== subDefinitionKey) {
                        this.generateDefinitionFile(subDefinitionKey);
                    }
                    // 泛型
                    if (definitionKey.includes(`«${subDefinitionKey}»`)) {
                        if (!refList.includes(hasRef)) {
                            refList.push(hasRef);
                            tsType = definition_js_1.GENERIC_TYPE_NAMES[++genericIndex];
                            genericTypes.push(tsType);
                        }
                        else {
                            tsType = definition_js_1.GENERIC_TYPE_NAMES[genericIndex];
                        }
                    }
                    else {
                        tsType = (0, tools_js_1.formatObjName)(subDefinitionKey);
                        // 导入外部类型
                        const importStr = `import ${tsType} from './${tsType}'`;
                        if (!codeStr.includes(importStr)) {
                            codeStr = `${importStr};\n${codeStr.includes('import') ? '' : '\n'}${codeStr}`;
                        }
                    }
                    tsType += ((_b = property.items) === null || _b === void 0 ? void 0 : _b.$ref) ? '[]' : '';
                }
            }
            else {
                tsType = (0, tools_js_1.parseToTsType)(property);
            }
            const isRequired = required === null || required === void 0 ? void 0 : required.includes(propKey);
            // 过滤掉一些非法字符 如：key[]
            let propStr = `  ${propKey.replace(/\W/g, '')}${isRequired ? '' : '?'}: ${tsType};\n`;
            // 添加注释
            const descriptionComment = property.description
                ? ` ${property.description} `
                : '';
            const minComment = property.minLength != null ? ` 最小长度：${property.minLength} ` : '';
            const maxComment = property.maxLength != null ? ` 最大长度：${property.maxLength} ` : '';
            if (descriptionComment || minComment || maxComment) {
                const comment = `  /**${descriptionComment}${minComment}${maxComment}*/`;
                propStr = `${comment}\n${propStr}`;
            }
            // 拼接属性
            codeStr += propStr;
        });
        codeStr += '}\n';
        // 是否有泛型
        if (genericTypes.length > 0) {
            codeStr = codeStr.replace(`interface ${objName}`, `interface ${objName}<${genericTypes.join(', ')}>`);
        }
        // 创建输出目录
        if (!fs_1.default.existsSync(outDir)) {
            fs_1.default.mkdirSync(outDir, { recursive: true });
        }
        // 生成文件
        fs_1.default.writeFileSync(filePath, codeStr);
        console.log('===== [model]', filePath);
        // 写入Index文件
        (0, definition_js_1.writeToIndexFile)(objName, outDir);
        return { objName, fileName: objName, filePath, outDir };
    }
    generateQueryFile(params, name) {
        var _a, _b;
        console.log('生成query类型', name);
        // 入参
        // {
        //   "name": "categMatterId",
        //   "in": "query",
        //   "description": "categMatterId",
        //   "required": false,
        //   "type": "integer",
        //   "default": 0,
        //   "format": "int32"
        // },
        const queryParams = params.filter((item) => item.in === 'query');
        if (queryParams.length > 0) {
            // TODO: objName如何获取
            // let codeStr = `export default interface ${objName} {\n`;
            // // 生成query类型
            // queryParams.forEach((property) => {
            //   const tsType = parseToTsType(property as unknown as SWDefinitionProperty);
            //   const { name, required, description } = property;
            //   let propStr = `  ${name}${required ? '' : '?'}: ${tsType};\n`;
            //   if (description) {
            //     const comment = `  /** ${description} */`;
            //     propStr = `${comment}\n${propStr}`;
            //   }
            //   // 拼接属性
            //   codeStr += propStr;
            // });
            // codeStr += '}\n';
        }
        // "parameters": [
        //   {
        //     "name": "sign",
        //     "in": "path",
        //     "description": "sign",
        //     "required": true,
        //     "type": "string"
        //   }
        // ],
        const pathParams = params.filter((item) => item.in === 'path');
        if (pathParams.length > 0) {
            // 生成path类型
        }
        // "parameters": [
        //   {
        //     "in": "body",
        //     "name": "modifyDIO",
        //     "description": "modifyDIO",
        //     "required": true,
        //     "schema": {
        //       "$ref": "#/definitions/CrpCooperationModifyDIO对象"
        //     }
        //   }
        // ],
        const bodyParams = params.filter((item) => item.in === 'body');
        if (bodyParams.length > 0) {
            // 生成body类型
            const definitionKey = (_b = (_a = bodyParams[0].schema) === null || _a === void 0 ? void 0 : _a.$ref) === null || _b === void 0 ? void 0 : _b.replace('#/definitions/', '');
            return definitionKey
                ? this.generateDefinitionFile(definitionKey)
                : undefined;
        }
        return;
    }
}
function createNoApi(config) {
    if (!(config === null || config === void 0 ? void 0 : config.swUrl)) {
        (0, tools_js_1.exitWithError)('请检查是否正确配置了swUrl地址！');
    }
    return new NoApi(config);
}
exports.createNoApi = createNoApi;
/**
 * 定义配置
 * @param config
 * @returns
 */
function definedNoApiConfig(config) {
    return config;
}
exports.definedNoApiConfig = definedNoApiConfig;
