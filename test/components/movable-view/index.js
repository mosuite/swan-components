/**
 * @file movable-view组件单测
 * @author v_wushuangzhao@baidu.com
 *         yangzongjun(yangzongjun@baidu.com)
 */

import sinon from 'sinon';
import movableView from '../../../src/movable-view/index';
import movableArea from '../../../src/movable-area/index';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import {createSingleTouchEvent, createZoomEvent} from '../../utils/touch';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';
import {privateKey} from '../../../src/utils';

const COMPONENT_NAME = 'movable-view';

function getTestView(options = {}) {
    const componentMovableView = getComponentClass('movable-view', movableView);
    const componentMovableArea = getComponentClass('movable-area', movableArea);

    const factory = getFactory();
    const properties = {
        classProperties: {
            components: {
                'movable-view': componentMovableView,
                'movableA-area': componentMovableArea
            }
        }
    };
    factory.componentDefine(
        'testComponent', {
            template: `
                <swan-page>
                    <movable-area style="${options.movableAreaStyle || ''}">
                        <movable-view s-ref="testview" style="${options.movableViewStyle || ''}"
                            direction="all"
                            x="0"
                            y="0"
                        >
                        </movable-view>
                    </movable-area>
                </swan-page>`,
            initData() {
                return {
                    size: 'default'
                };
            }
        },
        properties
    );
    return new (factory.getComponents('testComponent'))();
}

