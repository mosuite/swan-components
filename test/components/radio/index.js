/**
 * @file radio组件单测
 * @author  yanghuabei@baidu.com
 *          mabin03@baidu.com
 */

import sinon from 'sinon';
import Radio from '../../../src/radio';
import RadioGroup from '../../../src/radio-group';
import Form from '../../../src/form/index';
import Button from '../../../src/button/index';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';

const COMPONENT_NAME = 'radio';

/**
 * 创建单测用例
 *
 * @param {Function} callback 回调函数
 */
export const getTestCase = (callback, buttonType = 'submit') => {
    const factory = getFactory();
    const componentRadioGroup = getComponentClass('radio-group', RadioGroup);
    const componentRadio = getComponentClass(COMPONENT_NAME, Radio);
    const componentForm = getComponentClass('form', Form);
    const componentButton = getComponentClass('button', Button);
    const properties = {
        classProperties: {
            components: {
                'radio-group': componentRadioGroup,
                'radio': componentRadio,
                'form': componentForm,
                'button': componentButton
            }
        }
    };
    factory.componentDefine(
        'testComponent', {
            template: `
                <swan-page>
                    <form>
                        <radio-group s-ref="radioGroup">
                            <radio name="radio1" s-ref="radio1" value="radio1" checked />
                            <radio name="radio2" s-ref="radio2" value="radio2" />
                        </radio-group>
                        <button form-type="${buttonType}" s-ref="button">button</button>
                    </form>
                </swan-page>`
        },
        properties
    );
    const TestView = factory.getComponents('testComponent');
    const testComponent = new TestView();
    testComponent.attach(document.body);
    testComponent.nextTick(() => {
        const radioGroup = testComponent.ref('radioGroup');
        const radio1 = testComponent.ref('radio1');
        const radio2 = testComponent.ref('radio2');
        const button = testComponent.ref('button');
        callback({
            radioGroup,
            radio1,
            radio2,
            button
        });
        testComponent.dispose();
    });
};

