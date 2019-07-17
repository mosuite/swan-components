/**
 * @file video component for IOS
 * @author jianglian(jianglian01@baidu.com)
 */
import style from './index.css';
import {isEqualObject, privateKey, COMPONENT_STATE} from '../utils';
import {getElementBox} from '../utils/dom';
import {internalDataComputedCreator, typesCast} from '../computedCreator';
import {STABILITY_LOG_CONFIG} from '../utils/constant';

let PLAYER_WIDTH = screen.height;
let PLAYER_HEIGHT = screen.width;
const SHOW_PROGRESS_DEFAULT = 'SHOW_PROGRESS_DEFAULT';

export default {
    behaviors: ['nativeEventEffect'],

    constructor() {
        this.timer = {};
        this.args = null;
        this.currentTime = null;
        this.isInserting = false;
        this.isInserted = false;
        this.isResetingSrc = false;
        this.verticalPosition = {};
        this.isFullscreenPositionChanged = false;
    },

    initData() {
        return {
            src: '',
            controls: true,
            autoplay: false,
            loop: false,
            muted: false,
            objectFit: 'contain',
            poster: '',
            danmuList: [],
            danmuBtn: false,
            enableDanmu: false,
            id: this.id,
            showPlayBtn: true,
            showMuteBtn: true,
            showCenterPlayBtn: true,
            hidden: false,
            pageGesture: false,
            showProgress: SHOW_PROGRESS_DEFAULT,
            direction: 0,
            showFullscreenBtn: true,
            enableProgressGesture: true,
            [privateKey]: {
                componentId: this.id,
                isShowPlayBtn: this.swaninterface.boxjs.platform.isIOS(), // 仅仅是ios需要，为了解决a跳b再返回的case，这时候播放按钮是h5按钮
                isFullscreen: false,
                playerWidth: PLAYER_WIDTH,
                playerHeight: PLAYER_HEIGHT
            }
        };
    },

    template: `<swan-video id="{{id}}" data-sanid="{{provideData.componentId}}"
        style="{{__poster ? 'background-image: url(' + __poster + ');' : ''}}"
        data-poster-type="{{__objectFit}}"
    >
        <swan-video-play
            on-click="openVideo(true)"
            s-if="{{provideData.isShowPlayBtn}}"
        ></swan-video-play>
        <div s-ref="slot"
            style="display: {{provideData.isFullscreen ? 'none' : 'block'}}"
            class="slot">
            <slot s-if="{{!provideData.isFullscreen && !__hidden}}"></slot>
        </div>
        <div s-ref="full"
            style="{{getFullscreenContainerStyle}}"
            class="full">
            <slot s-if="{{provideData.isFullscreen && !__hidden}}"></slot>
        </div>
    </swan-video>`,

    computed: {

        /**
         * 根据当前播放器是否全屏的状态生成全屏容器的宽高
         * @return {string} style
         */
        getFullscreenContainerStyle() {
            const {isFullscreen, playerWidth, playerHeight} = this.data.get('provideData');
            return `display: ${isFullscreen ? 'block' : 'none'}; width: ${playerWidth}px; height: ${playerHeight}px;`;
        },

        /**
         * 产出 provideData 供模板使用
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
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
            {name: 'showProgress', caster: function (attr, defaultVal) {
                return function () {
                    const data = this.data.get(attr);
                    if (data === SHOW_PROGRESS_DEFAULT) {
                        return data;
                    }
                    else {
                        return typesCast.boolCast(attr, defaultVal).call(this);
                    }
                };
            }, default: SHOW_PROGRESS_DEFAULT},
            {name: 'direction', data: [0, 90, -90]},
            {name: 'showFullscreenBtn', caster: typesCast.boolCast, default: true},
            {name: 'enableProgressGesture', caster: typesCast.boolCast, default: true}
        ])
    },

    /**
     * dom元素创建完成但未渲染到页面
     */
    created() {
        this.nextTick(() => {
            this.args = this.getOpenParam();
            this.openVideo();
        });
    },

    /**
     * 组件创建
     */
    attached() {
        // 接收客户端派发到slave的事件
        this.communicator.onMessage(`video_${this.id}`, event => {
            this.dispatchNaEvent(event.params.action, event.params.e);
        });

        this.watch(`${privateKey}.isFullscreen`, isFullscreen => {
            // android 从全屏切换到非全屏：全屏期间更新了position则切换到非全屏需要发update更新
            // TODO: 长期方案端推动播放内核全屏时候不转webview
            !isFullscreen
            && !this.swaninterface.boxjs.platform.isIOS()
            && this.isFullscreenPositionChanged
            && this.nextTick(() => {
                this.updateVideo({
                    needUpdateArgs: true
                });

                // 同时点击全屏和返回，视频位置错乱，暂无它法，只能不断检查是否切换到半屏到位并加延时解决
                this.checkDidScreenChange();
            });
        });
    },

    /**
     * 响应数据变化
     */
    slaveUpdated() {
        const params = this.getOpenParam();
        if (!this.args || isEqualObject(this.args, params)) {
            return;
        }

        const oldSrc = this.args.src;
        this.args = params;
        // src变化调open，其余属性调update
        if (oldSrc !== this.args.src) {
            this.currentTime = null;
            this.isResetingSrc = true;
            this.openVideo();
        }
        else {
            this.updateVideo();
        }
    },

    /**
     * 组件销毁
     */
    detached() {
        if (this.isInserted) {
            this.removeVideo();
        }
    },

    /**
     * 检查全屏切换半屏 是否到位
     */
    checkDidScreenChange() {
        function timeHandler() {
            // 竖屏 切换到位了
            if (PLAYER_WIDTH !== screen.width) {
                clearTimeout(this.timer.fullscreenPosition);
                // 屏幕切换到竖屏，但是页面重新render过程需要时间，nextTick测试不行，页面rerender延时100ms
                setTimeout(() => {
                    this.updateVideo({
                        needUpdateArgs: true
                    });
                }, 100);
            }
            else {
                this.timer.fullscreenPosition = setTimeout(timeHandler.bind(this), 100);
            }
        }
        timeHandler.call(this);
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
        const elementBox = getElementBox(this.el);
        let position = {
            width: `${parseInt(elementBox.width, 10)}`,
            height: `${parseInt(elementBox.height, 10)}`,
            left: `${parseInt(elementBox.left, 10)}`,
            top: `${parseInt(elementBox.top, 10)}`
        };
        let __showProgress = videoData.__showProgress;
        if (__showProgress === SHOW_PROGRESS_DEFAULT) {
            __showProgress = +position.width <= 240 ? false : true;
        }

        // 非全屏
        if (!this.data.get(`${privateKey}.isFullscreen`)) {
            this.verticalPosition = this.args && this.args.position;
            this.isFullscreenPositionChanged = false;
        }
        // 全屏
        else if (!isEqualObject(this.verticalPosition, position)) {
            this.isFullscreenPositionChanged = true;
        }

        // iOS src 本地路径转为 file 协议
        if (this.swaninterface.boxjs.platform.isIOS()
            && !/^data:video\//.test(videoData.src)) {
            videoData.src = this.fileProtocolResolve(videoData.src);
        }

        // poster 本地路径转为 file 协议
        let poster = videoData.__poster;
        if (!/^data:image\//.test(videoData.poster)) {
            poster = this.fileProtocolResolve(videoData.poster);
        }

        return {
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
    },

    /**
     * 创建video
     *
     * @param {boolean} autoPlay 是否自动播放
     */
    openVideo(autoPlay) {
        // 若初始化就设置为隐藏，不执行open
        if (this.args.hide) {
            return;
        }
        const params = this.args;

        autoPlay && (params.autoplay = true);
        // 切换视频src时不需要用currentTime替换initialTime，
        // 虽然watch src时把currentTime置为了null但可能之前的视频还在播放，会重新设置currentTime。导致src变化重新open但走到这里currentTime已经不是null了
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

            this.sendStateChangeMessage('video', COMPONENT_STATE.INSERT, this.data.get('id'), this.args.videoId);
        }).catch(err => {
            this.isInserting = false;
            console.warn('video open fail', err);
            this.logStability(STABILITY_LOG_CONFIG.videoOpenError);
        });
    },

    /**
     * 更新video
     *
     * @param {Object} options 可选参数： needUpdateArgs 是否需要更新args参数
     */
    updateVideo(options = {}) {
        if (options.needUpdateArgs) {
            this.args = this.getOpenParam();
        }
        if (!this.isInserted && !this.isInserting) {
            this.openVideo();
        }
        else {
            this.boxjs.media.video({
                type: 'update',
                data: this.args
            }).catch(err => {
                console.warn('video update fail', err);
                this.logStability(STABILITY_LOG_CONFIG.videoUpdateError);
            });
        }
    },

    /**
     * 移除video
     */
    removeVideo() {
        this.boxjs.media.video({
            type: 'remove',
            data: {
                videoId: this.args.videoId,
                viewId: this.args.viewId,
                sanId: this.args.sanId,
                slaveId: this.args.slaveId
            }
        }).then(res => {
            this.sendStateChangeMessage('video', COMPONENT_STATE.REMOVE, this.data.get('id'), this.args.videoId);
        }).catch(err => {
            this.logStability(STABILITY_LOG_CONFIG.videoRemoveError);
        });
    },

    // 同步时间接受方法
    syncCurrentTime(currentTime) {
        this.currentTime = currentTime;
    },

    /**
     * 全屏处理
     *
     * @param {Object} data 端返回的数据
     */
    fullScreenChangeHandler(data) {
        let {fullscreen, width, height} = data;

        // 低版本客户端中 video:fullscreenchange 事件缺少 width、 height 参数，需要做下兼容
        if (width === undefined || height === undefined) {
            if (fullscreen === '1') {
                width = PLAYER_WIDTH;
                height = PLAYER_HEIGHT;
            } else {
                width = PLAYER_HEIGHT;
                height = PLAYER_WIDTH;
            }
        }
        this.data.set(`${privateKey}.playerWidth`, width);
        this.data.set(`${privateKey}.playerHeight`, height);

        // 标记是否全屏状态
        this.data.set(`${privateKey}.isFullscreen`, fullscreen === '1');

        const self = this;
        // 加延迟 防止频繁触发屏幕切换
        clearTimeout(this.timer.fullscreenchange);
        this.timer.fullscreenchange = setTimeout(() => {
            this.communicator.fireMessage({
                type: 'fullscreenchange',
                data: {}
            });
            // android 端会频繁触发屏幕切换，需要加延迟解决
        }, self.swaninterface.boxjs.platform.isIOS() ? 0 : 500);
    },

    /**
     * 通知master获取bind方法handler映射
     *
     * @param {string} eventName 事件名称
     * @param {Object} params 参数
     */
    dispatchCustomEvent(eventName, params) {
        let data = JSON.parse(params.data);
        if (eventName === 'bindtimeupdate') {
            data.currentTime = +data.currentTime;
            data.duration = +data.duration;

            this.syncCurrentTime(data.currentTime);
        }
        else if (eventName === 'bindfullscreenchange') {
            this.fullScreenChangeHandler(data);
            data.fullscreen = data.fullscreen;
            data.direction = +data.fullscreen ? 'horizontal' : 'vertical';
        }
        else if (eventName === 'binddanmu') {
            data.text && (data.text = decodeURIComponent(data.text));
        }
        else if (eventName === 'binderror') {
            this.logStability(STABILITY_LOG_CONFIG.videoBindError);
        }

        this.dispatchEvent(eventName, {
            detail: Object.assign(data, {videoId: this.data.get('id')})
        });
    }
};
