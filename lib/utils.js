"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defPrefix = exports.isBaseType = exports.upperFirstLatter = exports.parseToTsType = exports.formatObjName = void 0;
/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 09:45:06
 * @LastEditTime: 2024-03-22 14:02:43
 * @LastEditors: mohong@zmn.cn
 * @Description: 工具函数
 */
/**
 * 去掉后端对象名中的非法字符
 * 比如：com.zmn.common.dto2.ResponseDTO«List«ActivityListVO对象»»     ======>     List<ActivityListVO>
 * com.zmn.common.dto2.ResponseDTO«com.zmn.bff.crp.matter.common.dro.aftersales.order.SubmitAftersaleDRO»    ======>      SubmitAftersaleDRO
 * @param objName
 * @param keepOuter
 */
function formatObjName(objName, keepOuter = false) {
    var _a;
    console.log('=====222===', objName);
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
        return `defs.${name}`;
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
 * 对类型添加命名空间前缀，比如：AMISList<WorkItem> ===> defs.AMISList<defs.WorkItem>
 * @param type
 */
function defPrefix(type) {
    return isBaseType(type) ? type : type.replace(/\w+/g, (match) => {
        return isBaseType(match) ? match : `defs.${match}`;
    });
}
exports.defPrefix = defPrefix;
