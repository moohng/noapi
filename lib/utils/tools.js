"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConfig = exports.exitWithError = exports.mergeConfig = exports.loadConfig = exports.defPrefix = exports.isBaseType = exports.upperFirstLatter = exports.parseToTsType = exports.formatObjName = void 0;
/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 09:45:06
 * @LastEditTime: 2024-04-13 17:08:39
 * @LastEditors: mohong@zmn.cn
 * @Description: 工具函数
 */
const cosmiconfig_1 = require("cosmiconfig");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
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
    // 数组类型
    if (property.type === 'array') {
        const subType = property.items ? parseToTsType(property.items) : 'any';
        return `${subType}[]`;
    }
    // 对象引用
    if (property.$ref) {
        const name = formatObjName(property.$ref);
        return `models.${name}`;
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
function createConfig(url, rootDir = process.cwd()) {
    const configFilePath = path_1.default.resolve(rootDir, 'noapi.config.js');
    if (fs_1.default.existsSync(configFilePath)) {
        exitWithError('配置文件已存在！');
    }
    const fileHeader = `const path = require('path');\nconst { definedNoApiConfig } = require('@zmn/noapi');\n`;
    const defaultConfig = `{
  swUrl: '${url || 'https://test-api-crp-matter.xiujiadian.com/v2/api-docs?group=web'}',
  outDir: path.resolve('./src/api'),
  definition: {
    outDir: path.resolve('./src/model'),
  },
}`;
    fs_1.default.writeFileSync(configFilePath, `${fileHeader}\nmodule.exports = definedNoApiConfig(${defaultConfig});\n`);
    return configFilePath;
}
exports.createConfig = createConfig;
