import { createNoApi } from '../src/noapi';

// test('废弃 swagUrl 获取swagger文档', async () => {
//   const noapi = createNoApi({
//     swagUrl: 'http://192.168.91.20:8888/swagger/doc.json',
//     swagSource: '',
//   });

//   const apiList = await noapi.listApi();
//   expect(apiList.length).toBeGreaterThan(0);
//   expect(apiList[0].url).toBeDefined();
// });

// test('通过 url 获取swagger文档', async () => {
//   const noapi = createNoApi({
//     swagUrl: 'http://192.168.91.20:8888/swagger/doc.json',
//     swagSource: 'http://192.168.91.20:8888/swagger/doc.json',
//   });

//   const apiList = await noapi.listApi();
//   expect(apiList.length).toBeGreaterThan(0);
//   expect(apiList[0].url).toBeDefined();
// });

test('通过自定义来源函数获取swagger文档', async () => {
  const noapi = createNoApi({
    swagSource: () => new Promise((resolve) => {
      // 模拟异步获取数据
      setTimeout(() => {
        resolve({
          swagger: '2.0',
          info: {
            title: '测试API',
            version: '1.0.0',
          },
          paths: {
            '/test': {
              get: {
                responses: {
                  '200': {
                    description: 'success',
                  },
                },
              },
            },
          },
        });
      }, 1000);
    }),
  });

  const apiList = await noapi.listApi();
  expect(apiList).toHaveLength(1);
  expect(apiList[0].url).toBe('/test');
  expect(apiList[0].method).toBe('GET');
});
