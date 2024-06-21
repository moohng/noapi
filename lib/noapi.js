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
 * @LastEditTime: 2024-06-21 14:46:57
 * @LastEditors: mohong@zmn.cn
 * @Description: 入口函数
 */
const path_1 = __importDefault(require("path"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const api_js_1 = require("./utils/api.js");
const definition_js_1 = require("./utils/definition.js");
const tools_js_1 = require("./utils/tools.js");
class NoApi {
    constructor(config) {
        this.apis = [];
        // 待生成的类型定义
        this.defTodo = new Set();
        // 已生成的类型Key，避免重复生成
        this.defKeyDone = new Set();
        this.generatedResult = [];
        if (!config.swUrl && !config.swFile && !config.swJson) {
            (0, tools_js_1.exitWithError)('请提供有效的swagger文档地址或接口文档路径！');
        }
        this.config = Object.assign(Object.assign({ outDir: path_1.default.resolve('src/api') }, config), { definition: Object.assign({ outDir: path_1.default.resolve('src/model') }, config.definition) });
    }
    get swJson() {
        return this.config.swJson;
    }
    /**
     * 根据URL生成api函数
     * @param urls
     */
    generateByUrls(urls) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!((_a = this.apis) === null || _a === void 0 ? void 0 : _a.length)) {
                yield this.listApi();
            }
            console.log('开始生成api函数...');
            try {
                if (Array.isArray(urls)) {
                    urls.forEach((item) => __awaiter(this, void 0, void 0, function* () {
                        const { sourceCode, fullFilePath } = yield this.generateApiCode(item.url ? item : { url: item });
                        (0, tools_js_1.appendToFile)(fullFilePath, sourceCode);
                    }));
                }
                else {
                    const { url, filePath, funcName, method } = urls;
                    const { sourceCode, fullFilePath } = yield this.generateApiCode({ url, filePath, funcName, method });
                    (0, tools_js_1.appendToFile)(fullFilePath, sourceCode);
                }
            }
            catch (error) {
                console.error(error);
            }
            console.log('开始生成类型定义...');
            [...this.defTodo].forEach((defKey) => __awaiter(this, void 0, void 0, function* () {
                if (typeof defKey === 'string') {
                    yield this.generateDefinitionCode(defKey);
                }
                else {
                    yield this.generateQueryCode(defKey.parameters, defKey.name);
                }
                this.generatedResult.forEach((result) => {
                    if (result) {
                        const { sourceCode, filePath, typeName, outDir } = result;
                        (0, tools_js_1.writeToFile)(filePath, sourceCode);
                        (0, definition_js_1.writeToIndexFile)(typeName, outDir);
                    }
                });
            }));
            this.defTodo.clear();
        });
    }
    /**
     * 根据定义Key生成类型文件
     * @param defs
     */
    generateByDefs(defs, alias) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!((_a = this.apis) === null || _a === void 0 ? void 0 : _a.length)) {
                yield this.listApi();
            }
            console.log('开始生成类型定义...');
            defs.forEach((defKey, index) => {
                this.generateDefinitionCode(defKey, alias === null || alias === void 0 ? void 0 : alias[index]);
            });
        });
    }
    /**
     * 列出Api接口信息
     */
    listApi(urls) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.config.swJson) {
                yield this.fetchDataSource();
            }
            const paths = (_a = this.config.swJson) === null || _a === void 0 ? void 0 : _a.paths;
            if (!paths) {
                console.log('没有找到api！');
                return;
            }
            urls = urls || Object.keys(paths);
            const apis = [];
            for (const url of urls) {
                const apiCollections = paths[url];
                if (!apiCollections) {
                    break;
                }
                const tempApis = Object.keys(apiCollections).map((method) => {
                    var _a;
                    const api = apiCollections[method];
                    return {
                        url,
                        tag: (_a = api.tags) === null || _a === void 0 ? void 0 : _a.join('；'),
                        title: api.summary || url,
                        method: method.toUpperCase(),
                        parameters: JSON.stringify(api.parameters),
                        responses: JSON.stringify(api.responses),
                    };
                });
                apis.push(...tempApis);
            }
            this.apis = apis;
            return apis;
        });
    }
    // 私有函数
    /**
     * 获取数据源
     */
    fetchDataSource() {
        return __awaiter(this, void 0, void 0, function* () {
            const { swUrl, swFile, cookie } = this.config;
            if (swUrl) {
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
            }
            else if (swFile) {
                console.log('开始读取api数据源...');
                const swJson = require(swFile);
                if (!swJson.swagger) {
                    (0, tools_js_1.exitWithError)('请提供有效的swagger文档路径！');
                }
                this.config.swJson = swJson;
                console.log('读取api数据源成功');
            }
            return this.config.swJson;
        });
    }
    /**
     * 生成api方法
     * @param url
     */
    generateApiCode(_a) {
        return __awaiter(this, arguments, void 0, function* ({ url, method: onlyMethod, filePath, funcName, }) {
            const apiCollections = this.config.swJson.paths[url];
            if (!apiCollections) {
                (0, tools_js_1.exitWithError)(`${url} 不存在！`);
            }
            if (onlyMethod && !apiCollections[onlyMethod = onlyMethod.toLowerCase()]) {
                (0, tools_js_1.exitWithError)(`${url} 的 ${onlyMethod} 方法不存在！`);
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
            const fullFilePath = path_1.default.join(dirPath, `${fileName}.ts`);
            let codeStr = '';
            if (!(yield (0, tools_js_1.checkExists)(fullFilePath))) {
                // await fs.mkdir(dirPath, { recursive: true });
                codeStr =
                    fileHeader ||
                        `import { request } from '@/utils/request';\nimport * as models from '@/model';\n`;
            }
            const methodKeys = Object.keys(apiCollections);
            methodKeys.forEach((method) => {
                var _a, _b, _c;
                if (onlyMethod && method !== onlyMethod) {
                    return;
                }
                const api = apiCollections[method];
                // 入参
                if (api.parameters) {
                    this.defTodo.add({
                        name: '', // TODO:如何命名？
                        parameters: api.parameters,
                    });
                }
                // 出参
                let resRef = (_c = (_b = (_a = api.responses) === null || _a === void 0 ? void 0 : _a[200]) === null || _b === void 0 ? void 0 : _b.schema) === null || _c === void 0 ? void 0 : _c.$ref;
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
          export function ${name}(${paramStr}) {
            return request<${resStr}>({ url: '${url}',${paramStr ? ' data,' : ''} method: '${method}' });
          }
        `;
                    if (comment) {
                        apiFuncStr = `
          /**
           * ${comment || ''}
           */` + apiFuncStr;
                    }
                }
                if (typeof transformApi === 'function') {
                    apiFuncStr = transformApi(apiFuncStr, apiContext);
                }
                codeStr += apiFuncStr;
            });
            console.log('===== [api]', fullFilePath, '\n');
            return { sourceCode: yield (0, tools_js_1.codeFormat)(codeStr), fileName, filePath, fullFilePath };
        });
    }
    /**
     * 生成类型定义
     * @param definitionKey
     * @param aliasName
     * @returns
     */
    generateDefinitionCode(definitionKey, aliasName) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const keepOuter = false;
            if (!keepOuter) {
                definitionKey = ((_a = definitionKey.match(/«(.+)»/)) === null || _a === void 0 ? void 0 : _a[1]) || definitionKey;
            }
            const definitionCollection = this.config.swJson.definitions[definitionKey];
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
            this.defKeyDone.add(definitionKey);
            // 拼接代码
            let codeStr = `export default interface ${objName} {\n  // @NOAPI[${definitionKey}]\n`;
            if (objDesc) {
                codeStr = `/** ${objDesc} */\n${codeStr}`;
            }
            let genericIndex = -1;
            const refList = [];
            const genericTypes = [];
            // 遍历属性
            Object.keys(properties).forEach((propKey) => __awaiter(this, void 0, void 0, function* () {
                var _b, _c;
                // 定义属性
                const property = properties[propKey];
                let tsType;
                // 引用类型，递归生成
                const hasRef = property.$ref || ((_b = property.items) === null || _b === void 0 ? void 0 : _b.$ref);
                if (hasRef) {
                    const subDefinitionKey = hasRef.replace('#/definitions/', '');
                    // FIXME: 可能造成死循环
                    console.log('递归生成', this.defKeyDone, subDefinitionKey, this.defKeyDone.has(subDefinitionKey));
                    if (this.defKeyDone.has(subDefinitionKey)) {
                        tsType = (0, tools_js_1.parseToTsType)(property).replace('models.', '');
                    }
                    else {
                        yield this.generateDefinitionCode(subDefinitionKey);
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
                        tsType += ((_c = property.items) === null || _c === void 0 ? void 0 : _c.$ref) ? '[]' : '';
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
            }));
            codeStr += '}\n';
            // 是否有泛型
            if (genericTypes.length > 0) {
                codeStr = codeStr.replace(`interface ${objName}`, `interface ${objName}<${genericTypes.join(', ')}>`);
            }
            console.log('===== [model]', filePath);
            this.generatedResult.push({
                sourceCode: yield (0, tools_js_1.codeFormat)(codeStr),
                typeName: objName,
                fileName: objName,
                filePath,
                outDir,
            });
        });
    }
    generateQueryCode(params, name) {
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
                ? this.generateDefinitionCode(definitionKey)
                : undefined;
        }
        return;
    }
}
function createNoApi(config) {
    if (!(config === null || config === void 0 ? void 0 : config.swUrl) && !(config === null || config === void 0 ? void 0 : config.swFile)) {
        (0, tools_js_1.exitWithError)('swUrl和swFile至少配置一个！');
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
