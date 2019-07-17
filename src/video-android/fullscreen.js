/**
 * @file Video fullscreen behavior
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
 * @author wuhuiyao@baidu.com
 */

// const SCREEN_WIDTH = screen.width;
// const SCREEN_HEIGHT = screen.height;

/**
 * 横屏状态
 *
 * @const
 * @type {number}
 */
const LANDSCAPE_STATE = 1;

/**
 * 竖屏状态
 *
 * @const
 * @type {number}
 */
const PORTRAIT_STATE = 2;

/**
 * 获取当前全屏 DOM 元素
 *
 * @inner
 * @return {?HTMLElement}
 */
function getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement;
}

/**
 * 请求 Dom 元素全屏处理
 *
 * @inner
 * @param {HTMLElement} ele 要全屏的元素
 * @return {?Promise}
 */
function requestFullscreen(ele) {
    if (ele && ele.webkitRequestFullScreen) {
        return ele.webkitRequestFullScreen();
    }
}

/**
 * 退出全屏
 *
 * @inner
 * @return {?Promise}
 */
function exitFullscreen() {
    if (document.webkitExitFullscreen) {
        return document.webkitExitFullscreen();
    }
}

/**
 * 监听手机翻转状态变更： 横屏/竖屏 变化
 *
 * @inner
 * @param {Object} component 组件实例
 * @param {Function} callback 监听到变化的事件回调
 * @return {Function}
 */
function getDeviceOrientationChangeHandler(component, callback) {
    const boxjs = component.boxjs;
    let lastState = PORTRAIT_STATE;

    return ({alpha: zAngle, beta: xAngle, gamma: yAngle}) => {
        // z: [0, 360], x: [-180, 180], y: [-90, 90]
        // console.log('motion change', `zAngle: ${zAngle}, xAngle: ${xAngle}, yAngle: ${yAngle}`);
        // 全屏锁住，不自动半屏
        if (component.data.get('isVideoFullscreenLock')) {
            return;
        }

        // 如果方向被锁定，横屏的时候，则不自动全屏视频
        let res = boxjs.layer({name: 'getAutoRotationSync'});
        if (!res || !res.isRotateOn) {
            return;
        }

        let nowState;
        let absXAngle = Math.abs(xAngle);
        let absYAngle = Math.abs(yAngle);
        if (absYAngle > 60) {
            if (absXAngle < 40 || absXAngle > 140) {
                nowState = LANDSCAPE_STATE; // 横屏
            }
        }
        else if (absYAngle < 40) {
            if (absXAngle > 50 && absXAngle < 130) {
                nowState = PORTRAIT_STATE; // 竖屏
            }
        }

        if (nowState && nowState !== lastState) {
            let isLandscape = nowState === LANDSCAPE_STATE;
            // console.log('orientation change:', timer, isLandscape ? '横屏' : '竖屏');
            // component.swan.showModal({
            //     title: timer + ', orientation:' + nowState + '(' + (isLandscape ? '横屏' : '竖屏') + ')',
            //     content: `last: ${lastState}, zAngle: ${zAngle}, xAngle: ${xAngle}, yAngle: ${yAngle}`
            // });
            lastState = nowState;
            callback({isLandscape});
        }
    };
}

let oldFullscreenListeners;

/**
 * 添加/移除全屏、设备旋转事件监听器
 *
 * @inner
 * @param {boolean} isAddListener 是否添加监听
 * @param {Object} listeners 监听器定义
 */
function toggleFullscreenListener(isAddListener, listeners) {
    let type = isAddListener ? 'addEventListener' : 'removeEventListener';
    document[type](
        'webkitfullscreenchange', listeners.change
    );
    document[type](
        'webkitfullscreenerror', listeners.error
    );

    window[type](
        'deviceorientation', listeners.orientation
    );
}

function isVideoHasFullscreenListener(video) {
    return oldFullscreenListeners && video.id === oldFullscreenListeners.id;
}

/**
 * 更新设备旋转全屏监听器，由于目前是支持单例形式，因此监听器始终只有一个视频拥有
 *
 * @inner
 * @param {Object} video video 组件实例
 * @param {boolean} isAddListen 是否是添加监听还是移除监听
 */
function updateDeviceOrientationListener(video, isAddListen) {
    if (oldFullscreenListeners && video.id === oldFullscreenListeners.id) {
        if (isAddListen) {
            return;
        }

        toggleFullscreenListener(false, oldFullscreenListeners);
        oldFullscreenListeners = null;
        return;
    }

    if (isAddListen) {
        if (oldFullscreenListeners) {
            // 移除其它视频的监听器
            toggleFullscreenListener(false, oldFullscreenListeners);
        }

        // 初始化手机状态变化：横屏/竖屏 以及 全屏事件监听器
        oldFullscreenListeners = {
            id: video.id,
            orientation: video.deviceOrientationHandler,
            change: video.fullscreenChangeHandler,
            error: video.fullscreenChangeErrorHandler
        };
        toggleFullscreenListener(true, oldFullscreenListeners);
    }
}

