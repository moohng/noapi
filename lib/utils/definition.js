"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBatch = exports.writeToIndexFile = exports.GENERIC_TYPE_NAMES = void 0;
/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-19 11:45:05
 * @LastEditTime: 2024-04-07 17:20:12
 * @LastEditors: mohong@zmn.cn
 * @Description: 生成类型定义文件
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
exports.GENERIC_TYPE_NAMES = ['T', 'K', 'U', 'V'];
/**
 * 写入到index.ts
 * @param objName
 * @param outDir
 * @returns
 */
function writeToIndexFile(objName, outDir) {
    const defFilePath = path_1.default.join(outDir, 'index.ts');
    // 新建
    if (!fs_1.default.existsSync(defFilePath)) {
        fs_1.default.writeFileSync(defFilePath, `export { default as ${objName} } from './${objName}';\n`);
        return defFilePath;
    }
    let defFileContent = fs_1.default.readFileSync(defFilePath, 'utf-8');
    // 判断是否已经导入
    if (defFileContent.indexOf(objName) === -1) {
        // 追加
        fs_1.default.appendFileSync(defFilePath, `export { default as ${objName} } from './${objName}';\n`);
    }
    return defFilePath;
}
exports.writeToIndexFile = writeToIndexFile;
/**
 * 批量生成定义文件
 * @param {SWDefinitionCollections} definitions
 * @param {GenerateDefinitionOptions} options
 */
function generateBatch(definitions, options) {
    console.time('生成类型定义文件耗时');
    const definitionKeys = Object.keys(definitions);
    let definitionTotal = 0;
    definitionKeys.forEach((objKey) => {
        // const result = generateDefinitionFile(objKey, definitions, options);
        // if (result) {
        //   // 统计数量
        //   definitionTotal++;
        //   // 写入到defs.d.ts文件
        //   writeToIndexFile(result.objName, result.outDir);
        // }
    });
    console.log(`===== 类型定义文件生成完毕，共：${definitionTotal} 个`);
    console.timeEnd('生成类型定义文件耗时');
}
exports.generateBatch = generateBatch;
