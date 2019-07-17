/**
 * @file 一些常量
 * @author wuxiaopan(wuxiaopan@baidu.com)
 */

/**
 * 组件当前渲染状态
 * @type {Object}
 */
export const COMPONENT_STATE = {
    INSERT: 'insert',
    REMOVE: 'remove'
};

/**
 * 手势事件名称
 * @type {Array}
 */
export const TOUCH_EVENTS_NAME = ['bindtouchstart', 'bindtouchmove',
'bindtouchend', 'bindtouchcancel', 'bindtap',
'bindlongpress', 'bindlongtap', 'bindtouchforcechange'];

/**
 * 组件稳定性打点 http://agroup.baidu.com/box/md/article/1609374
 */
export const STABILITY_LOG_CONFIG = {
    videoOpenError: 'videoOpenError',
    videoUpdateError: 'videoUpdateError',
    videoRemoveError: 'videoRemoveError',
    videoBindError: 'videoBindError',
    videoInsertContainerError: 'videoInsertContainerError',
    videoUpdateContainerError: 'videoUpdateContainerError',

    animationViewInsertError: 'animationViewInsertError',
    animationViewUpdateError: 'animationViewUpdateError',
    animationViewRemoveError: 'animationViewRemoveError',

    livePlayerOpenError: 'livePlayerOpenError',
    livePlayerUpdateError: 'livePlayerUpdateError',
    livePlayerRemoveError: 'livePlayerRemoveError',
    livePlayerBindError: 'livePlayerBindError',

    coverImageInsertError: 'coverImageInsertError',
    coverImageUpdateError: 'coverImageUpdateError',
    coverImageRemoveError: 'coverImageRemoveError',
    coverImageBindError: 'coverImageBindError',

    webViewInsertError: 'webViewInsertError',
    webViewUpdateError: 'webViewUpdateError',
    webViewRemoveError: 'webViewRemoveError',

    imageBindError: 'imageBindError' // h5 image bindError

};
