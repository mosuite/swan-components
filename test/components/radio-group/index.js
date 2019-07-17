/**
 * @file radio-group组件单测
 * @author  yanghuabei@baidu.com
 *          mabin03@baidu.com
 */

import sinon from 'sinon';
import RadioGroup from '../../../src/radio-group';
import Radio from '../../../src/radio';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import {getTestCase} from '../radio';

const COMPONENT_NAME = 'radio-group';

/* eslint-disable max-nested-callbacks */
describe(`component [${COMPONENT_NAME}]`, () => {
    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, RadioGroup);
        const $component = attach2Document(component);

        componentBaseFieldCheck(COMPONENT_NAME, component);

        it('should be rendered after attach', () => {
            const $swanMainDom = $component.querySelector('swan-radio-group');
            expect($swanMainDom).not.toBe(null);
        });

        it('should has one default slot', () => {
            expect(component.slot.length).toBe(1);
        });
    });

    describe('default props', () => {
        const component = buildComponent(COMPONENT_NAME, RadioGroup);
        attach2Document(component);

        const defaults = [
            ['bindchange', undefined]
        ];
        defaults.forEach(([name, expected]) => {
            it(`${name} default value should be ${expected}`, () => {
                expect(component.data.get(name)).toBe(expected);
            });
        });
    });

    describe('methods and messages', () => {
        let component = null;
        let radio = null;
        beforeEach(() => {
            component = buildComponent(COMPONENT_NAME, RadioGroup);
            radio = buildComponent('radio', Radio);
            attach2Document(component).querySelector('swan-radio');
            attach2Document(radio);
        });

        afterEach(() => {
            component.dispose();
            radio.dispose();
        });

        describe('"radio:checkedChanged" message', () => {
            it('should remove radio if checked', done => {
                component.checkedId = radio.id;
                component.messages['radio:checkedChanged'].call(component, {
                    target: radio
                });
                component.nextTick(() => {
                    component.nextTick(() => {
                        expect(component.checkedId).toBe(null);
                        done();
                    });
                });
            });

            it('should add radio if unchecked', done => {
                radio.data.set('checked', true);
                radio.nextTick(() => {
                    component.nextTick(() => {
                        component.messages['radio:checkedChanged'].call(component, {
                            target: radio
                        });
                        expect(component.checkedId).toBe(radio.id);
                        done();
                    });
                });
            });
        });

        describe('"radio:added" message', () => {

            it('should reRegisterFormItem while name changed', done => {
                const spy = sinon.spy(component, 'reRegisterFormItem');
                component.data.set('name', 'anotherName');
                expect(spy.callCount).toBe(1);
                done();
            });

            it('should add radioGroup to radio', () => {
                component.messages['radio:added'].call(component, {
                    target: radio
                });
                expect(radio.radioGroup).toBe(component);
                expect(component.value).toBe('');
                expect(component.checkedId).toBe(null);
            });

            it('should set value and checkedId if radio is checked', done => {
                radio.dispose();
                radio = buildComponent(
                    'radio',
                    Radio, {
                        data: {
                            checked: true,
                            value: 1
                        }
                    }
                );
                attach2Document(radio);
                component.messages['radio:added'].call(component, {
                    target: radio
                });
                component.nextTick(() => {
                    expect(component.value).toBe(1);
                    expect(component.checkedId).toBe(radio.id);
                    done();
                });
            });

            it('getFormValue should return value', () => {
                radio.dispose();
                radio = buildComponent(
                    'radio',
                    Radio, {
                        data: {
                            checked: true,
                            value: 1
                        }
                    }
                );
                attach2Document(radio);
                component.messages['radio:added'].call(component, {
                    target: radio
                });
                component.nextTick(() => {
                    const actual = component.getFormValue();
                    const expected = radio.data.get('value');
                    expect(actual).toBe(expected);
                });
            });
        });

        describe('"radio:removed" message', () => {
            it('should unset value and checkedId', done => {
                component.dispose();
                component = buildComponent(
                    COMPONENT_NAME,
                    RadioGroup, {
                        data: {
                            checkedId: radio.id,
                            value: 1
                        }
                    }
                );
                attach2Document(component);
                component.messages['radio:removed'].call(component, {
                    target: radio
                });
                component.nextTick(() => {
                    expect(component.value).toBe('');
                    expect(component.checkedId).toBe(null);
                    done();
                });
            });
        });

        describe('"radio:checked" message', () => {
            it('should fire communicator "radioGroup-id" message', () => {
                getTestCase(options => {
                    const {radioGroup, radio1, radio2} = options;
                    expect(radioGroup.checkedId).toBe(radio1.id);
                    const event = new Event('click');
                    radio2.el.dispatchEvent(event);
                    expect(radioGroup.checkedId).toBe(radio2.id);
                });
            });

            it('should fire "bindchange" event', done => {
                getTestCase(options => {
                    const {radioGroup, radio1} = options;
                    expect(radioGroup.checkedId).toBe(radio1.id);
                    radioGroup.on('bindchange', e => {
                        expect(e.detail.value).toBe('bindchange');
                        done();
                    });
                    radioGroup.dispatchEvent('bindchange', {
                        detail: {
                            value: 'bindchange'
                        }
                    });
                });
            });
        });
    });
});
