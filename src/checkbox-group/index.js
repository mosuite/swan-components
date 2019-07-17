/**
 * @file bdml's file's base elements <checkbox-group>
 * @author lijiahui(lijiahui02@baidu.com)
 *
 */
import {attrValBool} from '../utils';

export default {

    behaviors: ['userTouchEvents', 'hoverEffect', 'form'],

    template: `<swan-checkbox-group
        name="{{name}}"
    >
        <slot></slot>
    </swan-checkbox-group>`,

    constructor(props) {
        this.detail = [];
        this.childList = [];
        this.name = this.data.get('name');
        this.messages = {
            'checkbox-item-change': $event => {
                let object = $event.value;
                this.changeCheckbox(object);
                this.dispatchEvent('bindchange', {
                    detail: {
                        value: this.detail
                    }
                });
            },
            'checkbox-item-init': $event => {
                let object = $event.value;
                this.childList.push({
                    el: object.item,
                    checked: object.checked
                });
                this.changeCheckbox(object);
            }
        };
    },

    attached() {
        this.watch('name', name => {
            this.reRegisterFormItem(this.name);
            this.name = name;
        });
    },

    /**
     * 勾选改变处理
     * @param {Object} object 事件源
     */
    changeCheckbox(object) {
        if (!object) {
            return;
        }
        let index = this.detail.indexOf(object.value);
        if (object.checked) {
            index === -1 && this.detail.push(object.value);
        } else {
            index !== -1 && this.detail.splice(index, 1);
        }
    },

    // 表单相关
    getFormValue() {
        return this.detail;
    },

    resetFormValue() {
        this.childList.map(item => {
            item.el && item.el.data && item.el.data.set('checked', item.checked);
        });
    }
};
