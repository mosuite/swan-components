/**
 * @file bdml's file's base elements <TrackLog>
 * @author wangyang(wangyang02@baidu.com)
 */
import style from './index.css';

import {config} from './config';
import {attrValBool} from '../utils';
import getObserverInstance from '../utils/getObserverInstance';

/**
 * 基础数据
 *
 * @type {Object}
 */
const logData = {};

export default {
    constructor(props) {
        /**
         * 判断可视状态的计时器id
         * 被置为0时表示当前没有在计时
         *
         * @type {number}
         */
        this.visibleTimer = 0;

        /**
         * 是否已经发送了可视展现日志
         *
         * @type {boolean}
         */
        this.isVisibleLogged = false;
    },

    behaviors: ['userTouchEvents', 'noNativeBehavior', 'animateEffect'],

    template: '<swan-track-log s-ref="trackEle"><slot></slot></swan-track-log>',

    initData() {
        return {
            type: '',
            params: '',
            visibleRatio: config.defaultVisibleRatio,
            visibleDuration: config.defaultVisibleDuration,
            coveringDetection: false,
            loadLog: false
        };
    },

    /**
     * 发送请求
     *
     * @param {string} options.url 请求url
     * @param {Object} options.data 要发送的数据，会跟logData中已有的字段合并
     * @param {string} [options.method = 'POST'] 请求方式，可选
     * @param {Object} [options.header = {}] 请求头，可选
     * @param {string} [options.dataType = 'json'] 响应类型，可选
     * @param {Function} [options.success] 请求成功的回调函数，可选
     * @param {Function} [options.fail] 请求失败的回调函数，可选
     * @param {number} [retryDelay = 1000] 如果请求失败，在重试之前需要延迟的时间，单位是ms，可选，默认1000
     */
    request(options, retryDelay = config.requestRetryFirstDelay) {
        this.swan.request({
            url: options.url,
            data: options.data,
            method: options.method || 'POST',
            header: Object.assign({
                'content-type': 'application/json'
            }, options.header),
            dataType: options.dataType || 'json',

            success(res) {
                delete options.data.rtc;
                options.success && options.success(res);
            },

            fail(err) {
                options.data.rtc = (options.data.rtc || 0) + 1;

                if (options.data.rtc <= config.maxRequestRetryCount) {
                    setTimeout(() => this.request(options, retryDelay * config.requestRetryMultiple), retryDelay);
                }
                else {
                    options.data.rtc = 0;
                    options.fail && options.fail(err);
                }
            }
        });
    },

    /**
     * 获取网络类型
     *
     * @return {Promise<Object>} 返回网络类型对象
     */
    getNetworkType() {
        if (logData.networkType) {
            return Promise.resolve(logData.networkType);
        }

        return this.boxjs.device.networkType().then(res => {
            logData.networkType = res.networkType;
        });
    },

    /**
     * 发送事件日志
     *
     * @param {Object} data 参数
     */
    trackEvent(data) {
        // 先从小程序存储中读取百度统计sdk写的mtj_key
        if (!logData.keyData) {
            logData.keyData = this.swan.getStorageSync('mtj_key');
            logData.uuid = this.swan.getStorageSync('mtj_uuid');
        }

        // 移动统计sdk获取key要访问手百的服务器，速度可能会比较慢，需要重试机制
        if (!logData.keyData) {
            setTimeout(() => this.trackEvent(data), config.getKeyRetryDelay);
            return;
        }

        logData.sid = logData.sid || Math.floor(Math.random() * 0xffffffff);
        logData.rqc = (logData.rqc || 0) + 1;

        if (!logData.appInfo) {
            logData.appInfo = this.boxjs.data.get({name: 'swan-appInfoSync'});
        }

        if (!logData.systemInfo) {
            logData.systemInfo = this.boxjs.device.systemInfo({type: 'sync'});
        }

        this.getNetworkType().then(networkType => this.request({
            url: config.logServerUrl,
            dataType: 'text',
            data: Object.assign({
                type: 0,
                key: logData.keyData.bdstatistic_key,
                officialNo: logData.keyData.official_no,
                containerNo: logData.keyData.container_no,
                uuid: logData.uuid,
                appid: logData.appInfo.appid,
                cuid: logData.appInfo.cuid,
                mtjcuid: logData.appInfo.mtjCuid,
                aso: {
                    scene: '' + (logData.appInfo.scene || '')
                },
                system: {
                    version: logData.systemInfo.version,
                    SDKVersion: logData.systemInfo.SDKVersion,
                    system: logData.systemInfo.system
                },
                network: {
                    networkType
                },
                sid: logData.sid,
                rid: Math.floor(Math.random() * 0xffffffff),
                rqc: logData.rqc
            }, data)
        }));
    },

    /**
     * 发送track-log组件的事件日志
     *
     * @param {string} eventName 事件名称
     */
    sendTrackLogEvent(eventName) {
        this.trackEvent({
            et: 'tracklog',
            en: eventName,
            ep: {
                type: this.type,
                params: this.params
            }
        });
    },

    /**
     * 获取当前组件的可视状态
     * 可视状态取决于两个条件：
     * 1.是否位于屏幕可视区域内
     * 2.是否被其他元素遮挡
     *
     * @return {boolean} 当前组件的可视状态
     */
    getVisibility() {
        /**
         * 当前组件元素的位置和宽高
         *
         * @type {DOMRect}
         */
        const elRect = this.el.getBoundingClientRect();

        /**
         * 用来判断可视状态的检测区域
         * 如果visibleRatio大于0.5，该区域是个正常的矩形
         * 如果visibleRatio等于0.5，该区域为1x1或2x2，位于元素正中心
         * 如果visibleRatio小于0.5，该区域的top在bottom下面，left在right右侧
         *
         * @type {Object}
         */
        const checkRect = {
            top: elRect.bottom - elRect.height * this.visibleRatio + 1,
            bottom: elRect.top + elRect.height * this.visibleRatio - 1,
            left: elRect.right - elRect.width * this.visibleRatio + 1,
            right: elRect.left + elRect.width * this.visibleRatio - 1
        };

        // 如果检测区域的任意一个边界超出屏幕，则认为不可视
        if (checkRect.top < 0
            || checkRect.bottom >= window.innerHeight
            || checkRect.left < 0
            || checkRect.right >= window.innerWidth) {
            return false;
        }

        // 如果不识别遮挡，到这里就可以认为是可视了，直接返回true
        if (!this.coveringDetection) {
            return true;
        }

        // 为提高效率，如果visibleRatio等于0.5，只要一个中心点没有被遮挡就算可视
        if (this.visibleRatio === 0.5) {
            return this.el.contains(document.elementFromPoint(checkRect.left, checkRect.top));
        }

        /**
         * 用来判断遮挡情况的检测点数组
         *
         * @type {Array}
         */
        const checkPoints = [
            [checkRect.left, checkRect.top],
            [checkRect.right, checkRect.top],
            [checkRect.left, checkRect.bottom],
            [checkRect.right, checkRect.bottom]
        ];

        /**
         * 没有被其他元素遮挡的检测点数组
         *
         * @type {Array}
         */
        const visiblePoints = checkPoints.filter(([x, y]) => this.el.contains(document.elementFromPoint(x, y)));

        // 如果visibleRatio小于0.5，只要2个检测点没有被遮挡就算可视
        // 否则需要4个检测点都没有被遮挡才算可视
        return (this.visibleRatio < 0.5 && visiblePoints.length >= 2) || visiblePoints.length === 4;
    },

    /**
     * 检测可视展现状态，可视时长超过visibileDuration才算一次可视展现
     */
    checkVisibleDuration() {
        // 满足这些条件就直接返回：已经发过可视展现日志，或正在计时中，或当前不可视
        if (this.isVisibleLogged) {
            return;
        }

        const visibilityObserver = getObserverInstance('track-log', {
            threshold: [0, .5]
        });

        // this.enterTime = Date.now(); // 默认可见
        visibilityObserver.observe(this.el, entry => {
            const {
                intersectionRatio,
                isIntersecting,
                time,
                target
            } = entry;

            if (!this.starTime && intersectionRatio > 0.5) {
                this.starTime = time;
            }

            if (!isIntersecting && this.starTime) {
                if (time - this.starTime >= this.visibleDuration) {
                    visibilityObserver.unobserve(target);
                    this.isVisibleLogged = true;
                    this.dispatch('visible');
                    this.sendTrackLogEvent('visible');
                }
                else {
                    this.starTime = 0;
                }
            }
        });
    },

    compiled() {
        // 监控点击
        this.bindAction('bindtap', () => this.sendTrackLogEvent('tap'));
    },

    attached() {
        /**
         * 组件类型，用于记录日志
         *
         * @type {string}
         */
        this.type = this.data.get('type');

        /**
         * 组件参数，用于记录日志
         *
         * @type {string}
         */
        this.params = this.data.get('params');

        /**
         * 用户自定义的可视展现比例
         *
         * @type {number}
         */
        const userDefinedVisibleRatio = +this.data.get('visibleRatio');

        if (userDefinedVisibleRatio > 0 && userDefinedVisibleRatio <= 1) {
            this.visibleRatio = userDefinedVisibleRatio;
        }

        /**
         * 用户自定义的可视展现时长
         *
         * @type {number}
         */
        const userDefinedVisibleDuration = +this.data.get('visibleDuration');

        if (Number.isSafeInteger(userDefinedVisibleDuration) && userDefinedVisibleDuration >= 0) {
            this.visibleDuration = userDefinedVisibleDuration;
        }

        /**
         * 是否识别遮挡
         *
         * @type {boolean}
         */
        this.coveringDetection = attrValBool(this.data.get('coveringDetection'));

        /**
         * 是否发送展现日志
         *
         * @type {boolean}
         */
        this.loadLog = attrValBool(this.data.get('loadLog'));

        if (this.loadLog) {
            this.sendTrackLogEvent('load');
        }

        // 监控可视展现
        this.checkVisibleDuration();
    }
};
