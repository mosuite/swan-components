/**
 * @file bdml's file's base elements <web-view>
 * @author houyu(houyu01@baidu.com)
 */
import {attrValBool, privateKey, isEqualObject} from '../utils';
import {getCustomEventMap} from '../utils/event';
import {internalDataComputedCreator, typesCast} from '../computedCreator';
import {STABILITY_LOG_CONFIG} from '../utils/constant';

export default {

    constructor(props) {
        this.args = null;
        this.inserted = false;
    },

    template: '<swan-web-view style="{{hiddenStyle}}" data-sanid="{{provideData.componentId}}"></swan-web-view>',

    computed: {
        hiddenStyle() {
            return this.data.get('__hidden') ? ';display:none;' : '';
        },

        /**
         * 产出 provideData 供模板使用
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
        },

        ...internalDataComputedCreator([
            {name: 'hidden', caster: typesCast.boolCast}
        ])
    },

    initData() {
        return {
            src: '',
            viewId: this.uid,
            hidden: 'false',
            [privateKey]: {
                componentId: this.id
            }
        };
    },

    created() {
        this.nextTick(() => {
            this.insertWebView();
            this.noticeMasterEvents();
        });
    },

    /**
     * 响应数据变化
     */
    slaveUpdated() {
        const params = this.getParams();
        if (!this.args || isEqualObject(this.args, params)) {
            return;
        }
        this.args = params;
        this.detectWebViewInsert();
    },

    /**
     * 组件销毁
     */
    detached() {
        this.boxjs.webView.remove({
            slaveId: this.slaveId,
            viewId: this.uid,
            parentId: this.getFirstParentComponentId(this)
        })
        .then()
        .catch(err => {
            console.log('webview-remove-fail: ', err);
            this.logStability(STABILITY_LOG_CONFIG.webViewRemoveError);
        });

        this.dispatch('abilityMessage', {
            eventType: 'webviewEventsDispatch',
            eventParams: {
                webviewId: this.uid,
                eType: 'message'
            }
        });
    },

    /**
     * 通知master用户绑定的事件MAP，用于映射行为(touchstart等)与用户的method名称
     */
    noticeMasterEvents() {
        this.dispatch('abilityMessage', {
            eventType: 'webviewEventsMap',
            eventParams: {
                webviewId: this.uid,
                customEventMap: getCustomEventMap(this.listeners),
                response: {
                    ...this.getDispatchEventObj(),
                    type: 'message'
                }
            }
        });
    },

    /**
     * insert、opne时候参数
     *
     * @return {Object} 参数
     */
    getParams() {
        return {
            hide: this.data.get('__hidden'),
            src: this.data.get('src'),
            slaveId: this.slaveId,
            parentId: this.getFirstParentComponentId(this),
            viewId: this.uid
        };
    },

    /**
     * 插入webview na贴片
     */
    insertWebView() {
        this.args = this.getParams();
        if (!this.data.get('src')) {
            return;
        }

        this.inserted = true;
        this.boxjs.webView.insert(this.getParams())
        .catch(err => {
            console.log('webview-insert-fail: ', err);
            this.logStability(STABILITY_LOG_CONFIG.webViewInsertError);
        });
    },

    /**
     * 更新webview na贴片
     */
    updateWebView() {
        this.boxjs.webView.update(this.getParams())
        .catch(err => {
            console.log('webview-update-fail: ', err);
            this.logStability(STABILITY_LOG_CONFIG.webViewUpdateError);
        });
    },

    /**
     * 检测创建或更新 webview na贴片
     */
    detectWebViewInsert() {
        if (!this.inserted) {
            this.insertWebView();
        } else {
            this.updateWebView();
        }
    }
};