export default {

    /**
     * 初始化全屏监听器
     */
    initFullscreenListener() {
        this.deviceOrientationHandler = getDeviceOrientationChangeHandler(
            this, res => this.toggleFullscreen(res.isLandscape)
        );

        // 初始化全屏变化事件监听器
        this.fullscreenChangeHandler = this.onFullscreenChangeSuccess.bind(this);
        this.fullscreenChangeErrorHandler = this.onFullscreenChangeError.bind(this);
    },

    /**
     * 添加设备方向变化以及全屏变化事件监听器
     * 监听规则：
     * 1. 视频播放过才监听横屏自动全屏
     * 2. 如果多个视频播放过，只监听当前播放的视频横屏自动全屏，目前视频播放单例方式，同一时刻
     *    只有一个视频会处于播放状态，另外播放视频会自动暂停
     * 3. 如果所有视频都暂停了不播放，则只监听最后一个播放过的视频的横屏自动全屏
     * 4. 如果视频全屏状态暂停播放，则依旧保持监听横屏自动全屏
     */
    initDeviceOrientationListener() {
        updateDeviceOrientationListener(this, true);
    },

    /**
     * 移除全屏监听器
     */
    removeFullscreenListener() {
        // 强制移除设备方向变化监听
        updateDeviceOrientationListener(this, false);

        clearTimeout(this.fullscreenChangeTimer);
    },

    /**
     * 全屏变化成功的事件处理器
     *
     * @private
     * @param {Object} e 事件对象
     */
    onFullscreenChangeSuccess(e) {
        let isFullscreen = this.isVideoInFullscreen();
        this.data.set('__isFullscreen', isFullscreen);

        // 更新弹幕大小
        clearTimeout(this.fullscreenChangeTimer);
        this.fullscreenChangeTimer = setTimeout(() => {
            this.barrage.resize();

            // 派发全屏变化给其它组件
            this.communicator.fireMessage({
                type: 'fullscreenchange',
                data: {}
            });

            // 处理 video 嵌套的 NA 组件的全屏处理
            this.handleSlotFullscreenChange(isFullscreen);
        }, 100);

        // 触发全屏变化事件
        this.dispatchEvent('bindfullscreenchange', {
            // 之前 na 方案，还返回了视频 width/height: '333'，字符串形式，这个值是全屏变化前的宽高
            detail: {
                videoId: this.data.get('id'),
                // 这里保持跟之前 na 派发事件参数类型一致，否则线上有些小程序可能不是简单基于 boolean 判断就挂了。。
                fullscreen: isFullscreen ? '1' : '0',
                // 目前只支持水平全屏，爱奇艺基于 direction 该值来判断是否全屏。。。
                direction: isFullscreen ? 'horizontal' : 'vertical'
            }
        });
    },

    /**
     * 全屏变化失败的事件处理器
     *
     * @private
     * @param {Object} e 事件对象
     */
    onFullscreenChangeError(e) {
        // console.log('fullscreen change error handler', e);
        this.data.set('__isFullscreen', this.isVideoInFullscreen());
    },

    /**
     * 当前视频是否处于全屏模式
     *
     * @return {boolean}
     */
    isVideoInFullscreen() {
        return getFullscreenElement() === this.el;
    },

    /**
     * 全屏/退出全屏切换
     *
     * @param {boolean=} isFullscreen 是否全屏
     */
    toggleFullscreen(isFullscreen) {
        // 如果没有添加过全屏监听器，初始化下
        if (!isVideoHasFullscreenListener(this)) {
            this.initDeviceOrientationListener();
        }

        if (isFullscreen === undefined) {
            isFullscreen = !this.isVideoInFullscreen();
        }

        // 如果已经有全屏元素，则忽略该全屏操作
        if (getFullscreenElement() && isFullscreen) { /* istanbul ignore next */
            return;
        }

        this.data.set('__isFullscreen', isFullscreen);
        if (isFullscreen) {
            // 不全屏 video 元素，不然 video 原生控件又会显示出来，定制的播放控件没法显示
            // 但全屏非 video 元素，对于手机自带底部导航栏，全屏后依旧还存在，而且这个底部 bar
            // 是在全屏的 webview 层上面，因此导致该位置按钮没法触发点击，需要调用端能力将其
            // 隐藏掉
            requestFullscreen(this.el);
        }
        else {
            exitFullscreen();
        }
    }
};
