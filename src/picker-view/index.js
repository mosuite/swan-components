/**
 * @file bdml's file's picker-view elements <picker-view>
 * @author zengqingzhuang(zengqingzhuang@baidu.com)
 */
import style from './index.css';
import {privateKey} from '../utils';
import {internalDataComputedCreator, typesCast} from '../computedCreator';

export default {
    behaviors: ['userTouchEvents', 'noNativeBehavior'],
    constructor() {
        this.messages = {
            'UI:picker-view-column-change': () => {
                this.fireBindChange();
            }
        };
    },

    template: `
        <swan-picker-view value="{{value}}">
            <div class="wrapper" s-ref="wrapper" data-sanid="{{provideData.componentId}}">
                <slot
                    var-value="__value" var-indicatorStyle="__indicatorStyle"
                    var-indicatorClass="__indicatorClass" var-maskStyle="__maskStyle"
                    var-maskClass="__maskClass">
                </slot>
            </div>
        </swan-picker-view>`,

    initData() {
        return {
            indicatorStyle: '', // 设置选择器中间选中框的样式
            indicatorClass: '', // 设置选择器中间选中框的类名
            maskStyle: '', // 设置蒙层的样式
            maskClass: '', // 设置蒙层的类名
            value: [], // 默认值
            [privateKey]: {
                componentId: this.id
            }
        };
    },

    computed: {

        /**
         * 产出 provideData 供模板使用
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
        },
        ...internalDataComputedCreator([
            {name: 'indicatorStyle', caster: typesCast.stringCast},
            {name: 'indicatorClass', caster: typesCast.stringCast},
            {name: 'maskStyle', caster: typesCast.stringCast},
            {name: 'maskClass', caster: typesCast.stringCast},
            {name: 'value', caster: typesCast.arrayCast}
        ])
    },

    /*
     * 获取每列选择的值
     */
    getColumnValues() {
        return Array.prototype.slice.call(this.ref('wrapper').children).map(child => child.curIndex);
    },

    attached() {
        this.pickerViewDataChanged();
    },
    updated() {
        this.pickerViewDataChanged();
    },
    pickerViewDataChanged() {
        this.communicator.fireMessage({
            type: `pickerView_${this.data.get('provideData').componentId}`,
            data: {}
        });
    },

    /*
     * 派发bindchange事件
     */
    fireBindChange() {
        const value = this.getColumnValues();
        this.data.set('value', value);
        this.dispatchEvent('bindchange', {
            detail: {
                value: value
            }
        });
    }
};
