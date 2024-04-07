/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 18:18:22
 * @LastEditTime: 2024-04-07 16:10:56
 * @LastEditors: mohong@zmn.cn
 * @Description: 入口函数
 */
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import { ApiOptions, SWPathApiCollections, generateApiFile, generateBatch } from './core/api.js';
import { GENERIC_TYPE_NAMES, GenerateDefinitionResult, SWDefinitionCollections, writeToIndexFile } from './core/definition.js';
import { formatObjName, parseToTsType } from './utils.js';

interface SWJson {
  swagger: string;
  info: { title: string };
  host: string;
  basePath?: string;
  tags: Array<{ name: string; description: string }>;
  paths: SWPathApiCollections;
  definitions: SWDefinitionCollections;
}

interface NoApiConfig extends ApiOptions {
  swUrl?: string;
  cookie?: string;
  swJson?: SWJson;
}

class NoApi {
  private config: NoApiConfig;

  constructor(config: NoApiConfig) {
    this.config = {
      outDir: path.resolve('/src/api'),
      ...config,
      definition: {
        outDir: path.resolve('/src/definition'),
        ...config.definition,
      },
    };
  }

  get paths() {
    return this.config.swJson?.paths;
  }

  get definitions() {
    return this.config.swJson?.definitions;
  }

  /**
   * 全量生成所有api函数（适用于：初始化、重构项目时）
   * @returns 
   */
  async auto() {
    // 获取数据
    if (this.config.swUrl) {
      await this.fetchDataSource();
    }

    // 解析数据
    if (this.config.swJson) {
      
    } else {
      console.error('未配置数据源');
      return;
    }

    generateBatch(this.paths!, this.definitions!, this.config);
  }

  /**
   * 根据URL生成api函数
   * @param urls 
   */
  async generateByUrls(urls: string[]) {
    if (this.config.swUrl) {
      await this.fetchDataSource();
    }

    if (!this.config.swJson) {
      return;
    }

    console.log('开始生成api函数...');

    urls.forEach(url => {
      const apiCollections = this.paths![url];
      generateApiFile(url, apiCollections, this.definitions!, this.config);
    });
  }

  private async fetchDataSource(url = this.config.swUrl, cookie = this.config.cookie) {
    if (!url) {
      console.error('未配置数据源');
      return;
    }

    console.log('开始获取数据源...');
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json', 'Cookie': cookie || '' } });
    
    try {
      this.config.swJson = await res.json() as SWJson;
      console.log('数据源获取成功');
    } catch (error) {
      console.error('数据源获取失败，请登录', error);
    }
  }

  /**
   * 根据定义Key生成类型文件
   * @param defs 
   */
  async generateByDefs(defs: string[], alias?: string[]) {
    if (this.config.swUrl) {
      await this.fetchDataSource();
    }

    if (!this.config.swJson) {
      return;
    }

    console.log('开始生成类型定义...');

    defs.forEach((defKey, index) => {
      this.generateDefinitionFile(defKey, alias?.[index]);
    });
  }

  private generateDefinitionFile(definitionKey: string, aliasName?: string): GenerateDefinitionResult | undefined {
    const definitionCollections = this.definitions!;
    const options = this.config.definition!;

    const keepOuter = false;
    if (!keepOuter) {
      definitionKey = definitionKey.match(/«(.+)»/)?.[1] || definitionKey;
    }
  
    // 忽略一些类型：List等
    ['List'].forEach(ignoreType => {
      definitionKey = definitionKey.match(new RegExp(`${ignoreType}«(.+)»`))?.[1] || definitionKey;
    });
  
    // 对象名称
    let objName = aliasName || formatObjName(definitionKey);
  
    // 去掉泛型（尖括号里面的类型）
    const idx = objName.indexOf('<');
    if (idx > -1) {
      objName = objName.substring(0, idx);
    }
  
    const { required, properties, description: objDesc } = definitionCollections[definitionKey] || {};
    const { outDir, include, exclude, match } = options;
  
    const filePath = path.join(outDir, `${objName}.ts`);
  
    // 过滤一些不合法类型
    if (
      !objName ||
      !properties ||
      /^[a-z]/.test(objName) ||
      exclude?.some((item) =>
        item instanceof RegExp ? item.test(definitionKey) : item === objName
      ) ||
      (include &&
        !include.some((item) =>
          item instanceof RegExp ? item.test(definitionKey) : item === objName
        )) ||
      (match && !match.test(definitionKey))
    ) {
      return;
    }
  
    // 拼接代码
    let codeStr = `export default interface ${objName} {\n`;
    if (objDesc) {
      codeStr = `/** ${objDesc} */\n${codeStr}`;
    }
  
    let genericIndex = -1;
    const refList: string[] = [];
    const genericTypes: string[] = [];
  
    // 遍历属性
    Object.keys(properties).forEach((propKey) => {
      // 定义属性
      const property = properties[propKey];
  
      let tsType;
  
      // 引用类型，递归生成
      const hasRef = property.$ref || property.items?.$ref;
      if (hasRef) {
        const subDefinitionKey = hasRef.replace('#/definitions/', '');
        if (definitionKey === subDefinitionKey) {
          tsType = parseToTsType(property).replace('models.', '');
        } else {
          if (definitionKey !== subDefinitionKey) {
            this.generateDefinitionFile(subDefinitionKey);
          }
  
          if (!refList.includes(hasRef)) {
            refList.push(hasRef);
            tsType = GENERIC_TYPE_NAMES[++genericIndex];
            genericTypes.push(tsType);
          } else {
            tsType = GENERIC_TYPE_NAMES[genericIndex];
          }
          tsType +=  property.items?.$ref ? '[]' : '';
        }
      } else {
        tsType = parseToTsType(property);
      }
  
      const isRequired = required?.includes(propKey);
  
      let propStr = `  ${propKey}${isRequired ? '' : '?'}: ${tsType};\n`;
  
      // 添加注释
      const descriptionComment = property.description
        ? ` ${property.description} `
        : '';
      const minComment =
        property.minLength != null ? ` 最小长度：${property.minLength} ` : '';
      const maxComment =
        property.maxLength != null ? ` 最大长度：${property.maxLength} ` : '';
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
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
  
    // 生成文件
    fs.writeFileSync(filePath, codeStr);
  
    console.log('===== [model]', filePath);
  
    // 写入Index文件
    writeToIndexFile(objName, outDir);
  
    return { objName, fileName: objName, filePath, outDir };
  }
}

export function createNoApi(config: NoApiConfig) {
  return new NoApi(config);
}

/**
 * 定义配置
 * @param config 
 * @returns 
 */
export function definedNoApiConfig(config: NoApiConfig) {
  return config;
}