/**
 * @file bdml's file's icon elements <label>
 * @author hzz780(huangzongzhe@baidu.com)
 *         jiamiao(jiamiao@baidu.com)
 */
import {internalDataComputedCreator, typesCast} from '../computedCreator';

// label支持绑定的控件
const labelTargetTag = ['SWAN-BUTTON', 'SWAN-CHECKBOX', 'SWAN-RADIO', 'SWAN-SWITCH'];

export default {

    behaviors: ['noNativeBehavior', 'animateEffect', 'userTouchEvents'],

    template: `<swan-label
            class="{{__privateClass}}"
            on-click="labelClick($event)"
            for="{{for}}"
        >
            <slot></slot>
        </swan-label>`,

    initData() {
        return {
            privateClass: '',
            hoverStopPropagation: false,
            dataFor: ''
        };
    },

    computed: {
        ...internalDataComputedCreator([
            {name: 'privateClass', caster: typesCast.stringCast}
        ])
    },

    /**
     * 深搜找到元素children中第一个为label支持绑定的4个控件
     *
     * @param {DOM} sourceElement 要遍历的父元素
     * @return {Object} 满足条件的dom元素
     */
    findFirstLabelTargetTagInChilden(sourceElement) {
        let element = sourceElement.children;
        if (!element || !element.length) {
            return null;
        }
        for (let i = 0; i < element.length; i++) {
            let currentElement = element[i];
            if (labelTargetTag.includes(currentElement.tagName)) {
                return currentElement;
            }
            // 有可能可绑定的控件在view组件的子级， 做了个小递归
            else if (currentElement.children) {
                let result = this.findFirstLabelTargetTagInChilden(currentElement);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    },

    /**
     * 触发label绑定的表单组件的点击事件
     *
     * @param {DOM} targetElement 最终触发到的dom元素
     * @param {Event} event 事件对象
     */
    trigger(targetElement, event) {
        if (targetElement.disabled) {
            return;
        }
        if (targetElement.tagName.toUpperCase() === 'INPUT') {
            targetElement.checked
                = targetElement.type === 'radio' ? true : !targetElement.checked;
        }
        else {
            const target = targetElement.sanComponent.id || '';
            this.communicator.fireMessage({
                type: 'LabelFirstTapped',
                data: {
                    target,
                    event
                }
            });
        }
    },

    /**
     * 判断元素的祖先组件是否为label支持绑定的4个控件
     *
     * @param {DOM} el dom元素
     * @return {boolean} 布尔值
     */
    isLabelTargetTagInParents(el) {
        // 找到顶了也没找到
        if (!el.parentElement) {
            return false;
        }
        else if (labelTargetTag.includes(el.parentElement.tagName)) {
            return true;
        }
        return this.isLabelTargetTagInParents(el.parentElement);
    },

    /**
     * label点击处理器
     *
     * @param {Event} event 事件对象
     */
    labelClick(event) {
        // 如果触发的target就是支持绑定的控件，或者target的祖先组件是支持绑定的控件，就不去触发以下的操作，若是控件的话，本身自己有相应事件
        if (!labelTargetTag.includes(event.target.tagName) && !this.isLabelTargetTagInParents(event.target)) {
            let targetId = this.data.get('for');
            let targetElement = null;
            if (typeof targetId === 'string') {
                let shouldCheckedEl = document.body.querySelector(`#${targetId}`);
                shouldCheckedEl && this.communicator.fireMessage({
                    type: 'LabelTapped',
                    data: {
                        target: shouldCheckedEl.sanComponent.id,
                        event
                    }
                });
            } else {
                targetElement = this.findFirstLabelTargetTagInChilden(this.el);
                targetElement && this.trigger(targetElement, event);
            }
            event.stopPropagation();
            event.preventDefault();
        }
    }
};
