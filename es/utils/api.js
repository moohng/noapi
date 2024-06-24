/**
 * 跟进url获取相关名称
 * @param url
 * @returns
 */
export function formatNameByUrl(url) {
    // 根据URL路径确定目录结构
    const urlSplitArr = url.split('/');
    const getFuncName = (arr) => {
        let name = arr.pop();
        if (name.includes('{') || name.includes(':')) {
            // 过滤掉path参数
            name = getFuncName(arr);
        }
        return name;
    };
    // api函数名
    const funcName = getFuncName(urlSplitArr);
    // 文件名
    const fileName = urlSplitArr.pop() || 'common';
    // 目录名
    const dirName = urlSplitArr.join('/');
    return {
        funcName,
        fileName,
        dirName,
    };
}
