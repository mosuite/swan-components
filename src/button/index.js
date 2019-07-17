/**
 * @file bdml's file's base elements <image>
 * @author houyu(houyu01@baidu.com)
 *         jianglian(jianglian01@baidu.com)
*/
import style from './index.css';
import {attrValBool, privateKey, isEqualObject, computeDistance} from '../utils';
import {internalDataComputedCreator, typesCast} from '../computedCreator';

const LAUNCH_APP_GET_DATA_ERROR_CODE = 1001;
const LAUNCH_APP_GET_DATA_ERROR_MSG = '打开APP失败，获取最低使用要求数据失败';
const LAUNCH_APP_NO_APP_CODE = 1002;
const LAUNCH_APP_NO_APP_MSG = '打开App失败，本地没有安装App';
const LAUNCH_APP_NOT_VALID_CODE = 1003;
const LAUNCH_APP_NOT_VALID_MSG = '打开APP失败，用户未达到最低使用要求';

export default {

    behaviors: [
        'userTouchEvents',
        'nativeEventEffect',
        'noNativeBehavior',
        'hoverEffect',
        'animateEffect',
        'nativeCover'
    ],

    constructor() {
        this.isNAButton = false;
    },

    initData() {
        return {
            privateStyle: style,
            privateClass: '',
            size: 'default',
            type: 'default',
            plain: false, // 按钮是否镂空，背景色透明
            disabled: false,
            loading: false,
            hoverClass: style['button-hover'],
            hoverStartTime: 20,
            hoverStayTime: 70,
            formType: 'buttonclick',
            hidden: false,
            [privateKey]: {
                componentId: this.id,
                isIos: this.swaninterface.boxjs.platform.isIOS()
            }
        };
    },

    computed: {

        /**
         * 创建私有属性，供模板使用
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
        },
        ...internalDataComputedCreator([
            {name: 'privateClass', caster: typesCast.stringCast},
            {name: 'size', data: ['default', 'mini']},
            {name: 'type', data: ['default', 'primary', 'warn']},
            {name: 'plain', caster: typesCast.boolCast},
            {name: 'disabled', caster: typesCast.boolCast},
            {name: 'loading', caster: typesCast.boolCast},
            {name: 'formType', data: ['buttonclick', 'submit', 'reset']}
        ])
    },

    template: `<swan-button type="{{__type}}"
        class="{{privateStyle[__size]}} {{__privateClass}} {{__disabled ? 'swan-button-disabled' : ''}}
        {{provideData.isIos ? 'swan-button-radius-ios' : ''}}"
        loading="{{__loading}}"
        size="{{__size}}"
        plain="{{__plain}}"
        swan-label-target="true"
        data-sanid="{{provideData.componentId}}"
    >
        <slot></slot>
    </swan-button>`,

    created() {
        this.nextTick(() => {
            // 上层组件中包含原生组件时，渲染 NA Button
            this.isNAButton = this.hasNativeParentComponent() ? true : false;
            if (this.isNAButton) {
                this.el.style.visibility = 'hidden';
                this.insertNAButton();
                this.naButtonEventsHandle();
            }
        });
    },

    /**
     * 组件创建
     */
    attached() {
        this.bindAction('bindtap', $event => {
            if (this.data.get('__disabled')) {
                return;
            }
            let formType = this.data.get('__formType');
            this.dispatch(`form:${formType}`);

            let openType = this.data.get('openType'); // 手百开放能力: getUserInfo/getPhoneNumber/share/openSetting/contact/launchApp
            switch (openType) {
                case 'getUserInfo':
                    this.boxjs.data.get({
                        name: 'swan-userInfo',
                        data: {
                            callback: res => {
                                let jsonRes = this.parseDataFromAPI(res);
                                if (jsonRes.data && !jsonRes.data.errno) {
                                    const data = jsonRes.data;
                                    this.dispatchEvent('bindgetuserinfo', {
                                        detail: {
                                            encryptedData: data.data,
                                            errMsg: 'getUserInfo:ok',
                                            iv: data.iv,
                                            userInfo: {
                                                nickName: data.userinfo.nickname,
                                                avatarUrl: data.userinfo.headimgurl,
                                                gender: data.userinfo.sex
                                            }
                                        }
                                    });
                                } else {
                                    this.dispatchEvent('bindgetuserinfo', {
                                        detail: {
                                            errMsg: 'getUserInfo:fail auth deny'
                                        }
                                    });
                                }
                            }
                        }
                    });
                    break;
                case 'getPhoneNumber':
                    this.boxjs.data.get({
                        name: 'swan-phoneNumber',
                        data: {
                            callback: res => {
                                let jsonRes = this.parseDataFromAPI(res);
                                if (jsonRes.data && !jsonRes.data.errno) {
                                    this.dispatchEvent('bindgetphonenumber', {
                                        detail: {
                                            encryptedData: jsonRes.data.data,
                                            errMsg: 'getPhoneNumber:ok',
                                            iv: jsonRes.data.iv
                                        }
                                    });
                                } else {
                                    this.dispatchEvent('bindgetphonenumber', {
                                        detail: {
                                            errMsg: 'getPhoneNumber:fail auth deny'
                                        }
                                    });
                                }
                            }
                        }
                    });
                    break;
                case 'share': {
                    let eventParams = this.getDispatchEventObj({detail: {}});
                    if (eventParams.currentTarget) {
                        eventParams = Object.assign(eventParams, eventParams.currentTarget);
                    }
                    this.dispatch('abilityMessage', {
                        eventType: 'share',
                        eventParams
                    });
                    break;
                }
                case 'openSetting':
                    // 创建二级回调的函数名及函数体
                    this.callbackName = `buttonCallback_${new Date() - 0}_${this.id || ''}`;
                    global[this.callbackName] = args => this.openSettingCallback.call(this, args);
                    this.boxjs.ui.open({
                        name: 'swan-setting',
                        data: {
                            cb: this.callbackName
                        }
                    }).catch(err => {
                        this.dispatchEvent('bindopensetting', {
                            detail: {
                                errMsg: 'getOpensetting:fail auth deny'
                            }
                        });
                    });
                    break;
                case 'contact': {
                    this.callbackName = `buttonCallback_${new Date() - 0}_${this.id || ''}`;
                    // 获取appKey逻辑待2018/11月api重构完成后下移至api中 @renzhonghua
                    const appInfo = this.boxjs.data.get({name: 'swan-appInfoSync'});
                    const appKey = appInfo && appInfo.appId;
                    if (!appKey) {
                        return;
                    }
                    global[this.callbackName] = args => {
                        let jsonRes = typeof args === 'string' ? JSON.parse(args) : args;
                        if (jsonRes.status === 0) {
                            this.dispatchEvent('bindcontact', {
                                detail: {
                                    errMsg: 'enterContact:ok'
                                }
                            });
                        } else {
                            this.dispatchEvent('bindcontact', {
                                detail: {
                                    errMsg: 'enterContact:fail not support'
                                }
                            });
                        }
                    };
                    this.boxjs.ui.open({
                        name: 'swan-IM',
                        data: {
                            appKey,
                            cb: this.callbackName
                        }
                    });
                    break;
                }
                case 'launchApp': {
                    this.boxjs.data.get({
                        name: 'swan-launchAppInfo',
                        data: {
                            callback: res => {
                                let jsonRes = this.parseDataFromAPI(res);
                                let {visitDuration = '', launchCount = ''} = jsonRes.data || {};
                                this.getAuthorityFromServer(visitDuration, launchCount);
                            }
                        }
                    }).catch(err => {
                        this.dispatchEvent('binderror', {
                            detail: {
                                errCode: LAUNCH_APP_NOT_VALID_CODE,
                                errMsg: LAUNCH_APP_NOT_VALID_MSG
                            }
                        });
                    });
                    break;
                }
                case 'faceVerify': {
                    this.boxjs.ui.open({
                        name: 'swan-faceVerify',
                        data: {
                            callback: res => {
                                let jsonRes = this.parseDataFromAPI(res);
                                let detail = {
                                    errMsg: jsonRes.message || 'bindfaceverify:fail auth deny'
                                };
                                if (+jsonRes.status === 0) {
                                    detail = {
                                        callbackKey: jsonRes.data && jsonRes.data.callbackKey,
                                        errMsg: 'bindfaceverify:ok'
                                    };
                                }

                                this.dispatchEvent('bindfaceverify', {
                                    detail
                                });
                            }
                        }
                    }).catch(err => {
                        this.dispatchEvent('bindfaceverify', {
                            detail: {
                                errMsg: err.errMsg || 'bindfaceverify:fail auth deny'
                            }
                        });
                    });
                    break;
                }
            }
        });

        // 声明点击label触发label内第一个控件的事件
        this.communicator.onMessage('LabelFirstTapped',
            message => {
                if (message.data && this.id === message.data.target) {
                    this.fire('bindtap', message.data.event);
                }
            }
        );

        // 响应 Label 发出的事件
        this.communicator.onMessage('LabelTapped',
            message => {
                if (message.data && message.data.target === this.id) {
                    this.fire('bindtap', message.data.event);
                }
            }
        );
    },

    /**
     * 从api获取的数据 转成对象
     *
     * @param {Object|string} data api返回的原始数据
     * @return {Object} json数据
     */
    parseDataFromAPI(data) {
        let result = data;
        if (typeof data === 'string') {
            try {
                result = JSON.parse(data);
            }
            catch (e) {
                result = {};
            }
        }
        return result;
    },

    /**
     * 从server端获取是否有权限打开、下载
     *
     * @param {number} visitDuration 用户停留时常，单位ms
     * @param {number} launchCount 打开小程序次数
     */
    getAuthorityFromServer(visitDuration, launchCount) {
        let scheme = this.data.get('launchScheme');
        let {appId = '', scene = ''} = this.boxjs.data.get({name: 'swan-appInfoSync'});

        this.swan.request({
            url: 'https://mbd.baidu.com/ma/openloadapp',
            method: 'POST',
            dataType: 'json',
            data: {
                appId,
                scene,
                scheme,
                launchCount,
                visitDuration
            },
            header: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            success: res => {
                let data = res.data && res.data.data || {};
                let {canOpenApp = false} = data;
                let needDownload = false;
                needDownload = data.isNeedDownload;

                this.confirmLaunchApp(canOpenApp, needDownload);
            },
            fail: err => {
                this.dispatchEvent('binderror', {
                    detail: {
                        errCode: LAUNCH_APP_GET_DATA_ERROR_CODE,
                        errMsg: LAUNCH_APP_GET_DATA_ERROR_MSG
                    }
                });
            }
        });
    },

    /**
     * 打开前弹窗询问
     *
     * @param {boolean} canOpenApp 是否能打开
     * @param {boolean} needDownload 是否能下载
     */
    confirmLaunchApp(canOpenApp, needDownload) {
        let self = this;
        let isIOS = self.swaninterface.boxjs.platform.isIOS();
        if (canOpenApp) {
            // 如果已安装，需要弹窗提示是否打开app，ios暂不支持查询是否已安装某app
            if (isIOS) {
                self.launchApp(needDownload);
            }
            else {
                self.swan.isAppInstalled({
                    name: isIOS
                        ? self.data.get('appInstalledIosName')
                        : self.data.get('appInstalledAndroidName'),
                    success(res) {
                        if (res.hasApp) {
                            self.swan.showModal({
                                content: '即将离开手机百度，打开'
                                    + self.data.get('launchAppName'),
                                success: res => {
                                    if (res.confirm) {
                                        self.launchApp(needDownload);
                                    }
                                }
                            });
                        }
                        else {
                            // 没安装app
                            self.launchApp(needDownload);
                        }
                    },
                    fail(err) {
                        self.launchApp(needDownload);
                    }
                });
            }
        }
        else {
            self.dispatchEvent('binderror', {
                detail: {
                    errCode: LAUNCH_APP_NOT_VALID_CODE,
                    errMsg: LAUNCH_APP_NOT_VALID_MSG
                }
            });
        }
    },

    /**
     * 调起/下载 app
     *
     * @param {boolean} needDownload 是否需要下载
     */
    launchApp(needDownload) {
        let scheme = this.data.get('launchScheme');
        let isIOS = this.swaninterface.boxjs.platform.isIOS();
        this.boxjs.ui.open({
            name: 'swan-app',
            data: {
                open: encodeURIComponent(scheme),
                download: {
                    url: isIOS
                        ? this.data.get('downloadAppUrlIos') || ''
                        : this.data.get('downloadAppUrlAndroid') || '',
                    from: ''
                },
                url: isIOS
                        ? this.data.get('downloadAppUrlIos') || ''
                        : this.data.get('downloadAppUrlAndroid') || '', // ios有bug，暂时用此字段
                isNeedDownload: needDownload,
                invokAnyWay: true
            }
        }).catch(() => {
            this.dispatchEvent('binderror', {
                detail: {
                    errCode: LAUNCH_APP_NO_APP_CODE,
                    errMsg: LAUNCH_APP_NO_APP_MSG
                }
            });
        });
    },

    // openSetting得二级函数
    openSettingCallback(args) {
        // 维护一个映射，转成统一的key
        const privilegesMap = {
            /* eslint-disable fecs-camelcase */
            mapp_camera: 'scope.camera',
            mapp_choose_address: 'scope.address',
            mapp_choose_invoice: 'scope.invoice',
            mapp_images: 'scope.writePhotosAlbum',
            mapp_location: 'scope.userLocation',
            mapp_record: 'scope.record'
            /* eslint-disable fecs-camelcase */
        };
        let jsonRes = typeof args === 'string' ? JSON.parse(args) : args;
        if (jsonRes.data) {
            let privilegesRes = Object.keys(jsonRes.data)
                .reduce((prev, current) => {
                    if (privilegesMap[current]) {
                        prev[privilegesMap[current]] = !!+jsonRes.data[current];
                    }
                    return prev;
                }, {});
            this.dispatchEvent('bindopensetting', {
                detail: {
                    errMsg: 'openSetting:ok',
                    autoSetting: {
                        ...privilegesRes
                    }
                }
            });
        }
        else {
            this.dispatchEvent('bindopensetting', {
                detail: {
                    errMsg: 'getOpensetting:fail auth deny'
                }
            });
        }
        // 销毁二级回调的函数名及函数体
        global[this.callbackName] = null;
        this.callbackName = null;
    },

    /**
     * 组件销毁时移除贴片
     */
    detached() {
        if (this.isNAButton) {
            this.removeNAButton();
            // 用户传了id先销毁再显示，需要把上一次的事件监听移除。TODO: 后续NA组件传sanId
            this.communicator.delHandler(`button_${this.data.get('id')}`);
            this.hover.touchstartTimeId && clearTimeout(this.hover.touchstartTimeId);
            this.hover.touchendTimeId && clearTimeout(this.hover.touchendTimeId);
        }
    },

    /**
     * slaveUpdated
     * @override
     */
    slaveUpdated() {
        if (this.isNAButton) {
            this.updateNAButton();
        }
    },

    naButtonEventsHandle() {
        this.hover = {};
        let hoverUtil = {
            clearTimeout() {
                clearTimeout(this.hover.touchstartTimeId);
                this.hover.touchstartTimeId = NaN;
            },
            removeHoverClassAndUpdate() {
                this.el.classList.remove(this.data.get('hoverClass'));
                this.updateNAButton();
            }
        };

        // 响应客户端派发到 slave 的事件
        this.communicator.onMessage(`button_${this.data.get('id')}`, event => {
            // hoverClass 处理
            const action = event.params.action;
            const changedTouches = event.params.e.changedTouches;
            if (action === 'touchstart') {
                this.hover = {
                    x: changedTouches[0].clientX,
                    y: changedTouches[0].clientY,
                    time: +(new Date())
                };
                this.hover.time = +(new Date());
                this.hover.touchstartTimeId = setTimeout(() => {
                    this.el.classList.add(this.data.get('hoverClass'));
                    this.updateNAButton();
                }, +this.data.get('hoverStartTime'));
            }
            else if (action === 'touchmove') {
                // 双端轻点时候会触发多次touchmove，move中的坐标和start坐标一样，前端过滤掉此种情况的move
                if (computeDistance(
                    {
                        x: changedTouches[0].clientX,
                        y: changedTouches[0].clientY
                    },
                    this.hover
                ) === 0) {
                    return;
                }
                // 还没有触发点击态，clearTimeout
                if (this.hover.touchstartTimeId) {
                    hoverUtil.clearTimeout.call(this);
                }
                // 点击态已触发，移除类并update
                else if (this.el.classList.contains(this.data.get('hoverClass'))) {
                    hoverUtil.removeHoverClassAndUpdate.call(this);
                }
            }
            else if (action === 'touchend') {
                this.hover.touchendTimeId = setTimeout(() => {
                    hoverUtil.removeHoverClassAndUpdate.call(this);
                }, +this.data.get('hoverStartTime') + +this.data.get('hoverStayTime'));
            }
            // attach中使用了bindAction('bindtap') 、用户绑定bindtap都会push到this.listeners['bindtap']
            // behaviors里面有统一逻辑：如果用户绑定了bindtap则会触发this.fire('bindtap')，但如果用户没绑定，也要触发
            if (action === 'tap' && this.listeners['bindtap'].length <= 1) {
                this.fire('bindtap', event.params.e);
            }

            this.dispatchNaEvent(event.params.action, event.params.e);
        });
    },

    /**
     * 获得插入、更新贴片所需的参数
     *
     * @param {boolean} isRemove 是否是remove接口时候获取参数
     * @return {Object}
     */
    getParams(isRemove) {
        const {hidden, id} = this.data.get();
        // remove 接口只需要slaveId、buttonId两个参数
        if (isRemove) {
            return {
                slaveId: `${this.slaveId}`,
                buttonId: `${id}`
            };
        }
        return {
            hide: `${attrValBool(hidden)}`,
            buttonId: `${id}`,
            text: this.el.textContent.trim()
        };
    },

    /**
     * 创建贴片
     */
    insertNAButton() {
        const data = this.getParams();
        this.isInserted = true;
        this.args = data;
        this.boxjs.ui.open({
            name: 'swan-button',
            data
        }).catch(err => {
            this.isInserted = false;
            this.args = null;
            console.warn('insertNAButton::error:', err);
        });
    },

    /**
     * 更新贴片
     */
    updateNAButton() {
        if (!this.isInserted) {
            this.insertNAButton();
        }
        else {
            const params = this.getParams();
            const diff = !isEqualObject(params, this.args);
            if (diff) {
                const originArgs = {
                    ...this.args
                };
                this.args = params;
                this.boxjs.ui.update({
                    name: 'swan-button',
                    data: params
                }).catch(err => {
                    this.args = originArgs;
                    console.warn('updateNAButton::error:', err);
                });
            }
        }
    },

    /**
     * 删除贴片
     *
     * @param {Function} callback 贴片删除后待执行的回调函数
     */
    removeNAButton() {
        if (this.isInserted) {
            const originArgs = {
                ...this.args
            };
            this.isInserted = false;
            this.args = null;
            this.boxjs.ui.close({
                name: 'swan-button',
                data: this.getParams(true)
            }).catch(err => {
                this.isInserted = true;
                this.args = originArgs;
                console.warn('removeNAButton::error:', err);
            });
        }
    }
};
