import {
    boxjsDataGetMock,
    boxjsDataGetAsyncMock,
    boxjsDataGetCallbackMock,
    boxjsCoverInsertMock,
    boxjsCoverUpdateMock,
    boxjsCoverRemoveMock,
    boxjsUiMock,
    boxjsDeviceMock
} from './mock-data';
const checkFail = function (params = {},unitTestParams = {}) {
    const typeArr = ['open', 'create', 'update', 'remove', 'insert', 'get'];
    const resultArr = ['openFail', 'updateFail', 'removeFail', 'insertFail', 'fail'];
    return ~typeArr.indexOf(params.type) && ~resultArr.indexOf(unitTestParams.apiExecResult);
};
export default (unitTestParams = {}) => ({
    boxjs: {
        data: {
            get(query) {
                if (unitTestParams.apiExecResult === 'dataFail') {
                    return Promise.reject();
                }
                let name = query.name;
                const queryData = query.data || {};
                // mock 未登录状态
                if (name === 'swan-baidu.privateGetUserInfo') {
                    // mock catch error
                    if (query.data.test) {
                        return Promise.reject();
                    }
                    name = query.data.unLogined ? 'swan-privateGetUserInfo-unLogined' : name;
                }
                if (boxjsDataGetCallbackMock[name]
                    && (queryData.callback || queryData.cb)) {
                    let callback = queryData.callback || queryData.cb;
                    let data = boxjsDataGetCallbackMock[name].res;
                    if (unitTestParams.apiExecResult === 'fail') {
                        data = boxjsDataGetCallbackMock[name].rej;
                    }
                    if (unitTestParams.apiExecResult === 'dataEmpty') {
                        data = boxjsDataGetCallbackMock[name].dataEmpty;
                    }
                    setTimeout(() => {
                        let dataString = JSON.stringify(data);
                        switch (typeof callback) {
                            case 'string':
                                window[callback]
                                && window[callback](dataString);
                                break;
                            case 'function':
                                callback(dataString);
                                break;
                        }
                    }, 0);
                    if (data.data.errno === 0 || data.status === 0) {
                        return Promise.resolve();
                    }
                    else if (data.data.errno && data.data.errno !== 0) {
                        return Promise.reject();
                    }
                }

                if (boxjsDataGetMock[name]) {
                    return boxjsDataGetMock[name][unitTestParams.apiExecResult === 'rej' ? 'rej' : 'res'];
                } else if (boxjsDataGetAsyncMock[name]) {
                    return boxjsDataGetAsyncMock[name];
                }
                else {
                    // TODO how?
                    return false;
                }
            },
            set() {}
        },
        cover: {
            insert(options) {
                let name = options.name;
                options.type = 'insert';
                if (unitTestParams.apiExecResult === 'insertFail') {
                    return Promise.reject();
                }
                if (boxjsCoverInsertMock[name]) {
                    // mock 二级回调
                    if (name === 'swan-coverImage') {
                        let imgEntity = new Image();
                        imgEntity.onerror = () => {
                            options.data.callback(JSON.stringify({
                                data: {
                                    type: 'loadState',
                                    loadState: 'error'
                                }
                            }));
                        };
                        imgEntity.onload = () => {
                            options.data.callback(JSON.stringify({
                                data: {
                                    type: 'loadState',
                                    loadState: 'finish'
                                }
                            }));
                        };
                        imgEntity.src = options.data.src;
                        return Promise.resolve(boxjsCoverInsertMock[name].res);
                    } else {
                        return Promise.resolve(boxjsCoverInsertMock[name].res);
                    }
                } else {
                    return Promise.resolve();
                }
            },
            update(options) {
                //if (options.name == 'swan-animView') {
                    options.type = 'update';
                //}

                if (unitTestParams.apiExecResult === 'updateFail') {
                    return Promise.reject();
                }
                let name = options.name;
                if (boxjsCoverUpdateMock[name]) {
                    return Promise.resolve(boxjsCoverUpdateMock[name].res);
                } else {
                    return Promise.reject();
                }
            },
            remove(options) {
                options.type = 'remove';
                if (unitTestParams.apiExecResult === 'updateFail') {
                    return Promise.reject();
                }
                let name = options.name;
                if (boxjsCoverRemoveMock[name]) {
                    return Promise.resolve(boxjsCoverRemoveMock[name].res);
                } else {
                    return Promise.reject();
                }
            }
        },
        canvas: {
            insert(options) {
                return Promise.resolve();
            },
            update(options) {
                return Promise.resolve();
            },
            remove(options) {
                return Promise.resolve();
            }
        },
        media: {
            video(params) {
                if (
                    params.type === 'insert' && unitTestParams.apiExecResult === 'openFail'
                    || params.type === 'update' && unitTestParams.apiExecResult === 'updateFail'
                    || params.type === 'remove' && unitTestParams.apiExecResult === 'removeFail'
                ) {
                    return Promise.reject();
                }

                return Promise.resolve();
            },
            live(params) {
                if (
                    params.type === 'insert' && unitTestParams.apiExecResult === 'openFail'
                    || params.type === 'update' && unitTestParams.apiExecResult === 'updateFail'
                    || params.type === 'remove' && unitTestParams.apiExecResult === 'removeFail'
                ) {
                    return Promise.reject();
                }
                return Promise.resolve();
            },
            camera(params) {
                if (
                    params.type === 'insert'
                        && (unitTestParams.apiExecResult && unitTestParams.apiExecResult.includes('insertFail'))
                    || params.type === 'update'
                        && (unitTestParams.apiExecResult && unitTestParams.apiExecResult.includes('updateFail'))
                    || params.type === 'remove'
                        && (unitTestParams.apiExecResult && unitTestParams.apiExecResult.includes('removeFail'))
                ) {
                    return Promise.reject({
                        errCode: '1',
                        errMsg: 'fail'
                    });
                }
                return Promise.resolve();
            },
            ARCamera(params) {
                if (
                    params.type === 'insert'
                        && (unitTestParams.apiExecResult && unitTestParams.apiExecResult.includes('insertFail'))
                    || params.type === 'update'
                        && (unitTestParams.apiExecResult && unitTestParams.apiExecResult.includes('updateFail'))
                    || params.type === 'remove'
                        && (unitTestParams.apiExecResult && unitTestParams.apiExecResult.includes('removeFail'))
                ) {
                    return Promise.reject({
                        errCode: '1',
                        errMsg: 'fail'
                    });
                }
                return Promise.resolve();
            }
        },
        map: {
            insert(options) {
                if (unitTestParams.apiExecResult === 'insertFail') {
                    return Promise.reject();
                }
                return Promise.resolve();
            },
            update(options) {
                if (unitTestParams.apiExecResult
                    && unitTestParams.apiExecResult.includes('updateFail')) {
                    return Promise.reject();
                }
                return Promise.resolve();
            },
            remove(options) {
                if (unitTestParams.apiExecResult
                    && unitTestParams.apiExecResult.includes('removeFail')) {
                    return Promise.reject();
                }
                return Promise.resolve();
            }
        },
        platform: {
            boxVersion() {
                return '10.9.0';
            },
            versionCompare() {
                return unitTestParams.versionMiner ? -1 : 1;
            },
            isIOS() {
                return !unitTestParams.isAndroid;
            },
            isAndroid() {
                return unitTestParams.isAndroid;
            },
            isBox() {
                return true;
            },
            osVersion() {
                return '9.0';
            }
        },
        webView: {
            insert(options) {
                if (unitTestParams.apiExecResult
                    && unitTestParams.apiExecResult.includes('insertFail')) {
                    return Promise.reject();
                }
                return Promise.resolve();
            },
            update(options) {
                if (unitTestParams.apiExecResult
                    && unitTestParams.apiExecResult.includes('updateFail')) {
                    return Promise.reject();
                }
                return Promise.resolve();
            },
            remove(options) {
                if (unitTestParams.apiExecResult
                    && unitTestParams.apiExecResult.includes('removeFail')) {
                    return Promise.reject();
                }
                return Promise.resolve();
            },
            launch(options) {
                if (unitTestParams.apiExecResult === 'launchFail') {
                    return Promise.reject();
                }
                return Promise.resolve();
            },
            exit(options) {
                return Promise.resolve();
            }
        },
        ui: {
            open(options) {
                let name = options.name;
                if (unitTestParams.openExecResult === 'openFail') {
                    return Promise.reject();
                }
                if (boxjsUiMock[name]) {
                    // 走到端能力catch
                    if (['swan-IM', 'swan-setting', 'swan-phoneNumber', 'swan-button'].includes(options.name)) {
                        if (unitTestParams.apiExecResult === 'fail') {
                            let res = boxjsUiMock[name].rej;
                            return Promise.reject(res);
                        }
                        else if (unitTestParams.apiExecResult === 'dataEmpty') {
                            let res = boxjsUiMock[name].dataEmpty;
                            // eval(options.data.cb + '(' + JSON.stringify(res) + ')');
                            return Promise.resolve(res);
                        }
                        else {
                            let res = boxjsUiMock[name].res;
                            eval(options.data.cb + '(' + JSON.stringify(res) + ')');
                            return Promise.resolve(res);
                        }
                    }
                    let res = boxjsUiMock[name].res;
                    return Promise.resolve(res);
                } else {
                    if (unitTestParams.apiExecResult
                        && unitTestParams.apiExecResult.includes('insertFail')) {
                        return Promise.reject();
                    }
                    return Promise.resolve();
                }
            },
            update(options) {
                if (unitTestParams.updateExecResult === 'updateFail'
                    || (unitTestParams.apiExecResult
                        && unitTestParams.apiExecResult.includes('updateFail'))
                ) {
                    return Promise.reject();
                }
                return Promise.resolve();
            },
            close(options) {
                if (unitTestParams.apiExecResult
                    && unitTestParams.apiExecResult.includes('removeFail')) {
                    return Promise.reject();
                }
                return Promise.resolve();
            }
        },
        device: {
            networkType(){
                if (boxjsDeviceMock['networkType']) {
                    return Promise.resolve(boxjsDeviceMock['networkType'].res.data);
                } else {
                    return Promise.reject();
                }
            },
            systemInfo(){
               if (boxjsDeviceMock['systemInfo']) {
                    return Promise.resolve(boxjsDeviceMock['systemInfo'].res.data);
                } else {
                    return Promise.reject();
                }
            },
            vibrateShort(){
                return Promise.resolve();
            }
        },
        log() {
            return Promise.resolve();
        },
        getAppInfoSync() {
            return {
                appId: 'appId',
                scene: 'scene'
            };
        },
        layer(opts) {
            let {name} = opts;
            if (name === 'getMediaVolumeSync') {
                return {value: .3};
            }

            if (name === 'getAutoRotationSync') {
                return {isRotateOn: true};
            }

            if (name === 'addComponentToFullScreenSync') {
                return {};
            }

            if (name === 'removeComponentFromFullScreenSync') {
                return {};
            }

            throw new Error('unknown:' + name);
        }
    },
    swan: {
        canIUse(params) {
            return true;
        },
        getUserInfo(params) {
            return Promise.resolve(params.success && params.success({
                data: 'xxx',
                iv: 'yyy',
                userInfo: {}
            }));
        },
        getPhoneNumber(params) {
            return Promise.resolve(params.success && params.success());
        },
        getLocation() {
            return Promise.resolve();
        },
        request(params) {
            if (unitTestParams.apiExecResult === 'fail') {
                return Promise.resolve(params.fail(unitTestParams.callbackData && unitTestParams.callbackData));
            }
            else if (params.success && typeof params.success === 'function') {
                return Promise.resolve(params.success(unitTestParams.callbackData && unitTestParams.callbackData));
            }
        },
        isAppInstalled(params) {
            if (unitTestParams.isAppInstalledApiExecResult === 'fail') {
                params.fail(unitTestParams.isAppInstalledCallbackData && unitTestParams.isAppInstalledCallbackData);
            }
            else if (params.success && typeof params.success === 'function') {
                params.success(unitTestParams.isAppInstalledCallbackData && unitTestParams.isAppInstalledCallbackData);
            }
        },
        showModal(params) {
            if (unitTestParams.showModalApiExecResult === 'fail') {
                params.fail({confirm: false});
            }
            else if (params.success && typeof params.success === 'function') {
                params.success({confirm: true});
            }
        },
        authorize(params) {
            if (params.success && typeof params.success === 'function') {
                params.success();
            }
            return Promise.resolve();
        },
        getSystemInfoSync() {
            return {
                "batteryLevel": -1,
                "version": "10.13.0.0",
                "system": "iOS 11.4",
                "brand": "iPhone",
                "windowHeight": 690,
                "devicePixelRatio": 3,
                "pixelRatio": 3,
                "platform": "ios",
                "SDKVersion": "1.13.4",
                "statusBarHeight": 44,
                "language": "zh_CN",
                "screenHeight": 812,
                "windowWidth": 375,
                "model": "iPhone Simulator <x86-64>",
                "screenWidth": 375,
                "fontSizeSetting": 2
            };
        },
        getScreenBrightness(opts) {
            return new Promise((resolve) => {
                const data = {value: .4};
                opts.complete && opts.complete(data);
                opts.success && opts.success(data);

                resolve();
            });
        },
        getNetworkType(opts) {
            return new Promise((resolve) => {
                const data = {networkType: 'wifi'};
                opts.complete && opts.complete(data);
                opts.success && opts.success(data);

                resolve();
            });
        },
        getStorage(opts) {
            return new Promise((resolve) => {
                const data = {};
                opts.complete && opts.complete(data);
                opts.success && opts.success(data);

                resolve();
            });
        },
        setStorageSync() {
            return {};
        },
        setScreenBrightness(opts) {
            return new Promise((resolve) => {
                const data = {};
                opts.complete && opts.complete(data);
                opts.success && opts.success(data);

                resolve();
            });
        }
    },
    invoke() {},
    bind() {}
});
