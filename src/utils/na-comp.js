/**
 * @file NA组件公用函数
 * @author yangzongjun(yangzongjun@baidu.com)
 */

export const getParentCompInfo = currentComp => {
    let parentComponent = currentComp.parentComponent || {};
    let parentTagName = parentComponent.el
        ? parentComponent.el.tagName.toLocaleLowerCase()
        : null;

    if (parentTagName === 'swan-template') {
        parentComponent = currentComp.parentComponent.parentComponent;
        parentTagName = parentComponent
            ? parentComponent.el.tagName.toLocaleLowerCase()
            : null;
    }
    return {
        parentComponent,
        parentTagName
    };
};

/**
 * 判断给定的 NA 组件是否是给定的父组件的子孙组件
 *
 * @param {Object} naComponent na 组件
 * @param {string} parentComponentId 父组件 id
 * @return {boolean}
 */
export function isChildComponent(naComponent, parentComponentId) {
    let curr = naComponent;
    while (curr) {
        curr = curr.parentComponent;
        if (curr && curr.id === parentComponentId) {
            return true;
        }
    }

    return false;
}

/**
 * 处理 iOS Video 同层渲染全屏变化消息
 *
 * @param {Object} naComponent na 组件
 * @param {Object} message 全屏变化消息
 */
export function handleVideoFullscreenChangeMessage(naComponent, message) {
    let data = message && message.data;
    if (data && data.isVideoFullscreenChange) {
        // 对于 ios 同层渲染，全屏时候需要把其它非本视频的 na 组件隐藏掉
        if (!isChildComponent(naComponent, data.videoId)) {
            let rawHidden = naComponent._rawHidden;
            if (data.isFullscreen) {
                naComponent._rawHidden = naComponent.data.get('hidden') || false;
                naComponent.data.set('hidden', true);
            }
            else if (rawHidden !== undefined) {
                naComponent.data.set('hidden', rawHidden);
            }
        }
    }
}
