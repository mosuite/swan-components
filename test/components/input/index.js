/**
 * @file input组件单测
 * @author sunbaixin@baidu.com
 */
import sinon from 'sinon';
import inputComponent from '../../../src/input/index';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import input from '../../../src/input/index';
const COMPONENT_NAME = 'input';

describe('component [' + COMPONENT_NAME + ']', () => {
    const component = buildComponent(COMPONENT_NAME, inputComponent);
    const $component = attach2Document(component);
    componentBaseFieldCheck(COMPONENT_NAME, component);
    it('should be render while attach', () => {
        let $swanInput = $component.querySelector('swan-input');
        let $innerDiv = $component.querySelector('swan-input>div');
        expect($swanInput).not.toBe(null);
        expect($swanInput.getAttribute('id')).not.toBe(null);
        expect($innerDiv).not.toBe(null);
    });

    it('should handle from reset', () => {
        component.data.set('value', 'test')
        component.resetFormValue();
        expect(component.data.get('__value')).toBe('');
    });

    it('should handle from submit', () => {
        component.data.set('value', 'test');
        component.data.set('name', 'test');
        expect(component.getFormValue()).toBe('test');
    });


    const component2 = buildComponent(COMPONENT_NAME, inputComponent);
    const $component2 = attach2Document(component2);
    component2.data.set('focus', true);
    it('should remove native component while detached', done => {
        const spy = sinon.spy(component2.boxjs.ui, 'close');
        component2.nextTick(() => {
            component2.nextTick(() => {
                component2.dispose();
                expect(spy.calledOnce).toBe(true);
                spy.restore();
                done();
            })
        })
    });

    const component3 = buildComponent(COMPONENT_NAME, inputComponent);
    attach2Document(component3);
    component3.data.set('focus', true);
    it('should trigger bindinput while changed', done => {
        component3.on('bindinput', e => {
            expect(e.detail.value).toBe('test');
            expect(e.detail.cursor).toBe(1);
            component3.dispose();
            done();
        });
        component3.nextTick(() => {
            window[component3.callbackName](JSON.stringify({
                data: encodeURIComponent(JSON.stringify({
                    value: 'test',
                    eventName: 'placeholder'
                }))
            }));
            component3.nextTick(() => {
                window[component3.callbackName](JSON.stringify({
                    data: encodeURIComponent(JSON.stringify({
                        value: 'test',
                        cursorOffset: 1,
                        eventName: 'change'
                    }))
                }));
            });
        });
    });
    const component31 = buildComponent(COMPONENT_NAME, inputComponent);
    attach2Document(component31);
    component31.data.set('focus', true);
    it('should trigger bindfocus while focus', done => {

        component31.on('bindfocus', e => {
            expect(e.detail.value).toBe('test');
            component31.dispose();
            done();
        });
        component31.nextTick(() => {
            component31.nextTick(() => {
                window[component31.callbackName](JSON.stringify({
                    data: encodeURIComponent(JSON.stringify({
                        value: 'test',
                        eventName: 'focus'
                    }))
                }));

            });
        });
    });
    const component4 = buildComponent(COMPONENT_NAME, inputComponent);
    attach2Document(component4);
    component4.data.set('focus', true);
    it('should trigger bindconfirm while comfirmed', done => {
        component4.on('bindconfirm', e => {
            expect(e.detail.value).toBe('test1');
            component4.dispose();
            done();
        });
        component4.nextTick(() => {
            component4.nextTick(() => {
                window[component4.callbackName](JSON.stringify({
                    data: encodeURIComponent(JSON.stringify({
                        value: 'test1',
                        cursorOffset: 1,
                        eventName: 'confirm'
                    }))
                }));
            })
        });
    });
    const component5 = buildComponent(COMPONENT_NAME, inputComponent);
    attach2Document(component5);
    component5.data.set('focus', true);
    it('should trigger bindblur while blured', done => {
        component5.on('bindblur', e => {
            expect(e.detail.value).toBe('test2');
            component5.dispose();
            done();
        });
        component5.nextTick(() => {
            component5.nextTick(() => {
                window[component5.callbackName](JSON.stringify({
                    data: encodeURIComponent(JSON.stringify({
                        value: 'test2',
                        cursorOffset: 1,
                        eventName: 'blur'
                    }))
                }));
            })
        });
    });

    const component6 = buildComponent(COMPONENT_NAME, inputComponent);
    attach2Document(component6);
    component6.data.set('focus', true);
    component6.isOpened = true;
    it('should update native component while value changed', done => {
        const spy = sinon.spy(component6.boxjs.ui, 'update');
        component6.data.set('value', 'test3');
        component6.slaveRendered();
        component6.nextTick(() => {
            expect(spy.calledOnce).toBe(true);
            component6.dispose();
            done();
        })
    });
});

