/**
 * @file bdml's file's base elements <checkbox>
 * @author lijiahui(lijiahui02@baidu.com)
 *
 */
import style from './index.css';
import {internalDataComputedCreator, typesCast} from '../computedCreator';

export default {

    behaviors: ['userTouchEvents', 'hoverEffect', 'form'],

    constructor() {
        this.initialValue = false;
        this.name = this.data.get('name');
    },

    initData() {
        return {
            privateStyle: style,
            privateClass: 'swan-switch-wrapper',
            checked: false,
            disabled: false,
            type: 'switch',
            color: '#3388ff'
        };
    },

    computed: {
        getSwitchChecked() {
            return this.data.get('__checked') ? ` swan-${this.data.get('__type')}-input-checked` : '';
        },
        getUserColor() {
            return this.data.get('__checked')
                ? `border-color: ${this.data.get('__color')}; background-color: ${this.data.get('__color')};` : '';
        },
        ...internalDataComputedCreator([
            {name: 'privateClass', caster: typesCast.stringCast, default: 'swan-switch-wrapper'},
            {name: 'checked', caster: typesCast.boolCast},
            {name: 'disabled', caster: typesCast.boolCast},
            {name: 'type', data: ['switch', 'checkbox']},
            {name: 'color', caster: typesCast.stringCast, default: '#3388ff'}
        ])
    },

    template: `<swan-switch
        class="{{__privateClass}}"
        checked="{{__checked}}"
        color="{{__color}}"
        type="{{__type}}"
        name="{{name}}"
        on-click="onClick($event)"
    >
        <div class="{{'${style['swan-switch-input']}'}}
            {{getSwitchChecked}}"
            style="{{getUserColor}}"
            hiddenl="{{__type}}"
        ></div>
        <div class="{{'${style['swan-checkbox-input']}'}}
            {{getSwitchChecked}}"
            style="color: {{__color}};"
            hiddenl="{{__type}}"
        ></div>
    </swan-switch>`,

    /**
     * 组件创建
     */
    attached() {
        this.initialValue = this.data.get('__checked');
        // 声明点击label触发label内第一个控件的事件
        this.communicator.onMessage('LabelFirstTapped',
            message => {
                if (message.data && this.id === message.data.target) {
                    this.onClick(message.data.event);
                }
            }
        );
         // 响应 Label 发出的事件
        this.communicator.onMessage('LabelTapped',
            message => {
                if (message.data && message.data.target === this.id && !this.data.get('__disabled')) {
                    this.onClick(message.data.event);
                }
            }
        );
        this.watch('name', name => {
            this.reRegisterFormItem(this.name);
            this.name = name;
        });
    },

    /**
     * 响应 form 组件的 submit 事件
     *
     * @override
     * @return {string} value 值
     */
    getFormValue() {
        return this.data.get('__checked');
    },

    /**
     * 响应 form 组件的 reset 事件
     *
     * @override
     */
    resetFormValue() {
        this.data.set('checked', this.initialValue);
    },

    /**
     * 点击事件处理器
     *
     * @param {Event} $event 对象
     */
    onClick($event) {
        if (this.data.get('__disabled')) {
            return;
        }
        this.data.set('checked', !this.data.get('__checked'));
        this.boxjs.device.vibrateShort();
        this.dispatchEvent('bindchange', {
            detail: {
                checked: this.data.get('__checked')
            }
        });
    }
};
