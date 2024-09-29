import { createNoApi } from '../src/noapi';

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
