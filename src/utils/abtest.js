/**
 * @file ABTest util
 * @author wuhuiyao@baidu.com
 */

/* global _naSwan swanGLobal */

/**
 * 获取实验AB实验开关的值，开关值由端上传入
 *
 * @param {string} name 开关名称
 * @return {*}
 */
export function getABSwitchValue(name) {
    // V8与jsc环境
    if (typeof swanGlobal !== 'undefined'
        && _naSwan.env
        && _naSwan.env.config
        && _naSwan.env.config.abTestSwitch
    ) {
        return _naSwan.env.config.abTestSwitch[name];
    }

    // webview环境
    if (window._envVariables && window._envVariables.abTestSwitch) {
        return window._envVariables.abTestSwitch[name];
    }
}
