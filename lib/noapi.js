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
exports.createNoApi = void 0;
/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 18:18:22
 * @LastEditTime: 2024-03-21 16:41:58
 * @LastEditors: mohong@zmn.cn
 * @Description: 入口函数
 */
const path_1 = __importDefault(require("path"));
const api_1 = require("./core/api");
class NoApi {
    constructor(config) {
        this.config = Object.assign(Object.assign({ outDir: path_1.default.resolve('/src/api') }, config), { definition: Object.assign({ outDir: path_1.default.resolve('/src/definition') }, config.definition) });
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
            if (this.config.swUrl) {
                yield this.fetchDataSource();
            }
            // 解析数据
            if (this.config.swJson) {
            }
            else {
                console.error('未配置数据源');
                return;
            }
            (0, api_1.generateBatch)(this.paths, this.definitions, this.config);
        });
    }
    /**
     * 根据URL生成api函数
     * @param urls
     */
    generateByUrls(urls) {
        console.log('开始生成api函数...');
        urls.forEach(url => {
            const apiCollections = this.paths[url];
            (0, api_1.generateApiFile)(url, apiCollections, this.definitions, this.config);
        });
    }
    fetchDataSource() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
function createNoApi(config) {
    return new NoApi(config);
}
exports.createNoApi = createNoApi;
