#!/usr/bin/env node

import path from 'path';
import { program } from 'commander';
import { createNoApi } from './noapi.js';

program
  .version('1.0.0')
  .description('欢迎使用 NoAPI，使用 npx noapi [docsOrUrl] [outDir] 立即体验！');

program
  .command('run [docsUrl] [outDir]', { isDefault: true })
  .option('-u, --urls <urls>', '指定生成api的url，以逗号分隔')
  .option('-c, --cookie <cookie>', 'url的授权cookie')
  .description('生成api函数，必须提供一个swagger文档地址')
  .action(async (docsUrl, outDir, options) => {
    console.log('开始运行...', docsUrl, outDir, options);

    const noapi = createNoApi({
      swUrl: docsUrl,
      cookie: options.cookie,
      outDir: path.resolve(outDir),
      definition: {
        outDir: path.resolve('testOutput/model'),
        // exclude: ['VO', /AMISResponseDTO/, /PageBody/, /SelectOptionQuery对象/],
      },
    });

    // noapi.fetchDataSource();
  
    await noapi.generateByUrls(['/bfm-crp/base/engineer/listServSkill', '/bfm-crp/base/engineer/modifySkill', '/bfm-crp/base/engineer/addEngineerSkills']);
  });

program.parse(process.argv);