/**
 * @file video component for IOS
 * @author jianglian(jianglian01@baidu.com)
 */

import './index.css';
import {COMPONENT_STATE, isEqualObject} from '../utils';
import {getElementBox} from '../utils/dom';
import {internalDataComputedCreator, typesCast} from '../computedCreator';
import {STABILITY_LOG_CONFIG} from '../utils/constant';

// 缓存横屏时候的屏幕宽高
const PLAYER_HEIGHT = screen.width > screen.height ? screen.height : screen.width;
const PLAYER_WIDTH = screen.width > screen.height ? screen.width : screen.height;

const SHOW_PROGRESS_DEFAULT = 'SHOW_PROGRESS_DEFAULT';

const FULL_SCREEN_ZINDEX = 100000000;
const SLOT_FULLSCREEN_ZINDEX = FULL_SCREEN_ZINDEX + 1;
const FULLSCREEN_RESET_STYLE = `z-index: ${FULL_SCREEN_ZINDEX} !important;
    overflow: visible !important;
    transform: none !important;
    animation-name: none !important;
    animation-duration: 0ms !important;`;

/**
 * 插入/更新容器尝试次数
 *
 * @const
 * @type {number}
 */
const UPDATE_INSERT_TRY_NUM = 5;

export default {
    behaviors: ['nativeEventEffect'],

    constructor() {
        this.timer = {};
        this.openParams = null;
        this.currentTime = null;
        this.isInserting = false;
        this.isInserted = false;
        this.isResetingSrc = false;
        this.insertContainerRetryCounter = 0;
        this.updateContainerTryCounter = 0;
        this.insertContainerFail = false;
        this.domNodeStyleCache = [];
    },

    initData() {
        return {
            id: this.id,
            src: '',
            duration: 0,
            initialTime: 0,
            controls: true,
            autoplay: false,
            loop: false,
            muted: false,
            objectFit: 'contain',
            poster: '',
            danmuList: [],
            danmuBtn: false,
            enableDanmu: false,
            showMuteBtn: true,
            showPlayBtn: true,
            showCenterPlayBtn: true,
            pageGesture: false,
            showProgress: SHOW_PROGRESS_DEFAULT,
            enableProgressGesture: true,
            showFullscreenBtn: true,
            direction: 0,
            hidden: false,

            __sanId: this.id,
            __videoContainerContentHeight: screen.height + 100,
            __isFullscreen: false,
            __scrollviewId: `${this.id}-scrollviewid`,
            __slotFullscreenZindex: SLOT_FULLSCREEN_ZINDEX,
            __showCoverPlay: true
        };
    },

    template: `<swan-video id="{{id}}" data-sanid="{{__sanId}}" data-swan-same-layer="1"
        style="{{videoWrapStyle}}" data-poster-type="{{__objectFit}}">
        <swan-video-play s-ref="box" on-click="onClickCoverPlay" style="{{coverPlayStyle}}"></swan-video-play>
        <div s-ref="container" class="swan-ios-video-container" style="{{naVideoContainerStyle}}">
            <div id="{{__scrollviewId}}" style="{{naVideoStyle}}"></div>
        </div>
        <div s-ref="slot" style="{{videoSlotStyle}}">
            <slot></slot>
        </div>
    </swan-video>`,

    computed: {

        coverPlayStyle() {
            let zIndex = this.data.get('__showCoverPlay') ? 3 : -1;
            return `z-index: ${zIndex}`;
        },

        videoWrapStyle() {
            let style = '';
            let poster = this.data.get('__poster');
            if (poster) {
                style += `background-image: url(${poster});`;
            }

            if (this.data.get('__isFullscreen')) {
                style += ' ' + FULLSCREEN_RESET_STYLE;
                style += ` width: ${PLAYER_WIDTH}px !important; height: ${PLAYER_HEIGHT}px !important;`;
                style += 'position: fixed !important; left: 0 !important; top: 0 !important;';
            }

            return style;
        },

        naVideoContainerStyle() {
            let style = 'overflow: scroll; -webkit-overflow-scrolling: touch;';
            if (this.data.get('__isFullscreen')) {
                style += 'position: fixed;background: #000;';
            }
            else {
                style += 'background: transparent;';
            }

            return style;
        },

        naVideoStyle() {
            // 为了使 scrollview 出现滚动，必须内容高度超过父容器高度，这样 ios 端
            // 才能基于生成原生的 scroll view 往里插入原生 video 控件
            let height = this.data.get('__videoContainerContentHeight');
            return `width: 100%; height: ${height}px`;
        },

        videoSlotStyle() {
            let isFullscreen = this.data.get('__isFullscreen');
            let zIndex = isFullscreen
                ? this.data.get('__slotFullscreenZindex') : 1;
            let position = isFullscreen ? 'fixed' : 'absolute';
            let videoWidth = isFullscreen ? `${PLAYER_WIDTH}px` : '100%';
            let videoHeight = isFullscreen ? `${PLAYER_HEIGHT}px` : '100%';
            let style = [
                `position: ${position}`,
                'top: 0',
                'left: 0',
                `width: ${videoWidth}`,
                `height: ${videoHeight}`,
                'overflow: hidden',
                `z-index: ${zIndex}`
            ];

            return style.join(';');
        },

        ...internalDataComputedCreator([
            {name: 'poster', caster: typesCast.stringCast},
            {name: 'controls', caster: typesCast.boolCast, default: true},
            {name: 'autoplay', caster: typesCast.boolCast},
            {name: 'loop', caster: typesCast.boolCast},
            {name: 'muted', caster: typesCast.boolCast},
            {name: 'objectFit', data: ['contain', 'fill', 'cover']},
            {name: 'danmuBtn', caster: typesCast.boolCast},
            {name: 'enableDanmu', caster: typesCast.boolCast},
            {name: 'showPlayBtn', caster: typesCast.boolCast, default: true},
            {name: 'showMuteBtn', caster: typesCast.boolCast, default: true},
            {name: 'showCenterPlayBtn', caster: typesCast.boolCast, default: true},
            {name: 'hidden', caster: typesCast.boolCast},
            {name: 'pageGesture', caster: typesCast.boolCast},
            {
                name: 'showProgress',
                caster(attr, defaultVal) {
                    return function () {
                        const data = this.data.get(attr);
                        if (data === SHOW_PROGRESS_DEFAULT) {
                            return data;
                        }
                        return typesCast.boolCast(attr, defaultVal).call(this);
                    };
                },
                default: SHOW_PROGRESS_DEFAULT
            },
            {name: 'direction', data: [0, 90, -90]},
            {name: 'showFullscreenBtn', caster: typesCast.boolCast, default: true},
            {name: 'enableProgressGesture', caster: typesCast.boolCast, default: true}
        ])
    },

    /**
     * 初始化 Dom 节点元素全屏下的样式
     *
     * @private
     * @param {Object} elem 要初始化 DOM 元素
     */
    initNodeFullScreenStyle(elem) {
        if (!elem) {
            return;
        }

        // 只初始化 body 下子孙节点的全屏样式
        if (elem.nodeName === 'BODY') {
            return;
        }

        if (elem.parentNode.nodeName !== 'BODY') {
            this.domNodeStyleCache.push({
                node: elem.parentNode,
                oldStyle: elem.parentNode.style.cssText
            });
            elem.parentNode.style.cssText = FULLSCREEN_RESET_STYLE;
        }

        this.initNodeFullScreenStyle(elem.parentNode);
    },

    /**
     * 退出全屏视图
     *
     * @private
     */
    exitFullscreenView() {
        let resetStyleValue = (node, property, value) => {
            let oldValue = node.style.getPropertyValue(property);
            let priority = node.style.getPropertyPriority(property);
            node.style.setProperty(property, value, 'important');
            return {
                property,
                priority,
                value: oldValue
            };
        };

        let restoreStyleValue = (node, propValue) => {
            let {property, value, priority} = propValue;
            node.style.setProperty(property, value || null, priority);
        };

        this.domNodeStyleCache.forEach(
            item => {
                item.node.style.cssText = item.oldStyle;

                // 先禁用动画属性再恢复，避免动画影响 container 位置计算，
                // 导致端查找不到 scroll view
                let animProp = resetStyleValue(
                    item.node, 'animation-duration', '0s'
                );
                let transProp = resetStyleValue(
                    item.node, 'transition-duration', '0s'
                );

                setTimeout(() => {
                    restoreStyleValue(item.node, animProp);
                    restoreStyleValue(item.node, transProp);
                });
            }
        );
        this.domNodeStyleCache = [];
    },

    /**
     * 组件创建生命周期钩子
     */
    attached() {
        // 接收客户端派发到slave的事件
        this.communicator.onMessage(`video_${this.id}`, event => {
            this.dispatchNaEvent(event.params.action, event.params.e);
        });

        this.tryInsertContainer();

        this.watch('hidden', val => this.updateContainer());

        this.watch('__isFullscreen', isFullscreen => {
            if (isFullscreen) {
                this.data.set('__isFullscreen', true);
                this.initNodeFullScreenStyle(this.ref('box'));
            }
            else {
                this.data.set('__isFullscreen', false);
                this.exitFullscreenView();
            }
            this.updateContainer();
        });
    },

    /**
     * 组件移除生命周期钩子
     *
     * @private
     */
    detached() {
        let observer = this.slotObserver;
        if (observer) {
            observer.disconnect();
            this.slotObserver = null;
        }
    },

    /**
     * 尝试插入容器
     *
     * @private
     */
    tryInsertContainer() {
        let counter = ++this.insertContainerRetryCounter;
        if (counter > UPDATE_INSERT_TRY_NUM) { // 超过重试次数直接回退到之前老的方案
            this.logStability(STABILITY_LOG_CONFIG.videoInsertContainerError);
            this.insertContainerFail = true;
            this.openParams = this.getOpenParam();
            this.openVideo();
            return;
        }

        this.nextTick(
            () => window.requestAnimationFrame(() => this.insertContainer())
        );
    },

    /**
     * 更新滚动容器
     */
    updateContainer() {
        const {width, height, left, top} = getElementBox(this.el);
        let position = {
            width,
            height,
            left,
            top
        };

        if (this.data.get('__isFullscreen')) {
            // 全屏
            position.width = PLAYER_WIDTH;
            position.height = PLAYER_HEIGHT;
            position.left = 0;
            position.top = 0;
        }
        this.boxjs.ui.update({
            name: 'swan-container',
            data: {
                slaveId: this.slaveId,
                containerId: this.data.get('__scrollviewId'),
                position: position,
                scrollHeight: this.data.get('__videoContainerContentHeight')
            }
        }).then(e => {
            if (e.isScrollViewFound) {
                this.updateVideo({
                    needUpdateArgs: true
                });
                this.updateContainerTryCounter = 0;
            }
            else if (this.updateContainerTryCounter < UPDATE_INSERT_TRY_NUM) {
                this.updateContainerTryCounter++;
                this.nextTick(
                    () => window.requestAnimationFrame(
                        () => this.updateContainer()
                    )
                );
            }
            else {
                this.logStability(STABILITY_LOG_CONFIG.videoUpdateContainerError);
                this.updateVideo({
                    needUpdateArgs: true
                });
                this.updateContainerTryCounter = 0; // reset
            }
        }).catch(err => {
            this.logStability(STABILITY_LOG_CONFIG.videoUpdateContainerError);
        });
    },

    /**
     * 插入滚动容器
     *
     * @private
     */
    insertContainer() {
        const {width, height, left, top} = getElementBox(this.el);
        let position = {
            width,
            height,
            left,
            top
        };
        // 对应 container.insert 端能力
        this.boxjs.ui.open({
            name: 'swan-container',
            data: {
                slaveId: this.slaveId,
                containerId: this.data.get('__scrollviewId'),
                position: position,
                scrollHeight: this.data.get('__videoContainerContentHeight')
            }
        }).then(e => {
            if (e.isScrollViewFound) {
                this.openParams = this.getOpenParam();
                this.openVideo();
            }
            else {
                this.tryInsertContainer();
            }
        }).catch(err => {
            this.tryInsertContainer();
            // console.warn('video open fail', err);
        });
    },

    /**
     * 响应数据变化
     */
    slaveUpdated() {
        const params = this.getOpenParam();
        if (!this.openParams || isEqualObject(this.openParams, params)) {
            return;
        }
        const oldSrc = this.openParams.src;
        this.openParams = params;
        // src 变化调 open，其余属性调 update
        if (oldSrc !== params.src) {
            this.currentTime = null;
            this.isResetingSrc = true;
            this.openVideo();
        }
        else {
            this.updateVideo();
        }
    },

    /**
     * 组件销毁生命周期钩子
     *
     * @private
     */
    detached() {
        this.domNodeStyleCache = [];
        if (this.isInserted) {
            this.removeVideo();
        }
    },

    /**
     * 转为 file 协议的沙盒路径
     *
     * @param {string} path 原始路径
     * @return {string} 原始路径/file 协议路径
     */
    fileProtocolResolve(path) {
        if (path && !/^(http|https|bdfile|file):\/\/.*/i.test(path)) {
            return `file://${this.absolutePathResolve(path)}`;
        }
        return path;
    },

    /**
     * 获得创建video所需的参数
     *
     * @return {Object}
     */
    getOpenParam() {
        let videoData = this.data.get();
        const {width, height, left, top} = getElementBox(this.el);
        const position = {
            width,
            height,
            left,
            top
        };

        let __showProgress = videoData.__showProgress;
        if (__showProgress === SHOW_PROGRESS_DEFAULT) {
            __showProgress = +position.width > 240;
        }

        // iOS src 本地路径转为 file 协议
        if (!/^data:video\//.test(videoData.src)) {
            videoData.src = this.fileProtocolResolve(videoData.src);
        }

        // poster 本地路径转为 file 协议
        let poster = videoData.__poster;
        if (!/^data:image\//.test(videoData.poster)) {
            poster = this.fileProtocolResolve(videoData.poster);
        }

        let openParams = {
            gesture: this.hasGestrue(),
            videoId: this.id,
            viewId: this.id,
            sanId: this.id,
            parentId: this.getFirstParentComponentId(),
            src: videoData.src,
            initialTime: videoData.initialTime,
            duration: videoData.duration,
            objectFit: videoData.__objectFit,
            poster,
            slaveId: `${this.slaveId}`,
            position,
            controls: videoData.__controls,
            autoplay: videoData.__autoplay,
            loop: videoData.__loop,
            muted: videoData.__muted,
            showPlayBtn: videoData.__showPlayBtn,
            showCenterPlayBtn: videoData.__showCenterPlayBtn,
            showMuteBtn: videoData.__showMuteBtn,
            danmuList: videoData.danmuList,
            enableDanmu: videoData.__enableDanmu,
            danmuBtn: videoData.__danmuBtn,
            hide: videoData.__hidden,
            pageGesture: videoData.__pageGesture,
            showProgress: __showProgress,
            direction: videoData.__direction,
            showFullscreenBtn: videoData.__showFullscreenBtn,
            enableProgressGesture: videoData.__enableProgressGesture
        };

        if (this.data.get('__isFullscreen')) {
            openParams.position.width = PLAYER_WIDTH;
            openParams.position.height = PLAYER_HEIGHT;
        }

        if (!this.insertContainerFail) {
            openParams.parentId = this.data.get('__scrollviewId');
            openParams.position.left = 0;
            openParams.position.top = 0;
        }
        return openParams;
    },

    /**
     * 点击视频封面的播放按钮
     *
     * @private
     */
    onClickCoverPlay() {
        // 播放按钮隐藏
        this.data.set('__showCoverPlay', false);
        this.openVideo(true);
    },

    /**
     * 创建video
     *
     * @param {boolean} autoPlay 是否自动播放
     */
    openVideo(autoPlay) {
        // 若初始化就设置为隐藏，不执行open
        if (this.openParams.hide) {
            return;
        }

        const params = this.openParams;

        autoPlay && (params.autoplay = true);
        // 切换视频src时不需要用currentTime替换initialTime，
        // 虽然watch src时把currentTime置为了null但可能之前的视频还在播放，
        // 会重新设置currentTime。导致src变化重新open但走到这里currentTime已经不是null了
        if (!this.isResetingSrc && this.currentTime) {
            params.initialTime = `${this.currentTime}`;
        }
        this.isResetingSrc = false;

        this.isInserting = true;
        this.boxjs.media.video({
            type: 'insert',
            data: params
        }).then(e => {
            this.currentTime = null;
            this.isInserted = true;
            this.isInserting = false;

            this.data.set('__showCoverPlay', false);
            this.sendStateChangeMessage(
                'video', COMPONENT_STATE.INSERT,
                this.data.get('id'),
                this.openParams.videoId
            );
        }).catch(err => {
            this.isInserting = false;
            console.warn('video open fail', err);
        });
    },

    /**
     * 更新 video
     *
     * @private
     */
    updateVideo() {
        this.openParams = this.getOpenParam();
        const openParams = this.openParams;
        this.boxjs.media.video({
            type: 'update',
            data: openParams
        }).catch(err => {
            console.warn('video update fail', err);
            this.logStability(STABILITY_LOG_CONFIG.videoUpdateError);
        });
    },

    /**
     * 移除 video
     *
     * @private
     */
    removeVideo() {
        let {videoId, viewId, sanId, slaveId} = this.openParams;
        this.boxjs.media.video({
            type: 'remove',
            data: {
                videoId,
                viewId,
                sanId,
                slaveId
            }
        }).then(
            res => this.sendStateChangeMessage(
                'video', COMPONENT_STATE.REMOVE, this.data.get('id'), videoId
            )
        ).catch(err => {
            console.warn('video remove fail', err);
            this.logStability(STABILITY_LOG_CONFIG.videoRemoveError);
        });
    },

    /**
     * 处理全屏变化事件
     *
     * @private
     * @param {Object} data 端返回的数据
     */
    handleFullscreenChange(data) {
        let fullscreen = data.fullscreen;
        let isFullscreen = fullscreen === '1';
        // 标记是否全屏状态
        this.data.set('__isFullscreen', isFullscreen);

        // 加延迟 防止频繁触发屏幕切换
        clearTimeout(this.timer.fullscreenchange);
        this.timer.fullscreenchange = setTimeout(() => {
            this.communicator.fireMessage({
                type: 'fullscreenchange',
                data: {
                    isFullscreen,
                    videoId: this.id,
                    isVideoFullscreenChange: true
                }
            });
        }, 10);
    },

    /**
     * 向 master 派发自定义组件事件
     *
     * @private
     * @param {string} eventName 事件名称
     * @param {Object} params 参数
     */
    dispatchCustomEvent(eventName, params) {
        let data = JSON.parse(params.data);
        if (eventName === 'bindtimeupdate') {
            data.currentTime = +data.currentTime;
            data.duration = +data.duration;

            // 缓存当前播放时间
            this.currentTime = data.currentTime;
        }
        else if (eventName === 'bindfullscreenchange') {
            this.handleFullscreenChange(data);
            data.fullscreen = data.fullscreen;
            data.direction = +data.fullscreen ? 'horizontal' : 'vertical';
        }
        else if (eventName === 'binddanmu') {
            data.text && (data.text = decodeURIComponent(data.text));
        }
        else if (eventName === 'bindremove') {
            // ios 单一实例，移除后要显示播放按钮
            this.data.set('__showCoverPlay', true);
        }
        else if (eventName === 'bindplay') {
            // ios 单一实例，播放了不要显示播放按钮，由于 na 控件初始化后，h5
            // 播放按钮盖不到 na 上面，导致捕获不到点击事件
            this.data.set('__showCoverPlay', false);
        }

        this.dispatchEvent(eventName, {
            detail: Object.assign(data, {videoId: this.data.get('id')})
        });
    }
};
