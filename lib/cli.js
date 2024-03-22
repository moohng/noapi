#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
commander_1.program
    .version('1.0.0')
    .description('欢迎使用 NoAPI，使用 npx noapi [docsOrUrl] [outDir] 立即体验！');
commander_1.program
    .command('run [docsUrl] [outDir]', { isDefault: true })
    .option('-u, --urls <urls>', '指定生成api的url，以逗号分隔')
    .description('生成api函数，必须提供一个swagger文档地址')
    .action((docsUrl, outDir, options) => {
    console.log('Hello, world!');
});
commander_1.program.parse(process.argv);
