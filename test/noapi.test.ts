import { createNoApi } from '../src/noapi';

test('废弃 swagUrl 获取swagger文档', async () => {
  const noapi = createNoApi({
    swagUrl: 'http://192.168.91.20:8888/swagger/doc.json',
    swagSource: '',
  });

  const apiList = await noapi.listApi();
  expect(apiList.length).toBeGreaterThan(0);
  expect(apiList[0].url).toBeDefined();
});

test('通过 url 获取swagger文档', async () => {
  const noapi = createNoApi({
    swagUrl: 'http://192.168.91.20:8888/swagger/doc.json',
    swagSource: 'http://192.168.91.20:8888/swagger/doc.json',
  });

  const apiList = await noapi.listApi();
  expect(apiList.length).toBeGreaterThan(0);
  expect(apiList[0].url).toBeDefined();
});

test('通过自定义来源函数获取swagger文档', async () => {
  const noapi = createNoApi({
    swagSource: async () => {
      const res = await fetch('http://192.168.91.20:8888/swagger/doc.json');
      return await res.json();
    },
  });

  const apiList = await noapi.listApi();
  expect(apiList.length).toBeGreaterThan(0);
  expect(apiList[0].url).toBeDefined();
});
