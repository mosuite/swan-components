/**
 * @file Android video
 * @author wuhuiyao(wuhuiyao@baidu.com)
 */

import './index.styl';
import {
    formatTime
} from './helper';
import Barrage from './Barrage';
import fullscreen from './fullscreen';
import controls from './controls';
import gesture from './gesture';
import api from './api';
import videoSlot from './slot';
import {internalDataComputedCreator, typesCast} from '../computedCreator';

// 缓存竖屏时候的屏幕宽高
// const SCREEN_WIDTH = screen.width > screen.height ? screen.height : screen.width;
// const SCREEN_HEIGHT = screen.width > screen.height ? screen.width : screen.height;

export default Object.assign({
    behaviors: ['nativeEventEffect'],

    /**
     * Video 组件初始化状态
     *
     * @return {Object}
     */
    initData() {
        return {
            id: this.id, // id 默认组件 id
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
            showProgress: null,
            enableProgressGesture: true,
            showFullscreenBtn: true,

            // 私有状态
            __src: '',
            __poster: '',
            __sanId: this.id,
            __slotId: `${this.id}_slot`,
            __isFullscreen: false,
            __isPlaying: false,
            __isShowDanmu: false,
            __isMuted: false,
            __totalSeconds: 0,
            __playedSeconds: 0,
            __isPlayEnded: false,
            __isPlayError: false,
            __isProgressSliderFocus: false,
            __showControls: true,
            __isVideoOpened: false,
            __isPageGestureUpProgress: false,
            __isPageGestureProgressForward: false,
            __isPageGestureUpVoiceLight: false,
            __isUpLightState: false,
            __voicePercent: 0,
            __lightPercent: 0,
            __showLoading: false,
            __isLockFullscreen: false,
            __showNoWifiTip: false,
            __currVideoWidth: 0,
            __isVideoFocus: false,
            __noNetwork: false
        };
    },

    template: require('./video.tpl'),

    computed: {
        ...internalDataComputedCreator([
            {name: 'hidden', caster: typesCast.boolCast},
            {name: 'initialTime', caster: typesCast.numCast},
            {name: 'duration', caster: typesCast.numCast},
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
            {name: 'pageGesture', caster: typesCast.boolCast},
            {name: 'showProgress', caster: typesCast.boolCast, default: true},
            {name: 'showFullscreenBtn', caster: typesCast.boolCast, default: true},
            {name: 'enableProgressGesture', caster: typesCast.boolCast, default: true}
        ]),
        videoWrapStyle() {
            if (this.data.get('__hidden')) {
                return 'display: none';
            }

            let isFullscreen = this.data.get('__isFullscreen');
            if (isFullscreen) {
                // width/height 不能设置屏幕大小，刘海屏下会有问题
                return 'position: fixed !important; left: 0 !important; '
                    + 'top: 0 !important; width:100% !important;'
                    + 'height:100% !important; margin: 0 !important;';
            }
            return '';
        },
        slotStyle() {
            let isFullscreen = this.data.get('__isFullscreen');
            if (isFullscreen) {
                return 'width:100% !important;'
                    + 'height:100% !important;';
            }
            return '';
        },
        videoStyle() {
            let objectFit = this.data.get('__objectFit');
            return `object-fit: ${objectFit}`;
        },
        isVideoFullscreenLock() {
            return this.data.get('__isFullscreen') && this.data.get('__isLockFullscreen');
        },
        videoControlStyle() {
            let isLock = this.data.get('isVideoFullscreenLock');
            return (!isLock && this.data.get('__showControls')) ? '' : 'display: none';
        },
        videoBackControlStyle() {
            let isLock = this.data.get('isVideoFullscreenLock');
            let show = this.data.get('isPlayErrorOrEnd');
            show || (show = !isLock && this.data.get('__showControls'));
            return show ? '' : 'display: none';
        },
        videoLockBtnStyle() {
            return this.data.get('__showControls') ? '' : 'display: none';
        },
        videoTotalSeconds() {
            return this.data.get('__totalSeconds') || this.data.get('__duration');
        },
        videoTotalTime() {
            return formatTime(this.data.get('videoTotalSeconds'));
        },
        videoPlayedTime() {
            return formatTime(this.data.get('__playedSeconds'));
        },
        videoPlayedPercent() {
            let total = this.data.get('videoTotalSeconds');
            let played = this.data.get('__playedSeconds');
            let percent = total ? Number(played * 100 / total).toFixed(2) : 0;
            if (percent > 100) {
                percent = 100;
            }
            return percent;
        },
        voiceLightStateIconClass() {
            let isUpLight = this.data.get('__isUpLightState');
            let classNames = ['swan-video-up-state-icon'];
            if (isUpLight) {
                classNames.push('swan-video-i-brightness');
            }
            else {
                classNames.push(
                    this.data.get('__isMuted')
                    ? 'swan-video-i-voice-muted' : 'swan-video-i-voice'
                );
            }
            return classNames.join(' ');
        },
        videoShowProgress() {
            let hasSetShowProgress = this.data.get('showProgress') != null;
            if (!hasSetShowProgress) {
                return this.data.get('__isFullscreen')
                    || this.data.get('__currVideoWidth') > 240;
            }

            return this.data.get('__showProgress');
        },
        isPlayErrorOrEnd() {
            return this.data.get('__isPlayEnded') || this.data.get('__isPlayError');
        }
    },

    /**
     * 组件创建完成生命周期钩子
     *
     * @private
     */
    created() {
        // 是否显示弹幕按钮及显示弹幕，只在初始化时有效，不能动态变更
        this.data.set('__isShowDanmu', this.data.get('__enableDanmu'));
        this.data.set('__showDanmuBtn', this.data.get('__danmuBtn'));

        // 初始化当前静音状态
        this.data.set('__isMuted', this.data.get('__muted'));

        // 初始化屏幕默认亮度
        const self = this;
        this.swan.getScreenBrightness({
            success(res) {
                self.data.set('__lightPercent', Math.floor(res.value * 100) || 0);
            }
        });

        // 忽略首次空 src 抛出来错误，避免线上爱奇艺先报错再正常播放现象
        let src = this.data.get('src');
        if (!src) {
            this.ignoreError = true;
        }

        // 监听 src 变化
        this.watch('src', src => {
            this.initVideoSrc();

            if (!this.el) { /* istanbul ignore next */
                return;
            }

            // 自动播放，直接显示 loading，video 内核不会立刻触发 waiting 事件，
            // 可能会导致视频黑屏，所以直接先显示 loading
            let isAutoPlay = this.data.get('__autoplay');
            this.updatePlayState({
                isEnd: false,
                isPlaying: isAutoPlay,
                isLoading: isAutoPlay
            });
            this.data.set('__totalSeconds', 0);
        });
        this.initVideoSrc();

        // 监听 poster 变化
        this.watch('poster', () => this.initVideoPoster());
        this.initVideoPoster();

        // 监听视频 focus 消息
        this.communicator.onMessage('androidVideoFocus', msg => {
            let data = msg && msg.data;
            let focusVideoId = data && data.videoId;
            if (focusVideoId && this.id !== focusVideoId) {
                // 失去 `焦点` 的视频，要移除所有界面控件保留中心播放按钮（前提开发者允许显示播放中心按钮），
                // 且点击其它位置除了中心按钮包括手势动作都不能响应
                this.data.set('__isVideoFocus', false);
                this.data.set('__showControls', true);
                this.updatePlayState({isLoading: false});

                this.clearAutoHideControlTask();
            }
        });
    },

    /**
     * 组件 Attached 到 dom 生命周期钩子
     *
     * @private
     */
    attached() {
        let videoEle = this.ref('video');

        // XXX: 模板里绑定的 loop/muted/autoplay boolean 属性，不管是否 false，生成
        // dom 属性都成 true，只能通过 js 操作初始化了
        videoEle.loop = this.data.get('__loop');
        this.watch('muted', () => this.toggleMuted(this.data.get('__muted')));
        this.watch('loop', () => (videoEle.loop = this.data.get('__loop')));
        this.watch('autoplay', () => this.initAutoplay());

        // 初始化视频宽度，用于同步播放进度条显示状态
        this.widthInitTimer = setTimeout(
            () => this.data.set('__currVideoWidth', this.el.clientWidth)
        );
        this.watch('hidden', val => {
            if (val) {
                this.pause();
            }

            this.nextTick(
                () => this.data.set('__currVideoWidth', this.el.clientWidth)
            );
        });

        // 初始化自动播放
        this.initAutoplay();

        // 初始化弹幕
        this.barrage = new Barrage(
            this.ref('danmu'), this.data.get('danmuList')
        );

        // 初始化全屏监听器
        this.initFullscreenListener();

        // 初始化 swan createVideoContext 导出的 API 注册
        this.initAPIRegister();

        // 初始化 slot
        this.initSlot();
    },

    /**
     * 组件销毁生命周期钩子
     *
     * @private
     */
    detached() {
        clearTimeout(this.widthInitTimer);
        this.clearAutoHideControlTask();
        this.removeFullscreenListener();
        this.destroySlot();
    },

    /**
     * 初始化 video poster
     *
     * @private
     */
    initVideoPoster() {
        let poster = this.normalizeResourcePath(this.data.get('poster'));
        this.data.set('__poster', poster);
    },

    /**
     * 初始化 video src
     *
     * @private
     */
    initVideoSrc() {
        let src = this.data.get('src') || '';
        this.data.set('__src', src + '');
    },

    /**
     * 转为 file 协议的沙盒路径
     *
     * @param {string} path 原始路径
     * @return {string} 原始路径/file 协议路径
     */
    normalizeResourcePath(path) {
        if (!path || /^(data|http|https|bdfile|file):/i.test(path)) {
            return path || '';
        }

        return `file://${this.absolutePathResolve(path)}`;
    },

    /**
     * 设置视频播放音量
     *
     * @param {number} percent 播放音量百分比值
     * @param {boolean=} ignoreMuted 是否忽略静音初始化
     */
    setVideoVolume(percent, ignoreMuted) {
        this.data.set('__voicePercent', percent);
        ignoreMuted || this.data.set('__isMuted', percent === 0);

        let videoEle = this.ref('video');
        videoEle.volume = percent / 100;
    },

    /**
     * 设置屏幕亮度
     *
     * @param {number} percent 设置的亮度百分比值
     */
    setScreenBrightness(percent) {
        this.data.set('__lightPercent', percent);
        this.swan.setScreenBrightness({
            value: percent / 100
        });
    },

    /**
     * 更新播放状态
     *
     * @param {boolean=} options.isEnd 是否播放结束
     * @param {boolean=} options.hasError 是否播放失败
     * @param {boolean=} options.isPlaying 是否播放中
     * @param {boolean=} options.isLoading 是否加载缓冲中
     */
    updatePlayState(options) {
        let {isEnd, hasError, isPlaying, isLoading} = options;
        this.data.set('__isPlayEnded', !!isEnd);
        this.data.set('__isPlayError', !!hasError);
        this.data.set('__isPlaying', !!isPlaying);
        this.data.set('__showLoading', !!isLoading);
    },

    /**
     * 视频容器点击的事件处理
     *
     * @private
     */
    onVideoWrapClick() {
        // 还未打开过视频 或者 未聚焦 或者 播放完成、出错 不做任何处理
        if (!this.data.get('__isVideoOpened')
            || !this.data.get('__isVideoFocus')
            || this.data.get('isPlayErrorOrEnd')) {
            return;
        }

        this.toggleControlShow(!this.data.get('__showControls'));
    },

    /**
     * 播放时长变更事件处理
     *
     * @private
     * @param {Object} e 事件对象
     */
    onDurationChange(e) {
        let duration = +e.target.duration || 0;
        if (!Number.isFinite(duration)) {
            duration = 0;
        }
        this.data.set('__totalSeconds', duration);
    },

    /**
     * 已经播放的时间更新事件处理
     *
     * @param {Object} e 事件对象
     */
    onTimeUpdate(e) {
        let currentTime = e.target.currentTime;
        this.dispatchEvent('bindtimeupdate', {
            detail: {
                currentTime,
                duration: e.target.duration,
                videoId: this.data.get('id')
            }
        });

        if (this.data.get('__isShowDanmu')) {
            // 播放当前时间的弹幕
            this.barrage.play(currentTime);
        }

        // 当前进度在拖拽过程中，不更新当期已经播放的时间，显示当前进度拖拽的更新
        if (this.data.get('__isProgressSliderFocus')
            || this.data.get('__isPageGestureUpProgress')
        ) {
            return;
        }

        this.data.set('__playedSeconds', currentTime);
    },

    /**
     * 开启/关闭静音
     *
     * @param {boolean=} isMuted 是否静音操作
     */
    toggleMuted(isMuted) {
        if (isMuted === undefined) {
            isMuted = !this.data.get('__isMuted');
        }
        this.data.set('__isMuted', isMuted);

        let videoEle = this.ref('video');
        videoEle.muted = isMuted;
    },

    /**
     * 播放结束事件处理
     *
     * @private
     */
    onPlayEnded() {
        this.updatePlayState({isEnd: true});

        this.dispatchEvent('bindended', {
            detail: {
                videoId: this.data.get('id')
            }
        });
    },

    /**
     * 播放开始事件处理
     *
     * @private
     */
    onPlayStart() {
        this.dispatchEvent('bindplay', {
            detail: {
                videoId: this.data.get('id')
            }
        });

        // 延后设置默认静音，避免后续设置系统音量把默认静音又给覆盖
        this.initDefaultMuted();
    },

    /**
     * 初始化视频默认静音设置
     *
     * @private
     */
    initDefaultMuted() {
        if (!this._initMutedSet) {
            let muted = this.data.get('__muted');
            muted && this.toggleMuted(muted);
            this._initMutedSet = true;
        }
    },

    /**
     * 初始化媒体音量
     *
     * @param {boolean=} ignoreMuted 是否忽略静音初始化
     * @private
     */
    initMediaVolume(ignoreMuted) {
        // 用系统的音量进行初始化
        let volume = this.boxjs.layer({name: 'getMediaVolumeSync'}) || 0;
        volume && (volume = +volume.value || 0);
        this.setVideoVolume(Math.floor(volume * 100), ignoreMuted);

        if (!this.data.get('__isVideoFocus')) {
            this.data.set('__isVideoFocus', true);

            // 发送当前视频 `focus` 状态，通知其它视频处于 `blur` 状态
            this.communicator.fireMessage({
                type: 'androidVideoFocus',
                data: {
                    videoId: this.id
                }
            });
        }
    },

    /**
     * 播放暂停事件处理
     *
     * @private
     */
    onPlayPause() {
        // 目前视频实现是单例模式，包括锁屏等其他操作也会导致视频自动暂停，因此监听到该事件
        // 还需更新状态
        this.data.set('__isPlaying', false);
        this.dispatchEvent('bindpause', {
            detail: {
                videoId: this.data.get('id')
            }
        });
    },

    /**
     * 播放中事件处理
     *
     * @private
     */
    onPlaying() {
        this.updatePlayState({isPlaying: true});

        // 启用设备方向监听
        this.initDeviceOrientationListener();
    },

    /**
     * 播放缓冲中事件处理
     *
     * @private
     */
    onPlayWaiting() {
        this.updatePlayState({isLoading: true, isPlaying: true});
        this.dispatchEvent('bindwaiting', {
            detail: {
                videoId: this.data.get('id')
            }
        });
    },

    /**
     * 播放出错事件处理
     *
     * @private
     * @param {Object} e 事件对象
     */
    onPlayError(e) {
        if (this.ignoreError) {
            return;
        }
        this.ignoreError = false;

        this.updatePlayState({hasError: true});
        this.dispatchEvent('binderror', {
            detail: {
                videoId: this.data.get('id')
            }
        });
    },

    /**
     * 视频元数据加载完成事件回调
     *
     * @private
     */
    onLoadedMetaData() {
        // initialTime 得这个时刻设置才有效
        let initialTime = this.data.get('__initialTime');
        this.seek(initialTime || 0);
    },

    /**
     * 设置播放开始位置
     *
     * @param {number} initialTime 开发播放的时间
     */
    seek(initialTime) {
        let videoEle = this.ref('video');
        videoEle.currentTime = initialTime || 0;
        this.data.set('__playedSeconds', videoEle.currentTime);
    },

    /**
     * 显示/隐藏弹幕
     */
    toggleDanmu() {
        let show = !this.data.get('__isShowDanmu');
        this.data.set('__isShowDanmu', show);
        if (!show) {
            this.barrage.clear();
        }
    },

    /**
     * 暂停/播放视频
     *
     * @param {boolean} isPlay 是否播放
     */
    togglePlay(isPlay) {
        isPlay = !!isPlay;
        this.updatePlayState({isPlaying: isPlay, isLoading: isPlay});

        let videoEle = this.ref('video');

        // 由于目前无法监听到手机音量调节，只能每次播放/暂停重新读取手机音量进行初始化
        // 确保所有视频音量播放跟手机音量保持一致，手机内部的静音操作，会缓存上次音量，下次
        // 恢复非静音会自动把上次缓存音量重新设置到系统音量上，这点跟之前 NA 方案不一致，视频
        // 静音并不会去改系统音量，而目前方案静音操作会改手机音量
        // 目前方案还有两个问题：
        // 手机音量初始 0，播放视频显示静音效果，播放过程中调手机音量调为40%，
        // 手机的静音图标没有变成非静音图标，其次，非静音切静音，调节手机音量，
        // 静音图标没有变成非静音图标
        this.initMediaVolume();

        // 初始化设备方向监听
        isPlay && this.initDeviceOrientationListener();

        try {
            let result;
            if (isPlay) {
                result = videoEle.play();
            }
            else {
                result = videoEle.pause();
            }

            if (result && typeof result.then === 'function') {
                result.then(null, err => {
                    this.onPlayError(err);
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            this.onPlayError(e);
        }
    },

    /**
     * 播放视频
     */
    play() {
        if (this.data.get('__isPlaying')) {
            return;
        }

        // 还未打开过视频，说明是首次触发播放，播放后，直接隐藏控件
        if (!this.data.get('__isVideoOpened')) {
            this.toggleControlShow(false);
        }

        if (this.data.get('isPlayErrorOrEnd')) {
            this.updatePlayState({isEnd: false});
        }

        // 点击播放时候，需要 check wifi 情况
        this.initNoWifiPlayState(this.togglePlay.bind(this, true));
    },

    /**
     * 暂停播放视频
     */
    pause() {
        if (!this.data.get('__isPlaying')) {
            return;
        }

        this.togglePlay(false);
    },

    /**
     * 发送弹幕
     *
     * @param {Object} opts 弹幕选项
     * @param {string} opts.text 弹幕文本
     * @param {string=} opts.color 弹幕颜色，可选
     */
    sendDanmu(opts) {
        if (!opts) {
            return;
        }

        let danmu = Object.assign({}, opts, {time: this.data.get('__playedSeconds')});
        if (this.data.get('__isPlaying')
            && this.data.get('__isShowDanmu')
        ) {
            this.barrage.shoot(danmu);
        }
        else {
            this.barrage.add(danmu);
        }
    }

}, fullscreen, controls, gesture, api, videoSlot);
