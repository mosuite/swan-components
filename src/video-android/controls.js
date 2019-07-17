/**
 * @file Video control behavior
 * @author wuhuiyao@baidu.com
 */

/**
 * 缓存非 wifi 下视频播放，用户选择是否继续播放操作信息 key
 *
 * @const
 * @type {string}
 */
const NO_WIFI_PLAY_CACHE_KEY = 'swan-video-no-wifi-play';

/**
 * 缓存当前没有 wifi 下是否允许自动播放用户选择操作
 *
 * @type {boolean}
 */
let allowPlayWhenNoWifi = false;

export default {

    /**
     * 初始化当前网络情况，是否处在 wifi 网络下，同时获取此前用户在非 wifi 下选择操作信息
     *
     * @private
     * @param {Function} callback 初始化完毕要执行回调
     * @return {*}
     */
    initNoWifiPlayState(callback) {
        if (this.wifiInited) {
            return this.data.get('__showNoWifiTip')
                || callback.call(this);
        }

        if (this.wifiIniting) {
            return;
        }
        this.wifiIniting = true;

        let swan = this.swan;
        let counter = 0;
        let hasWifi = false;
        let hasNoNetwork = false;
        let done = () => {
            counter++;
            if (counter >= 2) {
                this.wifiInited = true;
                this.wifiIniting = false;

                let showNoWifiTip = hasNoNetwork || (!allowPlayWhenNoWifi && !hasWifi);
                this.data.set('__showNoWifiTip', showNoWifiTip);
                this.data.set('__noNetwork', hasNoNetwork);

                // 如果显示无 wifi 提示，则不执行回调
                if (!showNoWifiTip) {
                    callback.call(this);
                }
            }
        };

        this.wifiInited = false;

        // 获取网络状态
        swan.getNetworkType({
            complete(res) {
                // 获取网络状态失败，当做没 wifi 处理
                let networkType = res && res.networkType;
                hasWifi = networkType === 'wifi';
                hasNoNetwork = networkType === 'none';
                done();
            }
        });

        // 获取没 wifi 用户的历史操作信息：是否点了继续播放
        swan.getStorage({
            key: NO_WIFI_PLAY_CACHE_KEY,
            complete(res) {
                // 获取缓存的操作信息失败，则默认不允许自动播放，没 wifi 情况下
                allowPlayWhenNoWifi = !!(res && +res.data);
                done();
            }
        });
    },

    /**
     * 初始化自动播放
     */
    initAutoplay() {
        let isAutoplay = this.data.get('__autoplay');

        if (isAutoplay) {
            this.initNoWifiPlayState(() => {
                let videoEle = this.ref('video');
                this.play();
                videoEle.autoplay = true;
            });
        }
        else {
            let videoEle = this.ref('video');
            videoEle && (videoEle.autoplay = isAutoplay);
        }
    },

    /**
     * 清除播放控件自动隐藏任务
     */
    clearAutoHideControlTask() {
        if (this.autoHideControlsTask) {
            clearTimeout(this.autoHideControlsTask);
            this.autoHideControlsTask = null;
        }
    },

    /**
     * 初始化播放控件自动隐藏任务
     */
    initAutoHideControlTask() {
        this.clearAutoHideControlTask();
        this.autoHideControlsTask = setTimeout(
            /* istanbul ignore next */
            () => this.data.set('__showControls', false), 3000
        );
    },

    /**
     * 显示/隐藏播放控件
     *
     * @param {boolean} isShow 是否显示播放控件
     */
    toggleControlShow(isShow) {
        this.data.set('__isVideoOpened', true);
        this.data.set('__showControls', isShow);

        // 初始化播放控件自动隐藏任务
        if (isShow) {
            this.initAutoHideControlTask();
        }
    },

    /**
     * 非 Wifi 网络，继续播放事件处理
     *
     * @private
     * @param {Object} e 事件对象
     */
    onGoOnPlaying(e) {
        e.stopPropagation();

        this.data.set('__showNoWifiTip', false);

        // 对于没网情况，重试获取网络状态
        if (this.data.get('__noNetwork')) {
            this.wifiInited = false;
            this.play();
            return;
        }

        // 缓存没有 WIFI 下操作状态
        this.swan.setStorageSync(NO_WIFI_PLAY_CACHE_KEY, '1');
        allowPlayWhenNoWifi = true;

        this.play();
    },


    /**
     * 视频中心按钮/播放底部 bar 左侧播放按钮：播放/暂停事件处理
     *
     * @private
     * @param {Object} e 事件对象
     */
    onTogglePlay(e) {
        e.stopPropagation();

        let isPlay = !this.data.get('__isPlaying');
        if (isPlay) {
            this.play();
        }
        else {
            this.pause();
        }
    },

    /**
     * 播放底部 bar 弹幕按钮 显示/隐藏弹幕 事件处理
     *
     * @private
     * @param {Object} e 事件对象
     */
    onToggleDanmuShow(e) {
        e.stopPropagation();
        this.toggleDanmu();
    },

    /**
     * 播放底部 bar 静音/不静音按钮事件处理
     *
     * @private
     * @param {Object} e 事件对象
     */
    onToggleAudio(e) {
        e.stopPropagation();

        // 目前静音也是修改的系统音量为0，跟线上 NA 方案不同，同时视频会缓存静音前音量，
        // 切换回非静音后会变成之前缓存音量
        let muted = this.data.get('__isMuted');
        if (!muted) {
            // 非静音变成静音，初始化系统的音量，避免重新打开静音，音量又变成初始音量
            this.initMediaVolume(true);
        }

        this.toggleMuted();
    },

    /**
     * 全屏/退出全屏事件处理
     *
     * @private
     * @param {Object} e 事件对象
     */
    onToggleFullscreen(e) {
        e.stopPropagation();
        this.toggleFullscreen();
    },

    /**
     * 全屏状态下点击左侧导航返回事件处理
     *
     * @private
     * @param {Object} e 事件对象
     */
    onFullscreenBack(e) {
        e.stopPropagation();
        this.toggleFullscreen(false);
    },

    /**
     * 全屏状态下，点击锁屏按钮事件处理
     *
     * @private
     * @param {Object} e 事件对象
     */
    onToggleFullscreenLock(e) {
        e.stopPropagation();

        let isLockFullscreen = this.data.get('__isLockFullscreen');
        this.data.set('__isLockFullscreen', !isLockFullscreen);
    },

    /**
     * 播放完成/播放视频重新播放的事件处理
     *
     * @private
     */
    onRePlay() {
        this.seek(0);
        this.play();
    }
};