describe('component[' + COMPONENT_NAME + ']', () => {
    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, movableView);
        const $component = attach2Document(component);
        componentBaseFieldCheck(COMPONENT_NAME, component);
        const $movableView = $component.querySelector('swan-movable-view');

        describe('check touch events', () => {

            it('one finger translate', done => {
                const component2 = buildComponent(
                    `${COMPONENT_NAME}2`,
                    movableView,
                    {
                        data: {
                            direction: 'all',
                            inertia: true
                        }
                    }
                );
                const $component = attach2Document(component2);
                const movableViewElement = $component.querySelector('swan-movable-view');
                const pageX = movableViewElement.getBoundingClientRect().left + 15;
                const currentX = component2.data.get(`${privateKey}.x`);
                createSingleTouchEvent(
                    movableViewElement,
                    [{x: movableViewElement.getBoundingClientRect().left, y: 0}, {x: pageX, y: 0}]
                ).then(() => {
                    expect(component2.data.get(`${privateKey}.x`) !== currentX).toBe(true);
                    component2.dispose();
                    done();
                });
            });

            it('two finger scale', done => {
                const component3 = buildComponent(
                    `${COMPONENT_NAME}3`,
                    movableView,
                    {
                        data: {
                            scale: true
                        }
                    }
                );
                const $component3 = attach2Document(component3);
                const movableViewElement = $component3.querySelector('swan-movable-view');

                const stub = sinon.stub(document, 'elementFromPoint').value(() => movableViewElement);

                const lastScaleValue = component3.data.get(`${privateKey}.scaleValue`);
                component3.areaPosition.width = 100;
                component3.areaPosition.height = 100;
                createZoomEvent(
                    movableViewElement,
                    [
                        [{x: 5, y: 5, keyFrames: '0%'}, {x: 4, y: 4, keyFrames: '100%'}],
                        [{x: 6, y: 6, keyFrames: '0%'}, {x: 7, y: 7, keyFrames: '100%'}]
                    ]
                ).then(() => {
                    setTimeout(() => {
                        expect(component3.data.get(`${privateKey}.scaleValue`)).not.toBe(lastScaleValue);
                        component3.dispose();
                        stub.restore();
                        done();
                    }, 1000);
                });
            });
        });

        describe('check disabled', () => {

            it('should disabled while attr set disabled', done => {
                const component2 = buildComponent(
                    `${COMPONENT_NAME}2`,
                    movableView,
                    {
                        data: {
                            disabled: true
                        }
                    }
                );
                const $component = attach2Document(component2);
                const movableViewElement = $component.querySelector('swan-movable-view');
                const pageX = movableViewElement.getBoundingClientRect().left + 15;
                const currentX = component2.data.get(`${privateKey}.x`);
                createSingleTouchEvent(
                    movableViewElement,
                    [{x: movableViewElement.getBoundingClientRect().left, y: 0}, {x: pageX, y: 0}]
                ).then(() => {
                    expect(component2.data.get(`${privateKey}.x`) === currentX).toBe(true);
                    component2.dispose();
                    done();
                });
            });
        });

        describe('props watch', () =>{
            it('x change should be watched', done => {
                const component5 = buildComponent(`${COMPONENT_NAME}5`, movableView);
                const $component5 = attach2Document(component5);
                $component5.style.height = '500px';
                component5.data.set('x', 200);
                component5.nextTick(() =>{
                    expect(component5.data.get(`${privateKey}.x`)).toBe(200);
                    component5.dispose();
                    done();
                });
            });
            it('y change should be watched', done => {
                const component6 = buildComponent(`${COMPONENT_NAME}6`, movableView);
                const $component6 = attach2Document(component6);
                $component6.style.width = '600px';
                $component6.style.height = '600px';
                component6.data.set('y', 800);
                component6.nextTick(() =>{
                    expect(component6.data.get(`${privateKey}.y`) === 600).toBe(false);
                    component6.dispose();
                    done();
                });
            });
            // 正确scale
            it('scaleValue change should be watched', done => {
                const component7 = buildComponent(`${COMPONENT_NAME}7`, movableView);
                const $component7 = attach2Document(component7);
                component7.data.set('scaleValue', 2);
                component7.nextTick(() =>{
                    expect(component7.data.get(`${privateKey}.scaleValue`)).toBe(2);
                    component7.dispose();
                    done();
                });
            });
            // 错误的scale
            it('scaleValue change should be watched', done => {
                const component8 = buildComponent(`${COMPONENT_NAME}8`, movableView);
                const $component8 = attach2Document(component8);
                component8.data.set('scaleValue', NaN);
                component8.nextTick(() => {
                    expect(component8.data.get(`${privateKey}.scaleValue`)).toBe(1);
                    component8.dispose();
                    done();
                });
            });
            // friction
            it('scaleValue change should be watched', done => {
                const component9 = buildComponent(`${COMPONENT_NAME}9`, movableView);
                const $component9 = attach2Document(component9);
                component9.data.set('friction', 200);
                component9.nextTick(() => {
                    // friction原始值为100
                    expect(component9.INERTIA_UNIT === 100).toBe(false);
                    component9.dispose();
                    done();
                });
            });
        });

        describe('check positon', () => {

            // area的宽高都比view小
            it('should change while area < view', done => {
                let component10 = getTestView({
                    movableAreaStyle: 'display: inline-block; width: 20px; height: 20px',
                    movableViewStyle: 'display: inline-block; width: 100px; height: 100px'
                });
                component10.attach(document.body);
                let compInstance = component10.ref('testview');
                const movableViewElement = compInstance.el;
                const pageX = movableViewElement.getBoundingClientRect().left + 15;
                const currentX = compInstance.data.get(`${privateKey}.x`);
                createSingleTouchEvent(
                    movableViewElement,
                    [{x: movableViewElement.getBoundingClientRect().left, y: 0}, {x: pageX, y: 0}]
                ).then(() => {
                    expect(compInstance.data.get(`${privateKey}.x`) === currentX).toBe(true);
                    component10.dispose();
                    done();
                });
            });

            // area的宽比view小，高比view大
            it('should change while: area widht < view width,  area height > view height', done => {
                let component11 = getTestView({
                    movableAreaStyle: 'display: inline-block; width: 10px; height: 500px;',
                    movableViewStyle: 'display: inline-block; width: 300px; height: 10px;'
                });
                component11.attach(document.body);
                let compInstance = component11.ref('testview');
                compInstance.nextTick(() => {
                    const movableViewElement = compInstance.el;
                    const pageX = movableViewElement.getBoundingClientRect().left + 15;
                    const currentX = compInstance.data.get(`${privateKey}.x`);
                    createSingleTouchEvent(
                        movableViewElement,
                        [{x: movableViewElement.getBoundingClientRect().left, y: 0}, {x: pageX, y: 0}]
                    ).then(() => {
                        expect(compInstance.data.get(`${privateKey}.x`) === currentX).toBe(true);
                        component11.dispose();
                        done();
                    });
                });
            });

            // area的宽比view大，高比view小
            it('should change while area widht > view width,  area height < view height', done => {
                let component12 = getTestView({
                    movableAreaStyle: 'display: inline-block; width: 200px; height: 20px',
                    movableViewStyle: 'display: inline-block; width: 10px; height: 100px'
                });
                component12.attach(document.body);
                let compInstance = component12.ref('testview');
                const movableViewElement = compInstance.el;
                const pageX = movableViewElement.getBoundingClientRect().left + 15;
                const currentX = compInstance.data.get(`${privateKey}.x`);
                createSingleTouchEvent(
                    movableViewElement,
                    [{x: movableViewElement.getBoundingClientRect().left, y: 0}, {x: pageX, y: 0}]
                ).then(() => {
                    expect(compInstance.data.get(`${privateKey}.x`) === currentX).toBe(false);
                    component12.dispose();
                    done();
                });
            });

            // area的宽高都比view大
            it('should change while area > view', done => {
                let component13 = getTestView({
                    movableAreaStyle: 'display: inline-block; width: 200px; height: 200px',
                    movableViewStyle: 'display: inline-block; width: 100px; height: 100px'
                });
                component13.attach(document.body);
                let compInstance = component13.ref('testview');
                const movableViewElement = compInstance.el;
                const pageX = movableViewElement.getBoundingClientRect().left + 15;
                const currentX = compInstance.data.get(`${privateKey}.x`);
                createSingleTouchEvent(
                    movableViewElement,
                    [{x: movableViewElement.getBoundingClientRect().left, y: 0}, {x: pageX, y: 0}]
                ).then(() => {
                    expect(compInstance.data.get(`${privateKey}.x`) === currentX).toBe(false);
                    component13.dispose();
                    done();
                });
            });
        });
    });
});
