/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 18:18:22
 * @LastEditTime: 2024-03-21 16:41:58
 * @LastEditors: mohong@zmn.cn
 * @Description: 入口函数
 */
import path from 'path';
import { ApiOptions, SWPathApiCollections, generateApiFile, generateBatch } from './core/api';
import { SWDefinitionCollections } from './core/definition';

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
  swJson?: SWJson;
  /** 是否覆盖：如果已存在URL对应的api函数，默认不新建（false）；为true时始终新建 */
  force?: boolean;
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
  generateByUrls(urls: string[]) {
    console.log('开始生成api函数...');

    urls.forEach(url => {
      const apiCollections = this.paths![url];
      generateApiFile(url, apiCollections, this.definitions!, this.config);
    });
  }

  async fetchDataSource() {}
}

export function createNoApi(config: NoApiConfig) {
  return new NoApi(config);
}
