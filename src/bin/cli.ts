import { program } from 'commander';
import { createNoApi } from '../noapi.js';
import { createConfig, exitWithError, mergeConfig, writeToFile } from '../utils/tools.js';
import * as readline from 'readline/promises';
import path from 'path';

program
  .version('1.0.0')
  .description(
    '欢迎使用 NoAPI，使用 npx noapi api url1,url2... 立即体验！\n\
如果生成的api方法或类型文件有问题，建议使用-p参数查看接口相关信息，然后使用def命令手动生成类型定义。\n\
swUrl和outDir等相关参数建议写在配置文件noapi.config.js中。'
  );

// api命令
program
  .command('api [urls]', { isDefault: true }) // <urls...> 可以解析成一个数组
  .description('生成api函数，url路径不能以/开头')
  .option('-u, --sw-url <swUrl>', '指定swagger文档地址')
  .option('-c, --cookie <cookie>', 'url的授权cookie')
  .option('-o, --out-dir <outDir>', '指定api输出目录')
  .option('-l, --list [showList]', '查询api接口')
  .action(async (urls, options) => {
    console.log('开始运行...');

    const config = mergeConfig(options);

    const noapi = createNoApi(config);

    urls = urls?.split(',').map((url: string) => `/${url}`);

    if (options.list) {
      const apis = await noapi.listApi(urls);
      if (!apis?.length) {
        console.log('没有找到api！');
      } else {
        console.log(apis);
        console.log(`共找到${apis.length}条api`);
      }
      return;
    }

    if (!urls) {
      exitWithError('请提供url地址');
    }

    await noapi.generateByUrls(urls);
  });

// def命令
program
  .command('def <defKeys> <alias>')
  .description('生成类型定义，defKeys可通过api命令加-l参数获取')
  .option('-u, --sw-url <swUrl>', '指定swagger文档地址')
  .option('-c, --cookie <cookie>', 'url的授权cookie')
  .option('-o, --out-dir <outDir>', '指定类型文件输出目录')
  .action(async (defKeys: string, alias: string, options) => {
    console.log('开始运行...');

    const { swUrl, cookie, outDir } = options;
    const config = mergeConfig({ swUrl, cookie, definition: { outDir } });

    const noapi = createNoApi(config);

    await noapi.generateByDefs(defKeys.split(','), alias.split(','));
  });

// 初始化配置命令
program
  .command('init')
  .description('初始化配置文件')
  .action(async () => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const swUrl = await rl.question('请输入swagger文档地址(swUrl): ');
    const config = createConfig(swUrl);
    rl.close();

    console.log(`配置文件${config}已生成，可自定义配置.`);
  });

// 更新文档
program
  .command('update')
  .description('更新swagger文档')
  .option('-u, --sw-url <swUrl>', '指定swagger文档地址')
  .option('-c, --cookie <cookie>', 'url的授权cookie')
  .action(async (options) => {
    console.log('开始运行...');

    const config = mergeConfig(options);

    const noapi = createNoApi(config);

    const result = await noapi.fetchDataSource();

    const swFilePath = path.resolve(config.swFile || 'noapi-swagger-doc.json');
    await writeToFile(swFilePath, JSON.stringify(result, null, 2));

    console.log('文档更新成功！');
  });

program.parse(process.argv);