/* eslint-disable max-nested-callbacks */
describe(`component [${COMPONENT_NAME}]`, () => {
    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, Radio);
        const $component = attach2Document(component);
        componentBaseFieldCheck(COMPONENT_NAME, component);
        it('should be rendered after attach', () => {
            const $swanMainDom = $component.querySelector('swan-radio');
            expect($swanMainDom).not.toBe(null);
        });
    });

    describe('default props', () => {
        const component = buildComponent(COMPONENT_NAME, Radio);
        attach2Document(component);
        componentBaseFieldCheck(COMPONENT_NAME, component);
        const defaults = [
            ['color', ['#3C76FF', '#3c76ff'], 'includes'],
            ['value', ''],
            ['checked', false],
            ['disabled', false]
        ];

        defaults.forEach(([name, expected, checkType]) => {
            const message = checkType === 'includes'
                ? `${name} default value should be one of ${expected.join()}`
                : `${name} default value should be ${expected}`;

            it(message, () => {
                const data = component.data;
                const actual = data.get(name);
                if (checkType === 'includes') {
                    expect(expected.includes(actual)).toBe(true);
                } else {
                    expect(actual).toBe(expected);
                }
            });
        });
    });

    describe('message', () => {
        let component = null;
        let $swanMainDom = null;
        beforeEach(() => {
            component = buildComponent(COMPONENT_NAME, Radio, {
                data: {
                    checked: true,
                    value: 'event and message'
                }
            });
            component.radioGroup = {
                id: 'radioGroup'
            };
            $swanMainDom = attach2Document(component).querySelector('swan-radio');
        });
        afterEach(() => component.dispose());

        it('should listen "LabelFirstTapped" message from communicator', done => {
            component.nextTick(() => {
                component.data.set('checked', false);
                component.communicator.fireMessage({
                    type: 'LabelFirstTapped',
                    data: {
                        target: component.id
                    }
                });
                expect(component.data.get('__checked')).toBe(true);
                done();
            });
        });

        it('should listen "LabelTapped" message from communicator', done => {
            component.nextTick(() => {
                component.data.set('checked', false);
                component.communicator.fireMessage({
                    type: 'LabelTapped',
                    data: {
                        target: component.id
                    }
                });
                expect(component.data.get('__checked')).toBe(true);
                done();
            });
        });

        it('should listen radioGroup-myRadioGroup message from communicator', done => {
            const id = 'myRadioGroup';
            component.radioGroup = {
                id
            };
            const checked = component.data.get('__checked');
            const newRadio = buildComponent(COMPONENT_NAME, Radio);
            attach2Document(newRadio);
            newRadio.radioGroup = {
                id
            };
            component.nextTick(() => {
                component.communicator.fireMessage({
                    type: `radioGroup-${id}`,
                    data: {
                        checkedId: newRadio.id
                    }
                });
                component.nextTick(() => {
                    expect(component.data.get('__checked')).toBe(!checked);
                    done();
                    newRadio.dispose();
                });
            });
        });

        it('should dispatch "radio:removed" when use in radio-group and detached', done => {
            getTestCase(options => {
                const {radioGroup, radio1, button} = options;
                button.fire('bindtap');

                expect(radioGroup.checkedId).toBe(radio1.id);
                expect(radioGroup.value).toBe(radio1.data.get('value'));
                radio1.detached();
                expect(radioGroup.checkedId).toBe(null);
                expect(radioGroup.value).toBe('');
                done();
            }, 'submit');
        });

        it('should dispatch "radio:checked" and "radio:checkedChanged" when enabled and used in radio-group', () => {
            getTestCase(options => {
                const {radioGroup, radio1, radio2, button} = options;

                expect(radioGroup.checkedId).toBe(radio1.id);
                const event = new Event('click');
                radio2.el.dispatchEvent(event);
                expect(radioGroup.checkedId).toBe(radio2.id);
                button.fire('bindtap');
                expect(radioGroup.checkedId).toBe(null);
            }, 'reset');
        });
    });

    describe('method', () => {
        let component = null;
        let $swanMainDom = null;
        beforeEach(() => {
            component = buildComponent(COMPONENT_NAME, Radio, {
                data: {
                    checked: true,
                    value: 'method'
                }
            });
            component.radioGroup = {};
            $swanMainDom = attach2Document(component).querySelector('swan-radio');
        });
        afterEach(() => component.dispose());

        it('should listen bindtap', done => {
            getTestCase(options => {
                const {radioGroup, radio1, radio2} = options;
                expect(radioGroup.checkedId).toBe(radio1.id);
                expect(radioGroup.value).toBe(radio1.data.get('value'));
                radio2.fire('bindtap', new Event('touchend'));
                expect(radioGroup.checkedId).toBe(radio2.id);
                expect(radioGroup.value).toBe(radio2.data.get('value'));
                done();
            });
        });

        it('resetFormValue should set checked to be true/false', done => {
            component.resetFormValue();
            component.nextTick(() => {
                const actual = component.data.get('__checked');
                const expected = false;
                expect(actual).toBe(expected);
                done();
            });
        });

        it('should set checked to be true if previous is false', done => {
            const checked = false;
            const newRadio = buildComponent(COMPONENT_NAME, Radio, {
                data: {
                    checked,
                    value: 'should set checked to be true if previous is false'
                }
            });
            attach2Document(newRadio);
            const event = new Event('click');
            newRadio.el.dispatchEvent(event);
            newRadio.nextTick(() => {
                expect(newRadio.data.get('__checked')).toBe(!checked);
                done();
                newRadio.dispose();
            });
        });

        it('should not change checked to be true if disabled', done => {
            const checked = false;
            const newRadio = buildComponent(COMPONENT_NAME, Radio, {
                data: {
                    checked,
                    value: 'should not change checked to be true if disabled',
                    disabled: true
                }
            });
            attach2Document(newRadio);
            newRadio.radioTap();
            newRadio.nextTick(() => {
                const actual = newRadio.data.get('__checked');
                expect(actual).toBe(checked);
                done();
                newRadio.dispose();
            });
        });
    });
});