describe('component [' + COMPONENT_NAME + ']', () => {

    describe('default props', () => {
        const component = buildComponent(COMPONENT_NAME, inputComponent);
        it('should has right default props', () => {
            const data = component.data;
            expect(data.get('privateType')).toEqual('text');
            expect(data.get('disabled')).toBe(false);
            expect(data.get('maxlength')).toBe(140);
            expect(data.get('cursorSpacing')).toBe('0');
            expect(data.get('focus')).toBe(false);
            expect(data.get('confirmHold')).toBe(false);
            expect(data.get('confirmType')).toEqual('done');
            expect(data.get('placeholderClass')).toEqual('input-placeholder');
            expect(data.get('selectionStart')).toBe(-1);
            expect(data.get('selectionEnd')).toBe(-1);
            expect(data.get('adjustPosition')).toBe(true);
        });
    });
    describe('limit props', () => {
        const component = buildComponent(COMPONENT_NAME, inputComponent, {
            data: {
                password: true
            }
        });

        it('type should be equal to password while password is true', () => {
            const data = component.data;
            expect(data.get('privateType')).toEqual('password');
        });

        it('type should match arrays with some of the values', () => {
            const data = component.data;
            const typeValid = ['text', 'number', 'digit', 'password'];
            expect(typeValid.includes(data.get('privateType'))).toBe(true);
        });

        it('confirmType should match arrays with some of the values', () => {
            const data = component.data;
            let confirmTypeValid = ['send', 'search', 'next', 'go', 'done'];
            expect(confirmTypeValid.includes(data.get('confirmType'))).toBe(true);
        });
    });

    describe('props watch', () => {
        const component = buildComponent(COMPONENT_NAME, inputComponent, {
            data:{
                selectionStart: false,
                selectionEnd: true
            }
        });
        attach2Document(component);

        it('should call closeNativeInput/showNativeInput while focus changed', done => {
            const stub = sinon.stub(component, 'closeNativeInput');
            const stub1 = sinon.stub(component, 'showNativeInput');
            component.data.set('focus', true);
            component.data.set('focus', false);
            component.nextTick(() => {
                expect(stub.calledOnce).toBe(true);
                stub.restore();
                stub1.restore();
                done();
            });
        });
        it(' placeholderStyle should be watche', done => {
            const stub = sinon.stub(component, 'placeholderStyleChange');

            component.data.set('placeholderStyle', {
                'font-size': '16px',
                'font-weight': 'normal',
                'color': '#fff',
                'text-align': 'left'
            });
            component.data.set('placeholderClass','test');
            component.nextTick(() => {
                expect(stub.callCount).not.toBe(true);
                stub.restore();
                done();
            });
        });

    });

    describe('props type', () => {
        const attrArr = ['focus', 'hidden', 'password', 'disabled', 'focus', 'confirmHold', 'adjustPosition'];
        const component = buildComponent(COMPONENT_NAME, inputComponent,{
            data:{
                selectionStart: 'ewewew',
                selectionEnd:{}
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