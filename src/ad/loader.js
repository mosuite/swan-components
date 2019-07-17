/**
 * @file loader.js 动态加载 js
 * @author hongfeng@baidu.com
 */

export function loadScript(path, fn) {
    let el = document.createElement('script');
    let head = document.head || document.getElementsByTagName('head')[0];
    el.onload = function () {
        el.onload = el.onerror = null;
        fn && fn();
    };
    el.onerror = function () {
        el.onload = el.onerror = null;
        console.log('loadScript', path, 'failed');
    };
    el.src = path;
    head.appendChild(el);
}
