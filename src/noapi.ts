/*
 * @Author: mohong@zmn.cn
 * @Date: 2024-03-20 18:18:22
 * @LastEditTime: 2024-04-02 14:56:03
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

  async fetchDataSource(url = this.config.swUrl, cookie = this.config.cookie) {
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