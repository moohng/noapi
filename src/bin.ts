import path from 'path';
import apiDocs from './apiDocs.json';
import generateDefinitions from './generateDefinition';
import generateApi from './generateApi';

export {
  generateDefinitions,
  generateApi,
}

generateDefinitions(apiDocs.definitions, {
  outDir: path.resolve('definitions'),
  exclude: ['VO', /^AMIS/],
});

// @ts-ignore
generateApi(apiDocs.paths, {
  outDir: path.resolve('api'),
});