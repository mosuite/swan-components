import sinon from 'sinon';
import CheckboxGroup from '../../../src/checkbox-group/index';
import Checkbox from '../../../src/checkbox/index';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
const COMPONENT_NAME = 'checkbox-group';


describe('component [' + COMPONENT_NAME + ']', () => {
    const component = buildComponent(COMPONENT_NAME, CheckboxGroup);
    const $component = attach2Document(component);
    componentBaseFieldCheck(COMPONENT_NAME, component);
    it('should be render while attach', () => {
        let $swanCheckboxGroup = $component.querySelector('swan-checkbox-group');
        expect($swanCheckboxGroup).not.toBe(null);
    });
    it('should has one slot', () => {
        expect(component.slot.length).toBe(1);
    });

    describe('methods and messages', () => {
        let checkbox = null;
        let $checkbox = null;
        beforeEach(() => {
            checkbox = buildComponent('checkbox', Checkbox);
            $checkbox = attach2Document(checkbox);
        });

        afterEach(() => {
            checkbox.dispose();
        });

        describe('Checkbox group message', () => {
            it('should exec changeCheckbox while fire event checkbox-item-change', done => {
                const changeCheckbox = sinon.spy(component, 'changeCheckbox');
                component.messages['checkbox-item-change'].call(component, {value: checkbox, checked: false});
                expect(changeCheckbox.calledOnce).toBe(true);
                changeCheckbox.restore();
                done();
            });
            it('should exec init Checkbox while fire event checkbox-item-init', done => {
                const changeCheckbox = sinon.spy(component, 'changeCheckbox');
                component.messages['checkbox-item-init'].call(component, {value: checkbox, checked: false});
                expect(changeCheckbox.calledOnce).toBe(true);
                changeCheckbox.restore();
                done();
            });
            it('should fire bindchange event', done => {
                const callback = sinon.spy();
                component.on('bindchange', callback);
                component.messages['checkbox-item-change'].call(component, {value: checkbox, checked: true});
                component.nextTick(() => {
                    expect(callback.calledOnce).toBe(true);
                    done();
                });
            });
        });

        describe('Methods', () => {

            it('getFormValue: should return property value', done => {
                component.messages['checkbox-item-init'].call(component, {value: {value: 123, checked: true}});
                expect(component.getFormValue().length).toBe(1);
                done();
            });

            it('changeCheckbox: should not change value while params is null', done => {
                component.messages['checkbox-item-change'].call(component, {value: null});

                let spy = sinon.spy(component, 'dispatchEvent');
                expect(spy.calledOnceWith(
                    component,
                    'bindchange',
                    sinon.match
                        .has('detail')
                        .and(
                            sinon.match.has(
                                'value', [123] // [123]是上一个init的数据，本次change没有改动checkbox-group的值
                            )
                        )
                    )
                );
                spy.restore();
                done();
            });

            it('resetFormValue: should reset checkbox value', done => {
                component.messages['checkbox-item-change'].call(component, {value: {value: 123, checked: true}});
                component.resetFormValue();
                expect(checkbox.data.get('checked')).toBe(false);
                done();
            });

            it('should reRegisterFormItem while name changed', done => {
                const spy = sinon.spy(component, 'reRegisterFormItem');
                component.data.set('name', 'anotherName');
                expect(spy.callCount).toBe(1);
                done();
            });
        });
    });
});
