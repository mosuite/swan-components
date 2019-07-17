import sinon from 'sinon';
import switchComponent from '../../../src/switch/index';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
const COMPONENT_NAME = 'switch';


describe('component [' + COMPONENT_NAME + ']', () => {
    const component = buildComponent(COMPONENT_NAME, switchComponent);
    const $component = attach2Document(component);
    componentBaseFieldCheck(COMPONENT_NAME, component);
    it('should be render while attach', () => {
        let $swanSwitch = $component.querySelector('swan-switch');
        let $switchInput = $component.querySelector('.swan-switch-input');
        let $checkboInput = $component.querySelector('.swan-checkbox-input');
        expect($swanSwitch).not.toBe(null);
        expect($switchInput).not.toBe(null);
        expect($checkboInput).not.toBe(null);
    });

    describe('check props', () => {
        const defaults = [
            ['checked', false],
            ['disabled', false],
            ['color', ['#3388FF', '#3388ff'], 'includes']
        ];

        defaults.forEach(
            ([name, expected, checkType]) => {
                const message = checkType === 'includes'
                    ? `${name} default value should be one of ${expected.join()}`
                    : `${name} default value should be ${expected}`;

                it(message, () => {
                    const data = component.data;
                    const actual = data.get(name);
                    if (checkType === 'includes') {
                        expect(expected.includes(actual)).toBe(true);
                    }
                    else {
                        expect(actual).toBe(expected);
                    }
                });
            }
        );
    });

    describe('event and message', () => {
        let component = null;
        let $swanMainDom = null;
        beforeEach(() => {
            component = buildComponent(COMPONENT_NAME, switchComponent);
            $swanMainDom = attach2Document(component).querySelector('swan-switch');
        });

        afterEach(() => component.dispose());

        describe('base faeture', () => {
            it('should disabled', done => {
                component.data.set('disabled', true);
                component.el.click();
                expect(component.data.get('checked')).toBe(false);
                done();
            });

            it('should reRegisterFormItem while name changed', done => {
                const spy = sinon.spy(component, 'reRegisterFormItem');
                component.data.set('name', 'anotherName');
                expect(spy.callCount).toBe(1);
                done();
            });
        });

        describe('event and message', () => {
            it('should listen LabelTapped/LabelFirstTapped message from communicator', () => {
                const spy = sinon.spy(component, 'onClick');
                component.communicator.fireMessage({
                    type: 'LabelFirstTapped',
                    data: {
                        target: component.uid
                    }
                });
                expect(spy.callCount).toBe(1);
                component.communicator.fireMessage({
                    type: 'LabelTapped',
                    data: {
                        target: component.uid
                    }
                });
                spy.restore();
                expect(spy.callCount).toBe(2);
            });

            it('should handle from reset', () => {
                component.data.set('checked', true)
                component.resetFormValue();
                expect(component.data.get('__checked')).toBe(false);
            });

            it('should handle from submit', () => {
                component.data.set('checked', true)
                expect(component.getFormValue()).toBe(true);
            });
        });


        describe('onClick method', () => {
            it('should set checked to be true if previous is false', done => {
                expect(component.data.get('__checked')).toBe(false);
                component.onClick();
                component.nextTick(() => {
                    const actual = component.data.get('__checked');
                    const expected = true;
                    expect(actual).toBe(expected);
                    done();
                });
            });

            it('should not change checked to be true if disabled', done => {
                expect(component.data.get('__checked')).toBe(false);
                component.data.set('disabled');
                component.nextTick(() => {
                    component.onClick();
                    component.nextTick(() => {
                        const actual = component.data.get('__checked');
                        const expected = true;
                        expect(actual).toBe(expected);
                        done();
                    });
                });
            });
        });

        describe('listen dom event', () => {
            it('should call onClick if clicked', () => {
                const inputTap = sinon.spy(component, 'onClick');
                const event = new Event('click');
                $swanMainDom.dispatchEvent(event);
                expect(inputTap.calledOnceWith(event));
            });
        });
    });
});
