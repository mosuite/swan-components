/**
 * @file bdml's file's base elements <radio-group>
 * @author mabin(mabin03@baidu.com)
 */
import style from './index.css';
import {attrValBool} from '../utils';

/**
 * RadioGroup
 *
 */
export default {

    behaviors: ['form', 'userTouchEvents', 'noNativeBehavior', 'animateEffect'],

    template: '<swan-radio-group id="{{id}}"><slot></slot></swan-radio-group>',

    constructor() {
        // 用来记录被选中的组件 id
        this.checkedId = null;

        // 用来记录被选中的 RadioValue
        this.value = '';

        this.name = this.data.get('name');
    },

    attached() {
        this.watch('name', name => {
            this.reRegisterFormItem(this.name);
            this.name = name;
        });
    },

    initData() {
        return {
            id: this.id
        };
    },

    messages: {

        /**
         * 响应来自 radio 子组件派发的选中状态被切换的消息
         *
         * @param {Object} arg 消息参数
         */
        'radio:checkedChanged'(arg) {
            const target = arg.target;
            this.checkedId === target.id ? this.removeRadio(target) : this.addRadio(target);
        },

        /**
         * 响应来自 radio 子组件派发的已添加的消息
         *
         * @param {Object} arg 消息参数
         */
        'radio:added'(arg) {
            // 将已添加的 radio 关联到当前 radio-group
            arg.target.radioGroup = this;
            this.addRadio(arg.target);
        },

        /**
         * 响应来自 radio 子组件派发的已销毁的消息
         *
         * @param {Object} arg 消息参数
         */
        'radio:removed'(arg) {
            this.removeRadio(arg.target);
        },

        /**
         * 响应来自 radio 子组件派发的已选中的消息
         *
         * @param {Object} arg 消息参数
         */
        'radio:checked'(arg) {
            const {value, checkedId} = this;

            // 派发已有 radio 被选中的消息
            this.communicator.fireMessage({
                type: `radioGroup-${this.id}`,
                data: {
                    checkedId
                }
            });

            // 触发 bindchange 事件
            this.dispatchEvent('bindchange', {
                detail: {
                    value
                }
            });
        }
    },

    /**
     * 当被添加的 radio 是选中态时，分别记录该 radio 的 value 和 id
     *
     * @param {Object} component radio 组件
     */
    addRadio(component) {
        const {checked, value} = component.data.get();
        if (attrValBool(checked)) {
            this.value = value;
            this.checkedId = component.id;
        }
    },

    /**
     * 删除已记录的 value 和 checkedId
     *
     * @param {Object} component radio 组件
     */
    removeRadio(component) {
        if (this.checkedId === component.id) {
            this.value = '';
            this.checkedId = null;
        }
    },

    /**
     * 响应 form 组件的 submit 事件
     *
     * @override
     * @return {string} value 值
     */
    getFormValue() {
        return this.value;
    }
};
