/**
 * @file 在master中接收各种webview的相关事件的处理逻辑
 * @author yangzonjun(yangzonjun@baidu.com)
 */

export default {

    bindWebViewEvents() {
        const catchEvents = ['onUnload', 'beforeShare'];
        this._pageLifeCycleEventEmitter.onMessage('PagelifeCycle', event => {
            if (!~catchEvents.indexOf(event.params.eventName)) {
                return;
            }
            if (this.webviewMessage) {
                let keys = Object.keys(this.webviewMessage);
                keys.forEach(item => {
                    this.privateMethod.webviewEventsDispatch.call(this, {
                        webviewId: item,
                        eType: 'message',
                        doNotClear: event.params.eventName === 'beforeShare'
                    });
                });
            }
        });
    },

    // 将用户的事件挂载到page原型上，方便master调用
    webviewEventsMap({webviewId, customEventMap, response}) {
        this.webviewListenersMap = this.webviewListenersMap || {};
        this.webviewListenersMap[webviewId] = {
            ...this.webviewListenersMap[webviewId],
            ...customEventMap
        };

        this.webviewResponse = this.webviewResponse || {};
        this.webviewResponse[webviewId] = response;
        if (!this.webViewEventsBinded) {
            this.privateMethod.bindWebViewEvents.call(this);
            this.webViewEventsBinded = true;
        }
    },
    // 调用用户的回调方法：此方法并不是给端用的，前端自己调用
    webviewEventsDispatch(params) {
        if (this.webviewListenersMap && this.webviewListenersMap[params.webviewId]) {
            if (this.webviewMessage && this.webviewMessage[params.webviewId]) {
                const webviewListeners = this.webviewListenersMap[params.webviewId];
                const reflectMethod = webviewListeners['bind' + params.eType];
                let response = this.webviewResponse[params.webviewId];
                response.detail = {};
                response.detail.data = this.webviewMessage[params.webviewId];
                this[reflectMethod] && this[reflectMethod].call(this, response);
                if (!params.doNotClear) {
                    delete this.webviewMessage[params.webviewId];
                    delete this.webviewListenersMap[params.webviewId];
                    delete this.webviewResponse[params.webviewId];
                }
            }
        }
    },
    // 给端用的：h5页面把数据发给端的webview na组件，端通过事件的方式调用此方法，从而把数据存储在slave上
    // swan-core/src/services/master/page/slave-events-router.js 中na端派发事件发送abilityMessage即可
    webview(response) {
        let params = response.e;
        let {eventType, webviewId, data} = params;
        if (eventType === 'message') {
            data = JSON.parse(data || '{}');
            this.webviewMessage = this.webviewMessage || {};
            this.webviewMessage[webviewId] = this.webviewMessage[webviewId] || [];
            this.webviewMessage[webviewId].push(data);
        }
    }
};
