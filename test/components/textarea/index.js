/**
 * @file textarea组件单测
 * @author  v_wushuangzhao@baidu.com
 *          mabin03@baidu.com
 */

import sinon from 'sinon';
import Textarea from '../../../src/textarea';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';
import Communicator from "../../mock/communicator";

const COMPONENT_NAME = 'textarea';

/**
 * 创建单测用例
 *
 * @param {Function} callback 回调函数
 */
export const getTestCase = callback => {
    const factory = getFactory();
    const componentTextarea = getComponentClass('textarea', Textarea);
    const properties = {
        classProperties: {
            components: {
                textarea: componentTextarea
            }
        }
    };
    factory.componentDefine(
        'testComponent', {
            template: `
                <view>
                    <textarea s-ref="textarea"
                        auto-height
                        style="background: #ff0000; height: 100px;">
                    </textarea>
                </view>`
        },
        properties
    );
    const TestView = factory.getComponents('testComponent');
    const testComponent = new TestView();
    testComponent.attach(document.body);
    testComponent.nextTick(() => {
        const textarea = testComponent.ref('textarea');
        callback({
            textarea
        });
        testComponent.dispose();
    });
};

describe('component' + '[' + COMPONENT_NAME + ']', () => {
    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, Textarea);
        const $component = attach2Document(component);
        componentBaseFieldCheck(COMPONENT_NAME, component);
        const $swanTextarea = $component.querySelector('swan-textarea');
        const $textareaDiv = $component.querySelector('swan-textarea>div');

        it('should be rendered after attached', () => {
            expect($swanTextarea).not.toBe(null);
            expect($textareaDiv).not.toBe(null);
        });

        describe('should have some default props', () => {
            const defaults = [
                ['disabled', false],
                ['maxlength', 140],
                ['autoHeight', false],
                ['cursor', -1],
                ['focus', false],
                ['cursorSpacing', 0],
                ['showConfirmBar', true],
                ['selectionStart', -1],
                ['selectionEnd', -1],
                ['fixed', false],
                ['adjustPosition', true]
            ];
            defaults.forEach(([name, expected]) => {
                it(`${name} default value should be ${expected}`, () => {
                    const actual = component.data.get(name);
                    expect(actual).toBe(expected);
                });
            });
        });

        it('the component data should be computed', () => {
            expect(component.ref('placeholder').getAttribute('class')).toEqual('textarea-placeholder ');
            expect(component.ref('placeholder').style.display).toEqual('none');
            expect($swanTextarea.style.display).toEqual('');
        });

        it('should handle from reset', () => {
            component.data.set('value', 'test');
            component.resetFormValue();
            expect(component.data.get('__value')).toBe('');
        });

        it('should handle from submit', () => {
            component.data.set('value', 'test');
            expect(component.getFormValue()).toBe('test');
        });
    });

    describe('methods and events', () => {
        const component2 = buildComponent(COMPONENT_NAME, Textarea, {
            data: {
                style: 'background: #ff0000; height: 100px;'
            }
        });
        attach2Document(component2);
        it('updateTextarea will be executed', done => {
            component2.nextTick(() => {
                window[component2.callbackName](JSON.stringify({
                    data: {
                        value: '',
                        cursor: '',
                        lineCount: 1,
                        height: '10px',
                        keyboardHeight: 0,
                        eventName: 'focus'
                    }
                }));
                component2.nextTick(() => {
                    const spy = sinon.spy(component2, 'updateTextarea');
                    const attrWatch = [
                        ['maxlength', 150],
                        ['hide', false],
                        ['focus', true],
                        ['showConfirmBar', false],
                        ['selectionStart', '-1'],
                        ['selectionEnd', true]
                    ];

                    attrWatch.forEach(([prop, val]) => {
                        component2.data.set(prop, val);
                        component2.communicator.fireMessage({
                            type: 'slaveUpdated'
                        });
                    });
                    component2.isFocus = true;
                    component2.updateTextarea();
                    component2.nextTick(() => {
                        expect(spy.callCount).toEqual(attrWatch.length + 1);
                        spy.restore();
                        component2.dispose();
                        done();
                    });
                });
            });
        });

        const component3 = buildComponent(COMPONENT_NAME, Textarea, {
            data: {
                autoHeight: true
            }
        });
        attach2Document(component3);
        it('should trigger binlinechange while linechange', done => {
            component3.on('bindlinechange', e => {
                expect(e.detail.lineCount).toBe(3);
                component3.dispose();
                done();
            })
            component3.nextTick(() => {
                window[component3.callbackName](JSON.stringify({
                    data: {
                        value: '',
                        cursor: '',
                        lineCount: 3,
                        height: '10px',
                        keyboardHeight: 0,
                        eventName: 'linechange'
                    }
                }));
            });
        });


        const component4 = buildComponent(COMPONENT_NAME, Textarea);
        attach2Document(component4);
        it('should trigger bindinput while input', done => {
            component4.on('bindinput', e => {
                expect(e.detail.value).toBe('test');
                component4.dispose();
                done();
            });
            component4.nextTick(() => {
                window[component4.callbackName](JSON.stringify({
                    data: {
                        value: 'test',
                        cursor: '',
                        lineCount: 1,
                        height: '10px',
                        keyboardHeight: 0,
                        eventName: 'input'
                    }
                }));
            });
        });
        const component5 = buildComponent(COMPONENT_NAME, Textarea);
        attach2Document(component5);
        it('should trigger bindblur while input', done => {
            component5.on('bindblur', e => {
                expect(e.detail.value).toBe('test');
                component5.dispose();
                done();
            });
            component5.nextTick(() => {
                window[component5.callbackName](JSON.stringify({
                    data: {
                        value: 'test',
                        cursor: '',
                        lineCount: 1,
                        height: '10px',
                        keyboardHeight: 0,
                        eventName: 'blur'
                    }
                }));
            });
        });

        const component6 = buildComponent(COMPONENT_NAME, Textarea);
        attach2Document(component6);
        it('should trigger bindconfirm while input', done => {
            component6.on('bindconfirm', e => {
                expect(e.detail.value).toBe('test');
                component6.dispose();
                done();
            });
            component6.nextTick(() => {
                window[component6.callbackName](JSON.stringify({
                    data: {
                        value: 'test',
                        cursor: '',
                        lineCount: 1,
                        height: '10px',
                        keyboardHeight: 0,
                        eventName: 'confirm'
                    }
                }));
            });
        });
        const component7 = buildComponent(COMPONENT_NAME, Textarea);
        attach2Document(component7);
        it(' minHeight should be check  while linechange', done => {
            let target = component7.el;
            component7.on('bindlinechange', e => {
                expect(e.detail.lineCount).toBe(3);
                component7.dispose();
                done();
            })
            component7.nextTick(() => {
                window[component7.callbackName](JSON.stringify({
                    data: {
                        value: '',
                        cursor: '',
                        lineCount: 3,
                        height: '1px',
                        keyboardHeight: 0,
                        eventName: 'linechange'
                    }
                }));
            });
        });
        const component8 = buildComponent(COMPONENT_NAME, Textarea,{
            data: {
                autoHeight: true
            }
        });
        attach2Document(component8);
        it(' maxHeight should be check  while linechange', done => {

            component8.on('bindlinechange', e => {
                expect(e.detail.lineCount).toBe(3);
                component8.dispose();
                done();
            });

            component8.el.style.textAlign = 'end';
            component8.el.style.height = '1px';
            component8.el.style.border = 'none';
            component8.el.style.fontWeight = 900;
            component8.el.style.boxSizing = 'border-box';
            component8.getFontWeight(null);
            component8.nextTick(() => {
                window[component8.callbackName](JSON.stringify({
                    data: {
                        value: '',
                        cursor: '',
                        lineCount: 3,
                        height: '0px',
                        keyboardHeight: 0,
                        eventName: 'linechange'
                    }
                }));
            });
        });
        const component9 = buildComponent(COMPONENT_NAME, Textarea,{
            data: {
                autoHeight: true
            }
        });
        attach2Document(component9);
        it(' this.el should be check ', done => {

            let spy = sinon.spy(component9, 'getComputedStyle');
            component9.el = null;
            component9.getComputedStyle();
            component9.nextTick(()=>{
                expect(spy.callCount).toBe(1);
                spy.restore();
                done();
            })

        });
    });

    describe('props watch', () => {
        const component = buildComponent(COMPONENT_NAME, Textarea);
        attach2Document(component);
        const spy = sinon.spy(component, 'insertTextArea');
        component.data.set('focus', true);
        it('insertTextArea will be executed when focus change', done => {
            component.nextTick(() => {
                expect(spy.calledOnce).toBe(true);
                spy.restore();
                component.dispose();
                done();
            });
        });

        const component2 = buildComponent(COMPONENT_NAME, Textarea, {
            data: {
                selectionStart: null,
                selectionEnd: false
            }
        });
        attach2Document(component2);
        it('removeTextArea will be executed when component detached', done => {
            const spy = sinon.spy(component2, 'removeTextArea');
            component2.dispose();
            component2.nextTick(() => {
                expect(spy.calledOnce).toBe(true);
                spy.restore();
                done();
            });
        });

        const component3 = buildComponent(COMPONENT_NAME, Textarea, {
            data: {
                name: 'myTextarea',
                autoHeight: true
            }
        });
        attach2Document(component3);
        component3.data.set('name', 'aaa');
        component3.data.set('name', 'aaa');

        it('should not fire message LabelFirstTapped while click label', done => {

            let spy = sinon.spy(component3.communicator, 'fireMessage');
            const event = new Event('click');
            component3.dispatchEvent(event);
            component3.communicator.fireMessage({
                type: 'LabelTapped',
                data: {
                    labelForValue: component3.data.get('id')
                }
            });
            expect(spy.callCount).toBe(1);
            spy.restore();
            done();
        });

        it('insertTextArea will be executed when focus change', done => {

            component3.nextTick(() => {

                expect(component3.name).toBe('aaa');
                spy.restore();
                component3.dispose();
                done();
            });
        });
    });

    describe('props type', () => {
        const attrArr = ['autoHeight',
            'hidden', 'autoFocus', 'disabled', 'focus', 'fixed', 'showConfirmBar', 'adjustPosition'];
        const component = buildComponent(COMPONENT_NAME, Textarea,{
            data: {
                selectionStart: true,
                selectionEnd: {}
            }
        });
        attach2Document(component);
        attrArr.forEach(name => {
            it(`__${name} should be boolean`, () => {
                const data = component.data;
                data.set(name, 'false');
                expect(data.get(`__${name}`)).toBe(false);
            });
        });
        it('__value should be string', () => {
            const data = component.data;
            data.set('value', undefined);
            expect(data.get('__value')).toBe('');
        });
    });
});