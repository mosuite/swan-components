import sinon from 'sinon';
import checkbox from '../../../src/checkbox/index';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import Communicator from '../../mock/communicator';
const COMPONENT_NAME = 'checkbox';


describe('component [' + COMPONENT_NAME + ']', () => {
    const component = buildComponent(COMPONENT_NAME, checkbox);
    const $component = attach2Document(component);
    componentBaseFieldCheck(COMPONENT_NAME, component);
    it('should be render while attach', () => {
        let $swanCheckbox = $component.querySelector('swan-checkbox');
        let $innerDiv = $component.querySelector('swan-checkbox>div');
        expect($swanCheckbox).not.toBe(null);
        expect($innerDiv).not.toBe(null);
    });
    it('should has one slot', () => {
        expect(component.slot.length).toBe(1);
    });


    describe('check props', () => {
        const defaults = [
            ['checked', false],
            ['disabled', false],
            ['color', ['#3C76FF', '#3c76ff'], 'includes']
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
            component = buildComponent(COMPONENT_NAME, checkbox);
            $swanMainDom = attach2Document(component).querySelector('swan-checkbox');
        });

        afterEach(() => component.dispose());

        describe('event and message', () => {
            it('should watch checked and dispatch checkbox-item-change when use in checkbox-group', done => {
                const dispatch = sinon.spy(component, 'dispatch');
                component.data.set('checked', true);
                component.nextTick(() => {
                    expect(
                        dispatch.calledOnceWith(
                            'checkbox-item-change',
                            sinon.match
                                .has('value', component.data.get('value'))
                                .and(sinon.match.has('checked', true))
                        )
                    ).toBe(true);
                    dispatch.restore();
                    done();
                });
            });


            it('should listen LabelTapped message from communicator', () => {
                const spy = sinon.spy(component, 'onClick');
                Communicator.getInstance().fireMessage({
                    type: 'LabelTapped',
                    data: {
                        target: component.uid
                    }
                });
                spy.restore();
                expect(spy.calledOnce).toBe(true);
            });

            it('should listen LabelFirstTapped message from communicator', done => {
                component.data.set('checked', true);
                Communicator.getInstance().fireMessage({
                    type: 'LabelFirstTapped',
                    data: {
                        target: component.uid
                    }
                });

                component.nextTick(() => {
                    expect(component.data.get('__checked')).toBe(false);
                    done();
                });
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
                component.data.set('disabled', true);
                component.nextTick(() => {
                    component.onClick();
                    component.nextTick(() => {
                        const actual = component.data.get('__checked');
                        const expected = false;
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
