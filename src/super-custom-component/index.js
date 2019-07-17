/**
 * @file 自定义组件的超类代码
 * @author houyu(houyu01@baidu.com)
 */
import {datasetFilter} from '../utils';
import {getCustomEventMap} from '../utils/event';

const PROPSCHANGE_THROTTLE_TIME = 10;

export default {
    constructor() {
        this._startTime = Date.now();
        this._isCustomComponent = true;
        this.communicator.onMessage(
            ['initData'],
            params => {
                params = Object.prototype.toString.call(params) === '[object Array]' ? params[0] : params;
                const componentPath = this.componentPath.replace(/.swan$/, '');
                const componentData = params.extraMessage.componentsData[componentPath];
                const initData = {...componentData, ...this.data.raw};
                for (const key in initData) {
                    this.data.set(key, initData[key]);
                    // 页面级setData有相应优化, 导致触发自定义组件props多次更新, 增加watch执行throttle
                    let operationTimmer = null;
                    this.watch(key, value => {
                        clearTimeout(operationTimmer);
                        operationTimmer = setTimeout(() => {
                            this.propsChange(key, value);
                        }, PROPSCHANGE_THROTTLE_TIME);
                    });
                }
            },
            {listenPreviousEvent: true}
        );

        this.communicator.onMessage(
            ['setCustomComponentData'],
            params => {
                const currentOperationSet = params.operationSet
                    .filter(operation => operation.options.nodeId === this.uid);
                if (currentOperationSet && currentOperationSet.length) {
                    currentOperationSet.forEach(operation => {
                        for (const path in operation.setObject) {
                            this.data.set(path, operation.setObject[path]);
                        }
                    });
                    this.nextTick(() => {
                        this.dispatch('customComponentInnerUpdated');
                        this.dispatch('abilityMessage', {
                            eventType: 'nextTickReach'
                        });
                    });
                }
            }
        );

        this.dispatch('addMasterNoticeComponents', {
            componentName: this.componentName,
            componentPath: this.componentPath.replace(/.swan$/g, ''),
            nodeId: this.uid,
            id: this.uid,
            is: this.componentPath.replace(/.swan$/g, ''),
            dataset: datasetFilter(this.data.raw),
            className: this.data.get('class') || '',
            data: this.data.raw,
            ownerId: this.owner.uid,
            parentId: this.parentComponent.uid,
            customEventMap: getCustomEventMap(this.listeners)
        });

        this.communicator.onMessage('customComponentInnerBehavior', params => {
            if (params.nodeId === this.uid) {
                const eventType = params.extraMessage.eventType;
                this[eventType] && this[eventType]();
            }
        });

        this.insertStyle();
    },

    /**
     * 封装fire事件返回结构
     *
     * @param {Object} params 参数对象
     * @return {Object} 统一的事件参数格式
     */
    getDispatchEventObj(params = {}) {
        const target = {
            id: this.uid,
            offsetLeft: this.el.offsetLeft,
            offsetTop: this.el.offsetTop,
            dataset: datasetFilter(this.data.raw)
        };
        Object.assign(params, {
            target,
            currentTarget: target,
            timeStamp: Date.now() - this._startTime
        });
        return params;
    },

    /**
     * 内置属性swan://component-export处理, 使得外层form能够拿到对应数据
     */
    insertFormField() {
        this.dispatch('form:register', {
            target: this,
            name: this.data.get('name')
        });
    },

    propsChange(key, value) {
        this.dispatch('abilityMessage', {
            eventType: 'customComponentEvent',
            eventParams: {
                type: 'customComponent:_propsChange',
                nodeId: this.uid,
                raw: {
                    key,
                    value
                }
            }
        });
    },

    behaviors: ['userTouchEvents', 'noNativeBehavior'],

    /**
     * 添加自定义组件样式
     */
    insertStyle() {
        const styles = document.querySelectorAll('style');
        const decoratedStyle = Array.from(styles).map(style => style.getAttribute('_from'));
        const attributeValue = this.componentUniqueName || this.componentPath;
        if (!decoratedStyle.includes(attributeValue) && this.customComponentCss.trim() !== '') {
            const styleTag = document.createElement('style');
            styleTag.setAttribute('_from', attributeValue);
            styleTag.innerHTML = this.customComponentCss;
            document.head.appendChild(styleTag);
        }
    },

    /**
     * form提交获取自定义组件value数据
     */
    getFormValue() {
        return this.data.raw.value || '';
    },

    detached() {
        this.dispatch('abilityMessage', {
            eventType: 'customComponentEvent',
            eventParams: {
                type: 'customComponent:detached',
                nodeId: this.uid
            }
        });
    },

    eventHappen(...args) {
        this.owner.eventHappen(...args, {nodeId: this.uid});
    }
};
