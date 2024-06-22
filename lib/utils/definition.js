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
exports.writeToIndexFile = exports.GENERIC_TYPE_NAMES = void 0;
/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-19 11:45:05
 * @LastEditTime: 2024-06-22 14:53:07
 * @LastEditors: mohong@zmn.cn
 * @Description: 生成类型定义文件
 */
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const __1 = require("..");
exports.GENERIC_TYPE_NAMES = ['T', 'K', 'U', 'V'];
/**
 * 写入到index.ts
 * @param typeName
 * @param outDir
 * @returns
 */
function writeToIndexFile(typeName, outDir, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const defFilePath = path_1.default.join(outDir, 'index.ts');
        let relativePath = filePath ? path_1.default.relative(outDir, path_1.default.dirname(filePath)) : `.`;
        if (!relativePath.startsWith('.')) {
            relativePath = `./${relativePath}`;
        }
        // 新建
        if (!(yield (0, __1.checkExists)(defFilePath))) {
            yield promises_1.default.writeFile(defFilePath, `export { default as ${typeName} } from '${relativePath}/${typeName}';\n`);
            return defFilePath;
        }
        let defFileContent = yield promises_1.default.readFile(defFilePath, 'utf-8');
        // 判断是否已经导入
        if (defFileContent.indexOf(typeName) === -1) {
            // 追加
            yield promises_1.default.appendFile(defFilePath, `export { default as ${typeName} } from '${relativePath}/${typeName}';\n`);
        }
        return defFilePath;
    });
}
exports.writeToIndexFile = writeToIndexFile;
