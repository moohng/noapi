"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const noapi_js_1 = require("./noapi.js");
const tools_js_1 = require("./utils/tools.js");
const promises_1 = __importDefault(require("readline/promises"));
commander_1.program
    .version('1.0.0')
    .description('欢迎使用 NoAPI，使用 npx noapi api url1,url2... 立即体验！\n\
如果生成的api方法或类型文件有问题，建议使用-p参数查看接口相关信息，然后使用def命令手动生成类型定义。\n\
swUrl和outDir等相关参数建议写在配置文件noapi.config.js中。');
// api命令
commander_1.program
    .command('api [urls]', { isDefault: true }) // <urls...> 可以解析成一个数组
    .description('生成api函数，url路径不能以/开头')
    .option('-u, --sw-url <swUrl>', '指定swagger文档地址')
    .option('-c, --cookie <cookie>', 'url的授权cookie')
    .option('-o, --out-dir <outDir>', '指定api输出目录')
    .option('-l, --list [showList]', '查询api接口')
    .action((urls, options) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('开始运行...');
    const config = (0, tools_js_1.mergeConfig)(options);
    const noapi = (0, noapi_js_1.createNoApi)(config);
    urls = urls === null || urls === void 0 ? void 0 : urls.split(',').map((url) => `/${url}`);
    if (options.list) {
        const apis = yield noapi.listApi(urls);
        if (!(apis === null || apis === void 0 ? void 0 : apis.length)) {
            console.log('没有找到api！');
        }
        else {
            console.log(apis);
            console.log(`共找到${apis.length}条api`);
        }
        return;
    }
    if (!urls) {
        (0, tools_js_1.exitWithError)('请提供url地址');
    }
    yield noapi.generateByUrls(urls);
}));
// def命令
commander_1.program
    .command('def <defKeys> <alias>')
    .description('生成类型定义，defKeys可通过api命令加-l参数获取')
    .option('-u, --sw-url <swUrl>', '指定swagger文档地址')
    .option('-c, --cookie <cookie>', 'url的授权cookie')
    .option('-o, --out-dir <outDir>', '指定类型文件输出目录')
    .action((defKeys, alias, options) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('开始运行...');
    const { swUrl, cookie, outDir } = options;
    const config = (0, tools_js_1.mergeConfig)({ swUrl, cookie, definition: { outDir } });
    const noapi = (0, noapi_js_1.createNoApi)(config);
    yield noapi.generateByDefs(defKeys.split(','), alias.split(','));
}));
// 初始化配置命令
commander_1.program
    .command('init')
    .description('初始化配置文件')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    const rl = promises_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const swUrl = yield rl.question('请输入swagger文档地址(swUrl): ');
    const config = (0, tools_js_1.createConfig)(swUrl);
    rl.close();
    console.log(`配置文件${config}已生成，可自定义配置.`);
}));
commander_1.program.parse(process.argv);
