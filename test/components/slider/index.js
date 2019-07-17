/**
 * @file slider组件单测
 * @author yanghuabei@baidu.com
 */

import sinon from 'sinon';
import Slider from '../../../src/slider';
import View from '../../../src/view/index';
import Form from '../../../src/form/index';
import Button from '../../../src/button/index';
import buildComponent from '../../mock/swan-core/build-component';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import {createSingleTouchEvent} from '../../utils/touch';

const COMPONENT_NAME = 'slider';

/* eslint-disable max-nested-callbacks */
describe(`component [${COMPONENT_NAME}]`, () => {
    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, Slider);
        const $component = attach2Document(component);
        componentBaseFieldCheck(COMPONENT_NAME, component);
        it('should be rendered after attach', () => {
            const $swanSlider = $component.querySelector('swan-slider');
            expect($swanSlider).not.toBe(null);
        });

        describe('default props', () => {
            const defaults = [
                ['min', 0],
                ['max', 100],
                ['step', 1],
                ['disabled', false],
                ['value', 0],
                ['backgroundColor', ['#ccc', '#CCC', '#cccccc', '#CCCCCC'], 'includes'],
                ['blockSize', '24'],
                ['blockColor', ['#fff', '#ffffff', '#FFF', '#FFFFFF'], 'includes'],
                ['activeColor', ['#3c76ff', '#3C76FF'], 'includes'],
                ['showValue', false],
                ['bindchange', undefined],
                ['bindchanging', undefined]
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

        describe('check touch events', () => {
            let component = null;
            let $component = null;
            let sliderElement = null;
            let targetElement = null;
            beforeEach(() => {
                component = buildComponent(COMPONENT_NAME, Slider);
                $component = attach2Document(component);
                sliderElement = $component.querySelector('.swan-slider-handle');
                targetElement = $component.querySelector('.swan-slider-tap-area');
            });

            afterEach(() => component.dispose());

            it('should set startPageX on touchstart', done => {
                const pageX = sliderElement.getBoundingClientRect().left + 5;
                createSingleTouchEvent(sliderElement, [{x: pageX, y: 0}]).then(() => {
                    const actual = component.startPageX;
                    const expected = pageX;
                    expect(actual).toBe(expected);
                    done();
                });
            });

            it('should fire changing event on touchmove, fire change on touchend with right args', done => {
                const data = component.data;
                const pageX = targetElement.offsetLeft;
                const pageY = targetElement.offsetTop;

                const wrapperWidth = targetElement.clientWidth;
                const stepDistance = wrapperWidth / data.get('max');
                const movePageX = pageX + stepDistance * 2;


                createSingleTouchEvent(sliderElement, [{x: pageX, y: pageY}, {x: movePageX, y: pageY}]).then(() => {
                    expect(data.get('value')).toBe(2);
                    done();
                }).catch(() => {
                    done();
                });
            });

            // 点击而非滑动
            it('should fire changing while tap other than move on the slide', done => {
                const data = component.data;
                const pageX = targetElement.offsetLeft;
                const pageY = targetElement.offsetTop;

                const wrapperWidth = targetElement.clientWidth;
                const stepDistance = wrapperWidth / data.get('max');
                const movePageX = pageX + stepDistance * 2;


                createSingleTouchEvent(targetElement, [{x: movePageX, y: pageY}, {x: movePageX, y: pageY}]).then(() => {
                    expect(data.get('value')).toBe(2);
                    done();
                }).catch(() => {
                    done();
                });
            });
        });

        describe('check touch events under position: relative; element', () => {
            const componentView = getComponentClass('view', View);
            const componentSlider = getComponentClass('slider', Slider);
            const factory = getFactory();
            const properties = {
                classProperties: {
                    components: {
                        view: componentView,
                        slider: componentSlider
                    }
                }
            };

            factory.componentDefine(
                'swan-slider',
                {
                    template: `
                    <swan-page>
                        <view style="position: relative; margin-left: 40px;">
                            <slider s-ref='slider'>
                            </slider>
                        </view>
                    </swan-page>
                    `
                },
                properties
            );
            const TestView = factory.getComponents('swan-slider');
            const testview = new TestView();
            testview.attach(document.body);
            const sliderComp = testview.ref('slider');
            const sliderElement = sliderComp.el.querySelector('.swan-slider-handle');
            const targetElement = sliderComp.el.querySelector('.swan-slider-tap-area');

            it('should fire changing event on touchmove, fire change on touchend with right args', done => {
                const data = sliderComp.data;
                const pageX = targetElement.getBoundingClientRect().left;
                const pageY = targetElement.getBoundingClientRect().top;

                const wrapperWidth = targetElement.clientWidth;
                const stepDistance = wrapperWidth / data.get('max');
                const movePageX = pageX + stepDistance * 2;


                createSingleTouchEvent(sliderElement, [{x: pageX, y: pageY}, {x: movePageX, y: pageY}]).then(() => {
                    expect(data.get('value')).toBe(2);
                    done();
                }).catch(() => {
                    done();
                });
            });
        });

        describe('verify set props', () => {
            it('should disabled', done => {
                const component = buildComponent(
                    COMPONENT_NAME,
                    Slider,
                    {
                        data: {
                            disabled: true
                        }
                    }
                );
                attach2Document(component);

                const targetElement = component.el.querySelector('.swan-slider-tap-area');
                const data = component.data;
                const pageX = targetElement.offsetLeft;
                const pageY = targetElement.offsetTop;

                const wrapperWidth = targetElement.clientWidth;
                const stepDistance = wrapperWidth / data.get('max');
                const movePageX = pageX + stepDistance * 2;


                createSingleTouchEvent(targetElement, [{x: movePageX, y: pageY}, {x: movePageX, y: pageY}]).then(() => {
                    expect(data.get('value')).toBe(0);
                    done();
                }).catch(() => {
                    done();
                });
            });

            it('blockSize width should not be small than 12px', () => {
                const component = buildComponent(
                    COMPONENT_NAME,
                    Slider,
                    {
                        data: {
                            blockSize: 5
                        }
                    }
                );
                const $component = attach2Document(component);
                const slider = $component.querySelector('.swan-slider-thumb');
                const actual = slider.style.width;
                const expected = '12px';
                expect(actual).toBe(expected);
                component.dispose();
            });

            it('blockSize width should not be larger than 28px', () => {
                const component = buildComponent(
                    COMPONENT_NAME,
                    Slider,
                    {
                        data: {
                            blockSize: 29
                        }
                    }
                );
                const $component = attach2Document(component);
                const slider = $component.querySelector('.swan-slider-thumb');
                const actual = slider.style.width;
                const expected = '28px';
                expect(actual).toBe(expected);
                component.dispose();
            });

            it('should reRegisterFormItem while name changed', done => {
                const spy = sinon.spy(component, 'reRegisterFormItem');
                component.data.set('name', 'anotherName');
                expect(spy.callCount).toBe(1);
                done();
            });
        });

        describe('form', () => {
            function getInstance(buttonType) {
                const componentView = getComponentClass('view', View);
                const componentSlider = getComponentClass('slider', Slider);
                const componentForm = getComponentClass('form', Form);
                const componentButton = getComponentClass('button', Button);
                const factory = getFactory();
                const properties = {
                    classProperties: {
                        components: {
                            view: componentView,
                            slider: componentSlider,
                            form: componentForm,
                            button: componentButton
                        }
                    }
                };

                factory.componentDefine(
                    'swan-slider',
                    {
                        template: `
                        <swan-page>
                            <form>
                                <slider name="mySlider" s-ref='slider' value="50"></slider>
                                <button form-type="${buttonType}" s-ref="button">button</button>
                            </form>
                        </swan-page>
                        `
                    },
                    properties
                );
                const TestView = factory.getComponents('swan-slider');
                const testview = new TestView();
                testview.attach(document.body);
                return testview;
            }

            it('should call getFormValue', done => {
                const testview = getInstance('submit');
                const sliderComponent = testview.ref('slider');
                const buttonComponent = testview.ref('button');
                const spy = sinon.spy(sliderComponent, 'getFormValue');
                buttonComponent.fire('bindtap');
                expect(spy.callCount).toBe(1);
                testview.dispose();
                done();
            });

            it('should call resetFormValue', done => {
                const testview = getInstance('reset');
                const sliderComponent = testview.ref('slider');
                const buttonComponent = testview.ref('button');
                const spy = sinon.spy(sliderComponent, 'resetFormValue');
                buttonComponent.fire('bindtap');
                expect(spy.callCount).toBe(1);
                testview.dispose();
                done();
            });
        });
    });
});
