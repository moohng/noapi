"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBatch = exports.writeToIndexFile = exports.generateDefinitionFile = void 0;
/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-19 11:45:05
 * @LastEditTime: 2024-03-22 13:47:25
 * @LastEditors: mohong@zmn.cn
 * @Description: 生成类型定义文件
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
/**
 * 生成类型定义文件
 * @param definitionKey
 * @param definitionObj
 * @param options
 * @returns
 */
function generateDefinitionFile(definitionKey, definitionCollections, options) {
    // 对象名称
    let objName = (0, utils_1.formatObjName)(definitionKey);
    // 去掉泛型（尖括号里面的类型）
    const idx = objName.indexOf('<');
    if (idx > -1) {
        objName = objName.substring(0, idx);
    }
    const { required, properties, description: objDesc } = definitionCollections[definitionKey];
    const { outDir, include, exclude, match } = options;
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
    // 拼接代码 TODO:泛型处理
    let codeStr = `export default interface ${objName} {\n`;
    if (objDesc) {
        codeStr = `/** ${objDesc} */\n${codeStr}`;
    }
    // 遍历属性
    Object.keys(properties).forEach((propKey) => {
        var _a;
        // 定义属性
        const property = properties[propKey];
        // 引用类型，递归生成
        if (property.$ref || ((_a = property.items) === null || _a === void 0 ? void 0 : _a.$ref)) {
            const definitionKey = (property.$ref || property.items.$ref).replace('#/definitions/', '');
            const result = generateDefinitionFile(definitionKey, definitionCollections, options);
            if (result) {
                writeToIndexFile(result);
            }
        }
        const isRequired = required === null || required === void 0 ? void 0 : required.includes(propKey);
        const tsType = (0, utils_1.parseToTsType)(property);
        let propStr = `  ${propKey}${isRequired ? '' : '?'}: ${tsType};\n`;
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
    // 创建输出目录
    if (!fs_1.default.existsSync(outDir)) {
        fs_1.default.mkdirSync(outDir, { recursive: true });
    }
    // 生成文件
    fs_1.default.writeFileSync(filePath, codeStr);
    console.log(`----- 已生成 ${filePath} -----`);
    return { objName, fileName: objName, filePath, outDir };
}
exports.generateDefinitionFile = generateDefinitionFile;
function writeToIndexFile(result) {
    /**
     * 文件模板
     * import { RepairWorkDetailVO } from './RepairWorkDetailVO';
     *
     * declare global {
     *   namespace defs {
     *     export {
     *       RepairWorkDetailVO,
     *     };
     *   }
     * }
     */
    const { objName, outDir } = result;
    const defFilePath = path_1.default.join(outDir, 'index.ts');
    // const importMark = '/* --- import --- */';
    // const exportMark = '/* --- export --- */';
    // 新建
    if (!fs_1.default.existsSync(defFilePath)) {
        // fs.writeFileSync(
        //   defFilePath,
        //   `import { ${objName} } from './${objName}';\n${importMark}\n` +
        //     '\ndeclare global {\n  namespace defs {\n    export {\n' +
        //     `      ${objName},\n` +
        //     `      ${exportMark}\n` +
        //     '    };\n  }\n}'
        // );
        fs_1.default.writeFileSync(defFilePath, `export { default as ${objName} } from './${objName}';\n`);
        return defFilePath;
    }
    // 追加
    let defFileContent = fs_1.default.readFileSync(defFilePath, 'utf-8');
    // 判断是否已经导入
    if (defFileContent.indexOf(`import { ${objName} }`) === -1) {
        // defFileContent = defFileContent
        //   .replace(
        //     importMark,
        //     `import { ${objName} } from './${objName}';\n${importMark}`
        //   )
        //   .replace(exportMark, `${objName},\n      ${exportMark}`);
        // // 写入文件
        // fs.writeFileSync(defFilePath, defFileContent);
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
        const result = generateDefinitionFile(objKey, definitions, options);
        if (result) {
            // 统计数量
            definitionTotal++;
            // 写入到defs.d.ts文件
            writeToIndexFile(result);
        }
    });
    console.log(`----- 类型定义文件生成完毕，共：${definitionTotal} 个 -----`);
    console.timeEnd('生成类型定义文件耗时');
}
exports.generateBatch = generateBatch;
