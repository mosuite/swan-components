/**
 * @file bdml's file's base elements <cover-view>
 * @author mabin(mabin03@baidu.com)
 */
import styleIndex from './index.css';
import {isEqualObject, getTransitionParams, privateKey} from '../utils';
import {internalDataComputedCreator, typesCast} from '../computedCreator';
import {handleVideoFullscreenChangeMessage} from '../utils/na-comp';

export default {

    constructor() {
        this.isInserted = false;
        this.args = null;
    },

    behaviors: ['nativeEventEffect', 'nativeCover'],

    initData() {
        return {
            hidden: false,
            id: this.id,
            scrollTop: 0,
            [privateKey]: {
                componentId: this.id
            }
        };
    },

    computed: {
        ...internalDataComputedCreator([
            {name: 'hidden', caster: typesCast.boolCast},
            {name: 'scrollTop', caster: typesCast.numCast, default: 0}
        ]),

        /**
         * 创建私有属性，供模板使用
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
        }
    },

    /**
     * computed 节点用来生成 transition 动画的参数
     */
    template: `<swan-cover-view data-sanid="{{provideData.componentId}}">
        <div s-ref="container" class="swan-cover-view" style="display: none">
            <slot></slot>
        </div>
        <div s-ref="computed" class="{{'computed ' + (class ? class : '')}}" style="{{style}}"></div>
    </swan-cover-view>`,

    created() {
        this.nextTick(() => {
            // cover-view 的 dom 节点本身不用响应 transition 动画，在插入贴片前需要设置 transition-property 为 none
            this.el && ['transition-property', '-webkit-transition-property'].forEach(key => {
                this.el.style.setProperty(key, 'none', 'important');
            });
            this.insertNativeCoverView();
        });
    },

    /**
     * 使组件节点不可见、响应客户端派发的消息
     */
    attached() {
        const $container = this.ref('container');
        $container.style.visibility = 'hidden';
        $container.style.display = 'inherit';

        this.communicator.onMessage('fullscreenchange', message => {
            // 对于 ios 同层渲染，全屏时候需要把其它非本视频的 na 组件隐藏掉
            handleVideoFullscreenChangeMessage(this, message);

            this.updateNativeCoverView();
        });

        // 响应客户端派发到 slave 的事件
        this.communicator.onMessage(`coverView_${this.data.get('id')}`, event => {
            this.dispatchNaEvent(event.params.action, event.params.e);
        });
    },

    detached() {
        this.removeNativeCoverView();
    },

    /**
     * slaveUpdated
     * @override
     */
    slaveUpdated() {
        this.updateNativeCoverView();
    },

    /**
     * 创建文档片段，产出标签文本
     * @param {Element} $container $container
     * @return {string} 文本内容
     */
    getContent($container) {
        $container = $container || this.ref('container');
        let content = '';
        if ($container && $container.childNodes) {
            for (let i = 0, len = $container.childNodes.length; i < len; i++) {
                const elementChild = $container.childNodes[i];
                if (elementChild.nodeType === 3) {
                    content = (content + elementChild.wholeText).trim();
                }
            }
        }
        return content;
    },

    /**
     * 创建发送端能力所需的参数
     * @return {Object} 端能力所需的参数
     */
    getCoverViewParams() {
        return {
            ...this.getParams(),
            viewId: `${this.data.get('id')}`,
            text: this.getContent(),
            scrollTop: this.data.get('__scrollTop')
        };
    },

    /**
     * 创建 NA 视图
     */
    insertNativeCoverView() {
        const params = this.getCoverViewParams();
        this.isInserted = true;
        this.args = {
            ...params
        };
        this.insertNativeCover({
            params
        }).catch(() => {
            this.isInserted = false;
            this.args = null;
        });
    },

    /**
     * 更新 NA 视图
     */
    updateNativeCoverView() {
        this.nextTick(() => {
            if (this.el && this.isInserted) {
                const params = this.getCoverViewParams();
                const originArgs = {
                    ...this.args
                };
                if (!isEqualObject(params, this.args)) {
                    this.args = {
                        ...params
                    };
                    this.updateNativeCover({
                        params: {
                            ...params,
                            ...getTransitionParams(this.ref('computed'))
                        }
                    }).catch(() => {
                        this.args = originArgs;
                    });
                }
            }
        });
    },

    /**
     * 删除 NA 视图
     */
    removeNativeCoverView() {
        if (this.isInserted) {
            const originArgs = {
                ...this.args
            };
            this.isInserted = false;
            this.args = null;
            this.removeNativeCover({
                params: {
                    slaveId: `${this.slaveId}`,
                    viewId: `${this.data.get('id')}`,
                    parentId: this.getFirstParentComponentId()
                }
            }).catch(() => {
                this.isInserted = true;
                this.args = originArgs;
            });
        }
    }
};
