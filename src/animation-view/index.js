/**
 * @file bdml's file's base elements <animation-view>
 * @author liwanfeng(liwanfeng@baidu.com)
 *         mabin(mabin03@baidu.com)
 */
import style from './index.css';
import {hexColor, isEqualObject, privateKey} from '../utils';
import {internalDataComputedCreator, typesCast} from '../computedCreator';
import {STABILITY_LOG_CONFIG} from '../utils/constant';

export default {

    behaviors: ['nativeEventEffect', 'nativeCover'],

    constructor(props) {
        this.args = null;
        this.isInserted = false;
    },

    initData() {
        return {
            loop: false,
            // 动画资源地址，目前只支持绝对路径
            path: '',
            autoplay: true,
            // 动画操作，可取值 play、pause、stop
            action: 'play',
            hidden: false,
            [privateKey]: {
                componentId: this.id
            }
        };
    },

    computed: {
        ...internalDataComputedCreator([
            {name: 'hidden', caster: typesCast.boolCast, default: true},
            {name: 'loop', caster: typesCast.boolCast},
            {name: 'autoplay', caster: typesCast.boolCast, default: true},
            {name: 'path', caster: typesCast.stringCast},
            {name: 'action', data: ['play', 'pause', 'stop']}
        ]),

        /**
         * 创建私有属性，供模板使用
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
        }
    },

    template: `<swan-animation-view
        action="{{__action}}"
        data-sanid="{{provideData.componentId}}"
    >
        <div class="slot"><slot></slot></div>
    </swan-animation-view>`,

    /**
     * 创建NA动画
     */
    created() {
        this.nextTick(() => {
            this.insertNativeAnimationView();
        });

        // 接收客户端派发到slave的事件
        this.communicator.onMessage(`animateview_${this.id}`, event => {
            this.dispatchNaEvent(event.params.action, event.params.e);
        });
    },

    /**
     * slaveUpdated
     * @override
     */
    slaveUpdated() {
        this.updateNativeAnimationView();
    },

    /**
     * 页面销毁时移除 NA动画
     */
    detached() {
        this.removeNativeAnimationView();
    },

    /**
     * 获得插入、更新 NA 视图所需的参数
     * @return {Object} 通用参数集合
     */
    getAnimationViewParams() {
        const {id, __loop, __autoplay, __path, __action} = this.data.get();
        return {
            ...this.getParams(),
            viewId: id,
            style: this.getAnimationStyle(),
            loop: __loop,
            autoPlay: __autoplay,
            path: __path,
            action: __action
        };
    },

    /**
     * 创建 NA 视图
     */
    insertNativeAnimationView() {
        if (this.el) {
            const params = this.getAnimationViewParams();
            this.isInserted = true;
            this.args = {
                ...params
            };
            this.boxjs.cover.insert({
                name: 'swan-animView',
                data: params
            }).catch(err => {
                this.isInserted = false;
                this.args = null;
                console.warn(`NAAnimView create fail! , ${JSON.stringify(err)}`);
                this.logStability(STABILITY_LOG_CONFIG.animationViewInsertError);
            });
        }
    },

    /**
     * 更新 NA 视图
     *
     */
    updateNativeAnimationView() {
        if (this.el && this.isInserted) {
            const params = this.getAnimationViewParams();
            const originArgs = {
                ...this.args
            };
            if (!isEqualObject(params, this.args)) {
                this.args = {
                    ...params
                };
                this.boxjs.cover.update({
                    name: 'swan-animView',
                    data: params
                }).catch(err => {
                    this.args = originArgs;
                    console.warn(`NAAnimView update fail! , ${JSON.stringify(err)}`);
                    this.logStability(STABILITY_LOG_CONFIG.animationViewUpdateError);
                });
            }
        }
    },

    /**
     * 删除 NA 视图
     *
     * @param {Function} callback NA动画删除后待执行的回调函数
     */
    removeNativeAnimationView() {
        if (this.isInserted) {
            const originArgs = {
                ...this.args
            };
            this.isInserted = false;
            this.args = null;
            this.boxjs.cover.remove({
                name: 'swan-animView',
                data: {
                    slaveId: this.slaveId,
                    viewId: this.data.get('id'),
                    sanId: this.id,
                    parentId: this.getFirstParentComponentId()
                }
            }).catch(err => {
                this.isInserted = true;
                this.args = originArgs;
                console.warn(`NAAnimView remove fail! , ${JSON.stringify(err)}`);
                this.logStability(STABILITY_LOG_CONFIG.animationViewRemoveError);
            });
        }
    },

    /**
     * 获取 annimation-view 的样式
     * @return {Object}
     */
    getAnimationStyle() {
        const computedStyle = global.getComputedStyle(this.el);
        return {
            bgColor: hexColor(computedStyle.backgroundColor),
            opacity: parseFloat(computedStyle.opacity)
        };
    },

    /**
     * 通知master获取bind方法handler映射
     *
     * @param {string} eventName 事件名称
     * @param {Object} params 参数
     */
    dispatchCustomEvent(eventName, params) {
        this.dispatchEvent(eventName, {
            detail: Object.assign(JSON.parse(params.data), {animationViewId: this.data.get('id')})
        });
    }
};
