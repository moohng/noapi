#!/usr/bin/env node

import path from 'path';
import { program } from 'commander';
import { cosmiconfigSync } from 'cosmiconfig';
import { createNoApi } from './noapi.js';

program
  .version('1.0.0')
  .description('欢迎使用 NoAPI，使用 npx noapi <urls...> 立即体验！');

program
  .command('api <urls>', { isDefault: true }) // <urls...> 可以解析成一个数组
  .description('生成api函数，url路径不能以/开头')
  .option('-c, --cookie <cookie>', 'url的授权cookie')
  .option('-s, --sw-url <swUrl>', '指定swagger文档地址')
  .option('-o, --out-dir <outDir>', '指定swagger文档地址')
  .action(async (urls, options) => {
    console.log('开始运行...', urls, options);

    const config = mergeConfig(options);

    const noapi = createNoApi(config);
  
    await noapi.generateByUrls(urls.split(',').map((url: string) => `/${url}`));
  });

program
  .command('def <defs> <alias>')
  .description('生成类型定义，必须是完整名称，以逗号分隔')
  .option('-c, --cookie <cookie>', 'url的授权cookie')
  .option('-s, --sw-url <swUrl>', '指定swagger文档地址')
  .option('-o, --out-dir <outDir>', '指定swagger文档地址')
  .action(async (defs: string, alias: string, options) => {
    console.log('开始运行...', defs, options);

    const config = mergeConfig(options);

    const noapi = createNoApi(config);

    await noapi.generateByDefs(defs.split(','), alias.split(','));
  });

program.parse(process.argv);

function mergeConfig(options: any) {
  const explorerSync = cosmiconfigSync('noapi');
  const searchedFor = explorerSync.search();

  const config = {
    ...(searchedFor?.config || {}),
    ...options,
  };

  if (!config.swUrl) {
    throw new Error('请配置 swagger 文档地址');
  }

  return config;
}