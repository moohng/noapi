"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.upperFirst = exports.parsePathParams = exports.checkExists = exports.appendToFile = exports.writeToFile = exports.codeFormat = exports.createConfig = exports.exitWithError = exports.mergeConfig = exports.loadConfig = exports.defPrefix = exports.isBaseType = exports.upperFirstLatter = exports.parseToTsType = exports.formatObjName = void 0;
/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 09:45:06
 * @LastEditTime: 2024-06-22 16:52:27
 * @LastEditors: mohong@zmn.cn
 * @Description: 工具函数
 */
const cosmiconfig_1 = require("cosmiconfig");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const prettier = __importStar(require("prettier"));
/**
 * 去掉后端对象名中的非法字符
 * 比如：com.zmn.common.dto2.ResponseDTO«List«ActivityListVO对象»»     ======>     List<ActivityListVO>
 * com.zmn.common.dto2.ResponseDTO«com.zmn.bff.crp.matter.common.dro.aftersales.order.SubmitAftersaleDRO»    ======>      SubmitAftersaleDRO
 * @param objName
 * @param keepOuter
 */
function formatObjName(objName, keepOuter = false) {
    var _a;
    // 去掉包名 com.zmn.common.dto2.  、非法字符
    let name = objName.replace(/\w+(\.|\/)/g, '').replace(/«/g, '<').replace(/»/g, '>').replace(/[^0-9a-zA-Z<>]+/g, '');
    // 是否保留最外层对象
    if (!keepOuter) {
        name = ((_a = name.match(/<(.+)>/)) === null || _a === void 0 ? void 0 : _a[1]) || name;
    }
    return name;
}
exports.formatObjName = formatObjName;
/**
 * 解析属性类型
 * @param {SWDefinitionProperty} property
 * @returns
 */
function parseToTsType(property) {
    if (typeof property !== 'string') {
        // 数组类型
        if ((property === null || property === void 0 ? void 0 : property.type) === 'array') {
            const subType = property.items ? parseToTsType(property.items) : 'any';
            return `${subType}[]`;
        }
        // 对象引用
        if (property === null || property === void 0 ? void 0 : property.$ref) {
            const name = formatObjName(property.$ref);
            return `models.${name}`;
        }
        property = property === null || property === void 0 ? void 0 : property.type;
    }
    const map = {
        string: 'string',
        integer: 'number',
        boolean: 'boolean',
        object: 'object',
    };
    return map[property] || 'any';
}
exports.parseToTsType = parseToTsType;
/**
 * 首字母大写
 * @param str
 */
function upperFirstLatter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
exports.upperFirstLatter = upperFirstLatter;
/**
 * 是否是基本类型
 * @param type
 */
function isBaseType(type) {
    return ['string', 'number', 'boolean', 'object', 'any', 'unknown'].includes(type);
}
exports.isBaseType = isBaseType;
/**
 * 对类型添加命名空间前缀，比如：AMISList<WorkItem> ===> models.AMISList<models.WorkItem>
 * @param type
 */
function defPrefix(type) {
    return isBaseType(type) ? type : type.replace(/\w+/g, (match) => {
        return isBaseType(match) ? match : `models.${match}`;
    });
}
exports.defPrefix = defPrefix;
/**
 * 加载配置项
 * @returns
 */
function loadConfig(configPath, loader) {
    const explorerSync = (0, cosmiconfig_1.cosmiconfigSync)('noapi', {
        loaders: loader && {
            '.cjs': loader,
            '.js': loader,
            noExt: loader,
        },
    });
    const searchedFor = explorerSync.search(configPath);
    return searchedFor === null || searchedFor === void 0 ? void 0 : searchedFor.config;
}
exports.loadConfig = loadConfig;
/**
 * 合并配置项
 * @param options
 * @returns
 */
function mergeConfig(options) {
    // 过滤掉空值
    options = Object.fromEntries(Object.entries(options).filter((item) => item[1] !== undefined));
    const config = Object.assign(Object.assign({}, (loadConfig() || {})), options);
    return config;
}
exports.mergeConfig = mergeConfig;
/**
 * 报错并退出
 * @param message
 */
function exitWithError(...messages) {
    console.error('Error:', ...messages);
    process.exit(1);
}
exports.exitWithError = exitWithError;
/**
 * 创建配置文件
 * @param url 接口文档地址
 * @param rootDir 项目根目录
 * @returns
 */
function createConfig(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, rootDir = process.cwd()) {
        const configFilePath = path_1.default.resolve(rootDir, 'noapi.config.js');
        if (yield checkExists(configFilePath)) {
            exitWithError('配置文件已存在！');
        }
        const fileHeader = `const { definedNoApiConfig } = require('@zmn/noapi');\n`;
        const defaultConfig = `{
    swUrl: '${url || 'https://test-api-crp-matter.xiujiadian.com/v2/api-docs?group=web'}',
    outDir: './src/api',
    definition: {
      outDir: './src/model',
    },
  }`;
        const configInput = yield codeFormat(`${fileHeader}\nmodule.exports = definedNoApiConfig(${defaultConfig});\n`);
        yield writeToFile(configFilePath, configInput);
        return configFilePath;
    });
}
exports.createConfig = createConfig;
/**
 * 格式化代码
 * @param code
 * @returns
 */
function codeFormat(code) {
    return __awaiter(this, void 0, void 0, function* () {
        const formatted = yield prettier.format(code, {
            parser: 'babel-ts',
            singleQuote: true,
            trailingComma: 'es5',
            printWidth: 150,
            endOfLine: 'auto',
        });
        return formatted;
    });
}
exports.codeFormat = codeFormat;
/**
 * 写入文件
 * @param filePath
 * @param content
 */
function writeToFile(filePath, content) {
    return __awaiter(this, void 0, void 0, function* () {
        // 创建输出文件
        const exists = yield checkExists(filePath);
        if (!exists) {
            yield promises_1.default.mkdir(path_1.default.dirname(filePath), { recursive: true });
        }
        // 生成文件
        return promises_1.default.writeFile(filePath, content, 'utf8');
    });
}
exports.writeToFile = writeToFile;
/**
 * 追加内容到文件
 * @param filePath
 * @param content
 * @returns
 */
function appendToFile(filePath, content) {
    return __awaiter(this, void 0, void 0, function* () {
        // 创建输出文件
        const exists = yield checkExists(filePath);
        if (!exists) {
            return writeToFile(filePath, content);
        }
        // 追加内容
        return promises_1.default.appendFile(filePath, content, 'utf8');
    });
}
exports.appendToFile = appendToFile;
/**
 * 检查文件或目录是否存在
 * @param path
 * @returns
 */
function checkExists(path) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield promises_1.default.stat(path);
            return true; // 文件或目录存在
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return false; // 文件或目录不存在
            }
            throw error; // 如果是其他错误，抛出该错误
        }
    });
}
exports.checkExists = checkExists;
/**
 * 解析路径参数
 * @param url
 * @returns
 */
function parsePathParams(url) {
    const params = url.match(/\/\{([a-zA-Z0-9]+)\}/g);
    if (params) {
        return params.map((item) => ({ name: item.replace(/\/|\{|\}/g, ''), required: true, type: 'string' }));
    }
    return [];
}
exports.parsePathParams = parsePathParams;
/**
 * 首字母大写
 * @param str
 * @returns
 */
function upperFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
exports.upperFirst = upperFirst;
