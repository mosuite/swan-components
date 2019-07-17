/**
 * @file    bdml's file's base elements <radio>
 * @author  mabin(mabin03@baidu.com)
 */
import style from './index.css';
import {internalDataComputedCreator, typesCast} from '../computedCreator';

/**
 * Radio
 */
export default {

    behaviors: ['form', 'userTouchEvents', 'noNativeBehavior', 'animateEffect', 'color'],

    initData() {
        return {
            id: this.id,
            color: '#3C76FF',
            value: '',
            checked: false,
            disabled: false
        };
    },

    computed: {

        /**
         * 根据是否 checked、是否 disabled 创建 className
         *
         * @return {string} className
         */
        getRadioInputClass() {
            let res = ['swan-radio-input'];
            this.data.get('__checked') && res.push('swan-radio-input-checked');
            this.data.get('__disabled') && res.push('swan-radio-input-disabled');
            return res.join(' ');
        },

        /**
         * 根据是否 checked 创建边框颜色
         *
         * @return {string} 边框颜色
         */
        getRadioInputColor() {
            return this.data.get('__checked') ? this.data.get('__color') : '';
        },
        ...internalDataComputedCreator([
            {name: 'color', caster: typesCast.stringCast, default: '#3c76ff'},
            {name: 'checked', caster: typesCast.boolCast},
            {name: 'disabled', caster: typesCast.boolCast}
        ])
    },

    template: `<swan-radio on-click="radioTap($event)">
        <div class="swan-radio-wrapper">
            <div class="{{getRadioInputClass}}">
                <div class="swan-radio-input-border" style="border-color: {{getRadioInputColor}}"></div>
                <div class="swan-radio-input-button" style="background-color: {{getRadioInputColor}}"></div>
            </div>
            <slot></slot>
        </div>
    </swan-radio>`,

    compiled() {

        // 响应 label 的点击事件
        this.bindAction('bindtap', $event => {
            this.radioTap($event);
        });
    },

    /**
     * 组件创建
     */
    attached() {
        this.nextTick(() => {
            const {value, __checked} = this.data.get();

            // 监听 checked 变化
            this.watch('__checked', checked => {
                // 向 radio-group 派发 radio 的选中状态被切换的消息
                this.radioGroup && this.dispatch('radio:checkedChanged', {
                    value,
                    id: this.id,
                    checked
                });
            });

            // 向 radio-group 派发 radio 已创建的消息
            this.dispatch('radio:added', {
                value,
                id: this.id,
                checked: __checked
            });

            // 声明点击 label 触发 label 内第一个控件的事件
            this.communicator.onMessage('LabelFirstTapped', message => {
                if (message.data && this.id === message.data.target) {
                    this.radioTap(message.data.event);
                }
            });

            // 响应 label 的点击事件
            this.communicator.onMessage('LabelTapped', message => {
                if (message.data && message.data.target === this.id) {
                    this.radioTap(message.data.event);
                }
            });

            // 响应来自 radio-group 派发的已有 radio 被选中的消息
            if (this.radioGroup && this.radioGroup.id) {
                this.communicator.onMessage(`radioGroup-${this.radioGroup.id}`, message => {
                    const checkedId = message.data.checkedId;

                    // 已选中的 radio 非本组件时，将选中状态设置为 false
                    if (checkedId !== null && checkedId !== this.id) {
                        this.data.set('checked', false);
                    }
                });
            }
        });
    },

    /**
     * 组件销毁
     */
    detached() {
        if (this.radioGroup) {

            // 向 radio-group 派发 radio 已删除的消息
            this.dispatch('radio:removed');
            this.radioGroup = null;
        }
    },

    /**
     * radio 的点击事件
     *
     * @param {Event} $event 对象
     */
    radioTap($event) {
        const {__disabled, __checked} = this.data.get();
        if (!__disabled && !__checked) {
            this.data.set('checked', true);
            // 向 radio-group 派发 radio 已选中的消息
            this.radioGroup && this.dispatch('radio:checked', $event);
        }
    },

    /**
     * 响应 form 组件的 reset 事件
     *
     * @override
     */
    resetFormValue() {
        this.radioGroup && this.data.set('checked', false);
    }
};
