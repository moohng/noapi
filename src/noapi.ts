/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 18:18:22
 * @LastEditTime: 2024-03-21 10:04:06
 * @LastEditors: mohong@zmn.cn
 * @Description: 入口函数
 */
import path from 'path';
import { ApiOptions, SWPathApiCollections, generateBatch } from './core/api';
import { GenerateDefinitionOptions, SWDefinitionCollections } from './core/definition';

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
  definition?: GenerateDefinitionOptions;
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

    generateBatch(this.paths!, this.config);
  }

  generateByUrls(urls: string[]) {
    console.log('开始生成api函数...');

    // generateBatch(this.config);
  }

  async fetchDataSource() {}
}

export function createNoApi(config: NoApiConfig) {
  return new NoApi(config);
}
