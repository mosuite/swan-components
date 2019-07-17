/**
 * @file ecom 逻辑封装
 * @author zhoushufeng
 */

const FCLICK_API = 'https://sp0.baidu.com/-rU_dTmfKgQFm2e88IuM_a/w.gif';

/**
 * 请求图片
 *
 * @param {string} url 请求url
 */
export const request = function (url) {
    if (url) {
        let timeStamp = new Date().getTime();
        let img = new Image();

        // 添加随机字符串，避免被cache住
        url += '&rand=' + timeStamp;
        img.onload = img.onerror = img.onabort = function () {
            img.onload = img.onerror = img.onabort = null;
            img = null;
        };
        img.src = url;
    }
};

/**
 * 对象转成url参数对象
 *
 * @param  {Object} params 参数对象
 * @return {string}        url参数字符串
 */
function paramsToUrl(params) {
    let arr = [];

    for (let key in params) {
        if (params.hasOwnProperty(key)) {
            arr.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
        }
    }

    return arr.join('&');
}

export const fclick = function (data) {
    let params = {};

    params = Object.assign(params, data || {});

    request(FCLICK_API + '?' + paramsToUrl(params));
};
