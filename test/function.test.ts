import { parseUrl, parseToTsType } from '../src/core/parse';
import { formatObjName } from '../src/utils/tools';

test('parseUrl：解析 url', () => {
  expect(parseUrl('/project/init/input')).toMatchObject({
    funcName: 'input',
    fileName: 'init',
    dirName: 'project',
    pathStrParams: [],
  });
  expect(parseUrl('/gitlab/groups/{groupId}/projects')).toMatchObject({
    funcName: 'projects',
    fileName: 'groups',
    dirName: 'gitlab',
    pathStrParams: ['groupId'],
  });
  expect(parseUrl('/:view')).toMatchObject({
    funcName: 'index',
    fileName: 'common',
    dirName: '',
    pathStrParams: ['view'],
  });
  expect(parseUrl('/gitlab/groups/:groupId/projects/{projectId}/merge_requests/:merge-requestId/commits')).toMatchObject({
    funcName: 'commits',
    fileName:'mergeRequests',
    dirName: 'gitlab/groups/projects',
    pathStrParams: ['groupId', 'projectId','mergeRequestId'],
  });
});

test('parseToTsType：解析到ts类型', () => {
  expect(parseToTsType('string')).toBe('string');
  expect(parseToTsType('integer')).toBe('number');
  expect(parseToTsType('int')).toBe('number');
  expect(parseToTsType('long')).toBe('number');
  expect(parseToTsType('float')).toBe('number');
  expect(parseToTsType('double')).toBe('number');
  expect(parseToTsType('number')).toBe('number');
  expect(parseToTsType('boolean')).toBe('boolean');
  expect(parseToTsType('object')).toBe('object');
  expect(parseToTsType('date', { date: 'Date'})).toBe('Date');
  expect(parseToTsType('date', { date: 'string'})).toBe('string');
  expect(parseToTsType('date', { Integer: 'number'})).toBe('any');

  expect(parseToTsType({ type: 'string' })).toBe('string');
  expect(parseToTsType({ type: 'Date' } as any, { Date: 'string' })).toBe('string');
  expect(parseToTsType({ type: 'array', items: { type:'string' } })).toBe('string[]');
  expect(parseToTsType({ type: 'array', items: { $ref: '#/definitions/response.ExecDetailDRO' } })).toBe('ExecDetailDRO[]');
  expect(parseToTsType({ $ref: '#/definitions/response.ExecDetailDRO' })).toBe('ExecDetailDRO');
});

test('formatObjName：格式化对象名称', () => {
  expect(formatObjName('com.xxx.common.dto2.ResponseDTO«List«ActivityListVO对象»»')).toBe('ResponseDTO<List<ActivityListVO>>');
  expect(formatObjName('com.xxx.common.dto2.ResponseDTO«com.xxx.bff.crp.matter.common.dro.aftersales.order.SubmitAftersaleDRO»')).toBe('ResponseDTO<SubmitAftersaleDRO>');
  expect(formatObjName('response.申请详情对象')).toBe('申请详情对象');
  expect(formatObjName('response.申请详情对象ApplyDetailDTO')).toBe('ApplyDetailDTO');
});
