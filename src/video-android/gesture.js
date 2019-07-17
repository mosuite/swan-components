/**
 * @file Video page gesture behavior
 * @author wuhuiyao@baidu.com
 */

import {getElementBox} from '../utils/dom';

/**
 * 规范化百分比的值
 *
 * @inner
 * @param {number} value 要规范化的值
 * @return {number}
 */
function normalizePercentValue(value) {
    if (value < 0) {
        value = 0;
    }
    else if (value > 100) {
        value = 100;
    }
    return value;
}

export default {

    /**
     * 阻止事件默认行为
     *
     * @private
     * @param {Object} e 事件对象
     * @param {boolean=} stopPropagation 是否阻止事件冒泡
     */
    stopDefaultEvent(e, stopPropagation) {
        if (e.cancelable) {
            e.preventDefault();
        }
        stopPropagation && e.stopPropagation();
    },

    /**
     * 是否能够调整播放进度
     *
     * @private
     * @return {boolean}
     */
    canChangeProgress() {
        // 还未打开过视频，不做任何处理
        if (!this.data.get('__isVideoOpened')) {
            return false;
        }

        let total = this.data.get('__totalSeconds');
        return !!total;
    },

    /**
     * 是否是调节播放进度的页面手势操作
     *
     * @private
     * @return {boolean}
     */
    isProgressPageGesture() {
        return this.gestureDirection === 'x'
            && this.data.get('__enableProgressGesture')
            && this.canChangeProgress();
    },

    /**
     * 是否是音量/亮度的页面手势调节操作
     *
     * @private
     * @return {boolean}
     */
    isVoiceLightPageGesture() {
        let data = this.data;
        return this.gestureDirection === 'y'
            && (data.get('__isFullscreen') || data.get('__pageGesture'));
    },

    /**
     * 更新当前亮度/音频的百分比值
     *
     * @private
     * @param {number} diffY 手势调节的偏移量
     */
    updateLightVoicePercent(diffY) {
        let delta = Math.floor(diffY / this.gestureVerticalRange * 100) * -1;
        let isUpLightState = this.data.get('__isUpLightState');
        if (isUpLightState) {
            let value = normalizePercentValue(
                this.oldVoiceLightPercent + delta
            );

            // up screen brightness
            this.setScreenBrightness(value);
        }
        else {
            let value = normalizePercentValue(
                this.oldVoiceLightPercent + delta
            );

            // 更新系统音量
            this.setVideoVolume(value);
        }
    },

    /**
     * 更新已经播放的视频时长
     *
     * @private
     * @param {number} value 已经播放的时间秒数
     * @param {number} startX 手势调节开始的偏移值
     * @param {number} endX 手势调节结束的偏移值
     */
    updatePlayedSeconds(value, startX, endX) {
        let offset = endX - startX;
        let total = this.data.get('__totalSeconds');
        if (this.sliderBarWidth) {
            let addValue = Math.round(offset / this.sliderBarWidth * total);
            value += addValue;
        }

        if (value < 0) {
            value = 0;
        }
        else if (value > total) {
            value = total;
        }

        this.data.set('__playedSeconds', value);
    },

    /**
     * 设置视频播放的进度
     *
     * @private
     * @param {number} value 播放的视频时间秒数
     * @param {number} startX 手势调节开始的偏移值
     * @param {number} endX 手势调节结束的偏移值
     */
    setPlayProgress(value, startX, endX) {
        // 清除当前弹幕
        this.barrage.clear();

        this.updatePlayedSeconds(
            value, startX, endX
        );
        this.seek(this.data.get('__playedSeconds'));
        this.play();

        this.nextTick(() => this.data.set('__isProgressSliderFocus', false));
    },

    /**
     * 判断当前是否可以使用手势
     *
     * @private
     * @return {boolean}
     */
    canUsingGesture() {
        return this.data.get('__isVideoFocus')
            && !this.data.get('isVideoFullscreenLock');
    },

    /**
     * 页面手势操作的触摸开始事件处理
     *
     * @private
     * @param {Object} e 事件对象
     */
    onPageGestureTouchStart(e) {
        if (!this.canUsingGesture()) {
            return;
        }

        let touch = e.changedTouches[0];
        this.startTouchInfo = {
            x: touch.pageX,
            y: touch.pageY,
            t: e.timeStamp
        };
        this.gestureDirection = null;
    },

    /**
     * 页面手势操作的触摸移动事件处理
     *
     * @private
     * @param {Object} e 事件对象
     */
    onPageGestureTouchMove(e) {
        if (!this.canUsingGesture()) {
            return;
        }

        const touch = e.changedTouches[0];
        const {x: startX, y: startY} = this.startTouchInfo;
        const diffX = touch.pageX - startX;
        const diffY = touch.pageY - startY;

        // 初始化页面拖拽方向
        let direction = this.gestureDirection;
        if (!direction) {
            let deltaX = Math.abs(diffX);
            let deltaY = Math.abs(diffY);

            if (deltaX > deltaY && deltaX > 3) {
                direction = 'x';
            }
            else if (deltaY > deltaX && deltaY > 3) {
                direction = 'y';
            }
            this.gestureDirection = direction;
        }

        if (!direction) {
            return;
        }

        // 判断是否是进度拖拽还是亮度/声音拖拽
        if (this.isProgressPageGesture()) {
            this.stopDefaultEvent(e, true);

            if (!this.data.get('__isPageGestureUpProgress')) {
                // 页面手势拖拽时候，隐藏掉底部控件
                this.toggleControlShow(false);

                // 页面拖拽调整进度的状态提示显示
                this.data.set('__isPageGestureUpProgress', true);
                this.nextTick(() => {
                    let slider = this.ref('stateSlider');
                    this.sliderBarWidth = slider && slider.clientWidth;
                });
                this.oldPlayedSeconds = this.data.get('__playedSeconds');
            }

            // 更新调整进度的方向
            this.data.set('__isPageGestureProgressForward', diffX > 0);

            // 更新要跳转的播放时间信息
            this.updatePlayedSeconds(
                this.oldPlayedSeconds, startX, touch.pageX
            );
        }
        else if (this.isVoiceLightPageGesture()) {
            this.stopDefaultEvent(e, true);

            let isUpLightState = this.data.get('__isUpLightState');
            if (!this.data.get('__isPageGestureUpVoiceLight')) {
                // 页面手势拖拽时候，隐藏掉底部控件
                this.toggleControlShow(false);

                let {left, width} = getElementBox(this.ref('video'));
                let boundaryX = +left + parseInt(width / 2, 10);
                isUpLightState = touch.pageX < boundaryX;

                this.oldVoiceLightPercent = isUpLightState
                    ? this.data.get('__lightPercent')
                    : this.data.get('__voicePercent');
                this.data.set('__isPageGestureUpVoiceLight', true);
                this.data.set('__isUpLightState', isUpLightState);

                this.gestureVerticalRange = Math.ceil(this.el.clientHeight / 2) || 500;
            }

            this.updateLightVoicePercent(diffY);
        }
    },

    /**
     * 页面手势操作的触摸结束事件处理
     *
     * @private
     * @param {Object} e 事件对象
     */
    onPageGestureTouchEnd(e) {
        let direction = this.gestureDirection;
        if (!direction) {
            return;
        }

        this.stopDefaultEvent(e, true);

        if (this.isProgressPageGesture()) {
            // 隐藏页面拖拽调整进度的状态提示
            this.data.set('__isPageGestureUpProgress', false);

            this.setPlayProgress(
                this.oldPlayedSeconds,
                this.startTouchInfo.x,
                e.changedTouches[0].pageX
            );
        }
        else if (this.isVoiceLightPageGesture()) {
            this.updateLightVoicePercent(
                e.changedTouches[0].pageY - this.startTouchInfo.y
            );
            this.data.set('__isPageGestureUpVoiceLight', false);
        }

        // reset gesture direction
        this.gestureDirection = null;
    },

    /**
     * 播放进度条触摸开始事件处理
     *
     * @private
     * @param {Object} e 事件对象
     */
    onProgressTouchStart(e) {
        this.stopDefaultEvent(e, true);

        if (!this.canChangeProgress()) {
            return;
        }

        // 先销毁掉自动控件隐藏任务
        this.clearAutoHideControlTask();

        this.data.set('__isProgressSliderFocus', true);
        this.sliderBarWidth = this.ref('slider').clientWidth;

        this.progressStartX = this.ref('slider').getBoundingClientRect().left;
    },

    /**
     * 播放进度条触摸移动事件处理
     *
     * @private
     * @param {Object} e 事件对象
     */
    onProgressTouchMove(e) {
        this.stopDefaultEvent(e, true);

        if (!this.canChangeProgress()) {
            return;
        }

        let endX = e.changedTouches[0].clientX;
        this.updatePlayedSeconds(
            0, this.progressStartX, endX
        );
    },

    /**
     * 播放进度条触摸结束事件处理
     *
     * @private
     * @param {Object} e 事件对象
     * @param {boolean} isClickEvent 是否点击事件
     */
    onProgressTouchEnd(e, isClickEvent) {
        this.stopDefaultEvent(e, true);

        if (!this.canChangeProgress()) {
            return;
        }

        // 重新初始化控件隐藏任务
        this.initAutoHideControlTask();

        let endX = isClickEvent ? e.clientX : e.changedTouches[0].clientX;
        this.setPlayProgress(
            0, this.progressStartX, endX
        );
    },

    /**
     * 进度条点击事件处理
     *
     * @private
     * @param {Object} e 事件对象
     */
    onProgressClick(e) {
        let sliderEle = this.ref('slider');
        this.progressStartX = sliderEle.getBoundingClientRect().left;
        this.sliderBarWidth = sliderEle.clientWidth;

        this.onProgressTouchEnd(e, true);
    }
};
