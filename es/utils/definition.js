var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-19 11:45:05
 * @LastEditTime: 2024-06-24 10:54:10
 * @LastEditors: mohong@zmn.cn
 * @Description: 生成类型定义文件
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { checkExists } from '..';
export const GENERIC_TYPE_NAMES = ['T', 'K', 'U', 'V'];
/**
 * 写入到index.ts
 * @param typeName
 * @param outDir
 * @returns
 */
export function writeToIndexFile(typeName, outDir, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const defFilePath = path.join(outDir, 'index.ts');
        let relativePath = filePath ? path.relative(outDir, path.dirname(filePath)) : `.`;
        if (!relativePath.startsWith('.')) {
            relativePath = `./${relativePath}`;
        }
        // 新建
        if (!(yield checkExists(defFilePath))) {
            yield fs.writeFile(defFilePath, `export { default as ${typeName} } from '${relativePath}/${typeName}';\n`);
            return defFilePath;
        }
        let defFileContent = yield fs.readFile(defFilePath, 'utf-8');
        // 判断是否已经导入
        if (defFileContent.indexOf(typeName) === -1) {
            // 追加
            yield fs.appendFile(defFilePath, `export { default as ${typeName} } from '${relativePath}/${typeName}';\n`);
        }
        return defFilePath;
    });
}
