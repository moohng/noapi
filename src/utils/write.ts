import path from 'path';
import fs from 'fs/promises';

/**
 * 检查文件或目录是否存在
 * @param path 
 * @returns 
 */
export async function checkExists(path: string): Promise<boolean> {
  try {
    await fs.stat(path);
    return true; // 文件或目录存在
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false; // 文件或目录不存在
    }
    throw error; // 如果是其他错误，抛出该错误
  }
}

/**
 * 写入文件
 * @param filePath 
 * @param content 
 */
export async function writeToFile(filePath: string, content: string) {
  // 创建输出文件
  const exists = await checkExists(path.dirname(filePath));
  if (!exists) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
  }

  // 生成文件
  return fs.writeFile(filePath, content, 'utf8');
}

/**
 * 追加内容到文件
 * @param filePath 
 * @param content 
 * @returns 
 */
export async function appendToFile(filePath: string, content: string) {
  // 创建输出文件
  const exists = await checkExists(filePath);
  if (!exists) {
    return writeToFile(filePath, content);
  }

  // 追加内容
  return fs.appendFile(filePath, content, 'utf8');
}

/**
 * 写入到index.ts
 * @param typeName 
 * @param outDir 
 * @returns 
 */
export async function writeToIndexFile(typeName: string, outDir: string, filePath?: string) {

  const defFilePath = path.join(outDir, 'index.ts');

  let relativePath = filePath? path.relative(outDir, path.dirname(filePath)) : `.`;
  if (!relativePath.startsWith('.')) {
    relativePath = relativePath ? `./${relativePath}` : '.';
  }

  // 新建
  if (!await checkExists(defFilePath)) {
    await fs.mkdir(path.dirname(defFilePath), { recursive: true });
    await fs.writeFile(defFilePath, `export { default as ${typeName} } from '${relativePath}/${typeName}';\n`);

    return defFilePath;
  }

  let defFileContent = await fs.readFile(defFilePath, 'utf-8');
  // 判断是否已经导入
  if (defFileContent.indexOf('as ' + typeName + ' ') === -1) {
    // 追加
    await fs.appendFile(defFilePath, `export { default as ${typeName} } from '${relativePath}/${typeName}';\n`);
  }

  return defFilePath;
}
