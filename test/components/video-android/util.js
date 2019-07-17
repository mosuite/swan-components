/**
 * @file Video test utils
 * @author wuhuiyao@baidu.com
 */

import Video from '../../../src/video-android';
import buildComponent from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';

export function createVideoInstance(opts) {
    let component = buildComponent('video', Video, opts);
    attach2Document(component);
    return component;
}

export function fakeTouchEvent(touchInfo, isClick) {
    let {x, y} = touchInfo || {};
    return Object.assign({
        cancelable: true,
        preventDefault() {},
        stopPropagation() {},
        changedTouches: [Object.assign({
            pageX: x || 0,
            pageY: y || 0
        }, touchInfo)]
    }, isClick ? touchInfo : {});
}

export function mockSwanApi(component, name, def) {
    const rawApi = component.swan[name];
    component.swan[name] = def;
    return () => (component.swan[name] = rawApi);
}
