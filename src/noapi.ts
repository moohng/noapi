/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 18:18:22
 * @LastEditTime: 2024-03-29 15:12:28
 * @LastEditors: mohong@zmn.cn
 * @Description: 入口函数
 */
import path from 'path';
import fetch from 'node-fetch';
import { ApiOptions, SWPathApiCollections, generateApiFile, generateBatch } from './core/api.js';
import { SWDefinitionCollections } from './core/definition.js';

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
  async generateByUrls(urls: string[]) {
    if (this.config.swUrl) {
      await this.fetchDataSource();
    }

    console.log('开始生成api函数...');

    urls.forEach(url => {
      const apiCollections = this.paths![url];
      generateApiFile(url, apiCollections, this.definitions!, this.config);
    });
  }

  async fetchDataSource(url = this.config.swUrl) {
    if (!url) {
      console.error('未配置数据源');
      return;
    }

    console.log('开始获取数据源...');
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json', 'Cookie': 'Hm_lvt_e8002ef3d9e0d8274b5b74cc4a027d08=1710725179; Hm_lvt_b97569d26a525941d8d163729d284198=1710725179; CNZZDATA1281233788=336576676-1710725182-https%253A%252F%252Ftest-admin.xiujiadian.com%252F%7C1710725182; UM_distinctid=18e7341d78063c-02bda9b4f5a4dd-26001951-186a00-18e7341d7811154; cna=411dce7108354cc89bdd4c7f3899e03f; test.zmn.id=f37eeb2e-6fcd-43e8-b0e7-70c56f8c7af1; test3.zmn.id=e6546c84-7cfc-4e78-b8c8-55226d7a22c4; zmn_user=e468e4f1e8147bed55536a36a04ab5597d710466dead00c403576ab6ced15c91ac79c0474c328983cf542234ec838765; Hm_lpvt_e8002ef3d9e0d8274b5b74cc4a027d08=1711696058; Hm_lpvt_b97569d26a525941d8d163729d284198=1711696058' } });
    
    try {
      this.config.swJson = await res.json() as SWJson;
      console.log('数据源获取成功');
    } catch (error) {
      console.error('数据源获取失败', error);
    }
  }
}

export function createNoApi(config: NoApiConfig) {
  return new NoApi(config);
}
