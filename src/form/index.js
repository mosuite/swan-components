/**
 * @file bdml's file's base elements <form>
 * @author zengqingzhuang(zengqingzhuang@baidu.com)
 */
import {datasetFilter} from '../utils';
import {internalDataComputedCreator, typesCast} from '../computedCreator';
export default {

    behaviors: ['userTouchEvents', 'noNativeBehavior'],

    constructor(props) {
        this.formChilds = [];
    },
    initData() {
        return {
            reportSubmit: false
        };
    },

    computed: {
        ...internalDataComputedCreator([
            {name: 'reportSubmit', caster: typesCast.boolCast}
        ])
    },

    template: `<swan-form>
        <slot></slot>
    </swan-form>`,

    messages: {
        'form:register'({value: {target, name}}) {
            this.formChilds.push({target, name});
        },

        'form:unregister'({value: {target, name}}) {
            this.formChilds = this.formChilds.filter(item => item.name !== name);
        },

        'form:reset'(...args) {
            this.resetHandler(...args);
        },

        'form:submit'(args) {
            this.submitHandler(args);
        }
    },

    submitHandler(args) {
        const formParams = this.formChilds.reduce((formParams, item) => {
            if (item.target.getFormValue && item.name) {
                formParams[item.name] = item.target.getFormValue();
            }
            return formParams;
        }, {});
        let srcTarget = args.target;
        let srcElement = srcTarget.el;
        let target = {
            dataset: datasetFilter(srcTarget.data.raw),
            id: srcElement.id,
            offsetLeft: srcElement.offsetLeft,
            offsetTop: srcElement.offsetTop
        };
        let detail = {
            target,
            value: formParams
        };
        if (this.data.get('__reportSubmit')) {
            // 创建二级回调的函数名及函数体
            this.callbackName = `formCallback_${new Date() - 0}_${this.id || ''}`;
            global[this.callbackName] = args => this.formCallback.call(this, detail, args);
            this.boxjs.data.get({
                name: 'swan-formId',
                data: {
                    cb: this.callbackName
                }
            }).catch(err => {
                detail.formId = '';
                this.dispatchEvent('bindsubmit', {
                    detail
                });
            });
        } else {
            this.dispatchEvent('bindsubmit', {
                detail
            });
        }
    },

    resetHandler() {
        this.formChilds.forEach(item => item.target.resetFormValue());
        this.dispatchEvent('bindreset');
    },
    formCallback(detail, res) {
        let resData = (typeof(res) === 'string') ? JSON.parse(res) : res;
        let formData = resData && resData.data && resData.data.data ? resData.data.data : {};
        let formId = formData.formid !== undefined ? formData.formid : '';
        detail.formId = formId;
        this.dispatchEvent('bindsubmit', {
            detail
        });
        // 销毁二级回调的函数名及函数体
        global[this.callbackName] = null;
        this.callbackName = null;
    }
};