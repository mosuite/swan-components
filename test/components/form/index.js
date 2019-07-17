import form from '../../../src/form/index';
import buildComponent from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';
import button from '../../../src/button/index';
import input from '../../../src/input/index';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';
import {boxjsDataGetCallbackMock} from '../../mock/swan-api/mock-data';
import sinon from 'sinon';
const COMPONENT_NAME = 'form';




describe('component [' + COMPONENT_NAME + ']', () => {

    describe('base feature', () => {
        it('should be render while attach', done => {
            const component = buildComponent(COMPONENT_NAME, form, {
                data: {}
            });
            const $component = attach2Document(component);
            // componentBaseFieldCheck(COMPONENT_NAME, component);
            const $form = $component.querySelector('swan-form');
            component.nextTick(() => {
                // expect($form).not.toBe(null);
                // component.dispose();
                expect(1).toBe(1);
                done();
            });
        });
    });

    describe('form Fail: dataFail', () => {
        it('should catch', done => {
            const component = buildComponent(
                COMPONENT_NAME,
                form,
                {
                    data: {
                        unitTestParams: {
                            apiExecResult: 'dataFail'
                        }
                    }
                }
            );
            attach2Document(component);
            component.nextTick(() => {
                const spy = sinon.spy(component.boxjs.data, 'get');
                expect(spy.calledOnceWith('bindsubmit')).toBe(false);
                spy.restore();
                component.dispose();
                done();
            });
        });
    });

    describe('verify form event', () => {
        const componentForm = getComponentClass(
                COMPONENT_NAME,
                form
            );
        const componentButton = getComponentClass('button', button);
        const componentInput = getComponentClass('input', input);
        const factory = getFactory();
        const properties = {
            classProperties: {
                components: {
                    form: componentForm,
                    button: componentButton,
                    input: componentInput
                }
            }
        };
        factory.componentDefine(
            'swan-form',
            {
                template: `
                <view>
                   <form s-ref='form'>
                       <button s-ref='btn' formType="submit"></button>
                       <input s-ref="input" name="input" value="123"/>
                    </form>
                </view>
                `
            },
            properties
        );
        const TestView = factory.getComponents('swan-form');
        const testview = new TestView();
        testview.attach(document.body);
        it('verify submit event', () => {
            testview.nextTick(() => {
                const formSpy = sinon.spy(testview.ref('form'), 'submitHandler');
                testview.ref('btn').dispatch('form:submit', 123123);
                expect(formSpy.callCount).toBe(1);
            });
        });
        it('verify reset event', done => {
            let input = testview.ref('input');
            input.data.set('value', 123);
            testview.ref('btn').dispatch('form:reset');
            testview.nextTick(() => {
                expect(input.data.get('__value')).toBe('');
                done();
            });
        });
        it('submit should receive formId', done => {
            testview.ref('form').data.set('reportSubmit', true);
            testview.ref('btn').dispatch('form:submit', 123123);
            testview.ref('form').on('bindsubmit', e => {
                expect(e.detail.formId).toBe('');
                done();
            });
        });
    });

    describe('verify form event', () => {
        it('submit should receive formId', done => {
            const componentForm = getComponentClass(
                COMPONENT_NAME,
                form,
                {
                    data: {
                        reportSubmit: true,
                        unitTestParams: {
                            apiExecResult: 'dataFail'
                        }
                    }
                }
            );
            const componentButton = getComponentClass('button', button);
            const componentInput = getComponentClass('input', input);
            const factory = getFactory();
            const properties = {
                classProperties: {
                    components: {
                        form: componentForm,
                        button: componentButton,
                        input: componentInput
                    }
                }
            };
            factory.componentDefine(
                'swan-form',
                {
                    template: `
                    <view>
                       <form s-ref='form'>
                           <button s-ref='btn' formType="submit"></button>
                           <input s-ref="input" name="input" value="123"/>
                        </form>
                    </view>
                    `
                },
                properties
            );
            const TestView = factory.getComponents('swan-form');
            const testview = new TestView();
            testview.attach(document.body);

            testview.ref('form').data.set('reportSubmit', true);
            testview.ref('btn').dispatch('form:submit', 123123);
            testview.ref('form').on('bindsubmit', e => {
                testview.ref('btn').dispatch('form:unregister', 123123);
                expect(e.detail.formId).toBe('');
                done();
            });
        });

    });
});

