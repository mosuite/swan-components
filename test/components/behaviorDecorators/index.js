/**
 * @file slider组件单测
 * @author yanghuabei@baidu.com
 */

import sinon from 'sinon';
import Button from '../../../src/button/index';
import Video from '../../../src/video/index';
import CoverView from '../../../src/cover-view';
import buildComponent from '../../mock/swan-core/build-component';
import {createAnimation} from '../../../src/utils/animation';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import {createSingleTouchEvent} from '../../utils/touch';

const COMPONENT_NAME = 'behaviorDecorators';

function createTouchEvent(type, touchData, target) {
    const event = new TouchEvent(
        type,
        {
            changedTouches: [
                new Touch({
                    identifier: 10001,
                    target: target,
                    ...touchData
                })
            ],
            targetTouches: [
                new Touch({
                    identifier: 10001,
                    target: target,
                    ...touchData
                })
            ],
            bubbles: true
        }
    );
    return event;
}

/* eslint-disable max-nested-callbacks */
describe(`component [${COMPONENT_NAME}]`, () => {
    describe('userTouchEvents', () => {

        function getTestView(initData) {
            const componentButton = getComponentClass(
                'button',
                Button,
                {
                    data: {
                    }
                }
            );

            const factory = getFactory();
            const properties = {
                classProperties: {
                    components: {
                        button: componentButton
                    }
                }
            };
            factory.componentDefine(
                'testComponent', {
                    template: `
                        <swan-page>
                            <button s-ref="button"
                                disabled="{{disabled}}"
                                hover-stop-propagation="true"
                                bindtouchstart="bindtouchstart"
                                bindtouchmove="bindtouchmove"
                                bindtap="bindtap"
                                bindlongtap="bindlongtap"
                            >
                            na button
                        </button>
                        </swan-page>`,
                    initData() {
                        return {
                            size: 'default',
                            disabled: true,
                            ...initData
                        };
                    }
                },
                properties
            );
            return new (factory.getComponents('testComponent'))();
        }

        describe('touchend', () => {
            it('touchend disabled', done => {
                let component = buildComponent(
                    'button',
                    Button,
                    {
                        data: {
                            disabled: true
                        }
                    }
                );
                attach2Document(component);

                const stub = sinon.stub(component, 'subTag').value('button');
                component.el.dispatchEvent(createTouchEvent('touchend', {x: 0, y: 0}, component.el));
                const spy = sinon.spy(component, 'fire');
                expect(spy.callCount).toBe(0);

                stub.restore();
                spy.restore();
                component.dispose();
                done();
            });
        });

        describe('touchcancel', () => {
            it('should trigger touchcancel', done => {
                let component = buildComponent(
                    'button',
                    Button,
                    {
                        data: {
                            disabled: false
                        }
                    }
                );
                attach2Document(component);

                let called = false;
                component.on('bindtouchcancel', () => {
                    called = true;
                });

                component.el.dispatchEvent(createTouchEvent('touchcancel', {x: 0, y: 0}, component.el));
                expect(called).toBe(true);
                component.dispose();
                done();
            });
        });

        describe('tap', () => {
            it('tapevent disabled', done => {
                let component = getTestView({disabled: true});
                component.attach(document.body);
                let buttonInstance = component.ref('button');

                let called = false;
                buttonInstance.on('bindtap', () => {
                    called = true;
                });

                const stub = sinon.stub(buttonInstance, 'subTag').value('button');
                buttonInstance.el.dispatchEvent(new Event('tapevent'));

                expect(called).toBe(false);
                stub.restore();
                component.dispose();
                done();
            });

            it('should trigger tapevent', done => {
                let component = getTestView({disabled: false});
                component.attach(document.body);
                let buttonInstance = component.ref('button');

                let called = false;
                buttonInstance.on('bindtap', () => {
                    called = true;
                });

                buttonInstance.el.dispatchEvent(createTouchEvent('touchstart', {x: 0, y: 0}, buttonInstance.el));
                buttonInstance.el.dispatchEvent(createTouchEvent('touchend', {x: 0, y: 0}, buttonInstance.el));
                buttonInstance.el.dispatchEvent(new Event('tapevent'));

                expect(called).toBe(true);
                component.dispose();
                done();
            });
        });

        describe('langtap', () => {
            it('tapevent disabled', done => {
                let component = getTestView({disabled: true});
                component.attach(document.body);
                let buttonInstance = component.ref('button');

                let called = false;
                buttonInstance.on('bindtap', () => {
                    called = true;
                });

                const stub = sinon.stub(buttonInstance, 'subTag').value('button');
                buttonInstance.el.dispatchEvent(new Event('longtapevent'));

                expect(called).toBe(false);
                stub.restore();
                component.dispose();
                done();
            });

            it('should not trigger longTapevent while distance > default value', done => {
                let component = getTestView({disabled: false});
                component.attach(document.body);
                let buttonInstance = component.ref('button');

                let called = false;
                buttonInstance.on('bindlongtap', () => {
                    called = true;
                });

                buttonInstance.el.dispatchEvent(createTouchEvent('touchstart', {x: 0, y: 0, screenX: 0, screenY: 0}, buttonInstance.el));
                buttonInstance.el.dispatchEvent(createTouchEvent('touchmove', {x: 0, y: 0, screenX: 20, screenY: 20}, buttonInstance.el));
                buttonInstance.el.dispatchEvent(new Event('longtapevent'));

                expect(called).toBe(true);
                component.dispose();
                done();
            });

            it('should trigger longTapevent', done => {
                let component = getTestView({disabled: false});
                component.attach(document.body);
                let buttonInstance = component.ref('button');

                let called = false;
                buttonInstance.on('bindlongtap', () => {
                    called = true;
                });

                buttonInstance.el.dispatchEvent(createTouchEvent('touchstart', {x: 0, y: 0}, buttonInstance.el));
                buttonInstance.el.dispatchEvent(createTouchEvent('touchend', {x: 0, y: 0}, buttonInstance.el));
                buttonInstance.el.dispatchEvent(new Event('longtapevent'));

                expect(called).toBe(true);
                component.dispose();
                done();
            });

            it('should trigger longpress', done => {
                function getTestView(initData) {
                    const componentButton = getComponentClass(
                        'button',
                        Button,
                        {
                            data: {
                            }
                        }
                    );

                    const factory = getFactory();
                    const properties = {
                        classProperties: {
                            components: {
                                button: componentButton
                            }
                        }
                    };
                    factory.componentDefine(
                        'testComponent', {
                            template: `
                                <swan-page>
                                    <button s-ref="button" disabled="{{disabled}}" bindtouchstart="bindtouchstart"
                                        bindtouchmove="bindtouchmove"
                                        bindtap="bindtap"
                                        bindlongpress="bindlongpress"
                                    >
                                    na button
                                </button>
                                </swan-page>`,
                            initData() {
                                return {
                                    size: 'default',
                                    disabled: true,
                                    ...initData
                                };
                            }
                        },
                        properties
                    );
                    return new (factory.getComponents('testComponent'))();
                }

                let component = getTestView({disabled: false});
                component.attach(document.body);
                let buttonInstance = component.ref('button');

                let called = false;
                buttonInstance.on('bindlongpress', () => {
                    called = true;
                });

                buttonInstance.el.dispatchEvent(createTouchEvent('touchstart', {x: 0, y: 0}, buttonInstance.el));
                buttonInstance.el.dispatchEvent(createTouchEvent('touchend', {x: 0, y: 0}, buttonInstance.el));
                buttonInstance.el.dispatchEvent(new Event('longtapevent'));

                expect(called).toBe(true);
                component.dispose();
                done();
            });

        });
    });

    describe('hoverEffect', () => {
        describe('touchmove', () => {
            it('touchmove disabled', done => {
                let component = buildComponent(
                    'button',
                    Button,
                    {
                        data: {
                            disabled: true
                        }
                    }
                );
                attach2Document(component);

                const stub = sinon.stub(component, 'subTag').value('button');
                component.el.dispatchEvent(createTouchEvent('touchmove', {x: 0, y: 0}, component.el));
                const spy = sinon.spy(component, 'fire');
                expect(spy.callCount).toBe(0);

                stub.restore();
                spy.restore();
                component.dispose();
                done();
            });
        });

        describe('touchcancel', () => {
            it('touchcancel disabled', done => {
                let component = buildComponent(
                    'button',
                    Button,
                    {
                        data: {
                            disabled: true
                        }
                    }
                );
                attach2Document(component);

                const stub = sinon.stub(component, 'subTag').value('button');
                component.el.dispatchEvent(createTouchEvent('touchcancel', {x: 0, y: 0}, component.el));
                const spy = sinon.spy(component, 'fire');
                expect(spy.callCount).toBe(0);

                stub.restore();
                spy.restore();
                component.dispose();
                done();
            });
        });
    });

    describe('noNativeBehavior', () => {
        it('onContextmenu', done => {
            let component = buildComponent(
                'button',
                Button,
                {
                    data: {
                        disabled: true
                    }
                }
            );
            attach2Document(component);

            component.el.dispatchEvent(new Event('contextmenu'));
            const spy = sinon.spy(component, 'fire');
            expect(spy.callCount).toBe(0);

            spy.restore();
            component.dispose();
            done();
        });
    });

    describe('animateEffect', () => {
        it('animateEffect', done => {
            let component = buildComponent(
                'button',
                Button,
                {
                    data: {
                        disabled: true,
                        animation: {commandSetQueue: {}}
                    }
                }
            );
            attach2Document(component);
            const animation = createAnimation({
                duration: 1000,
                timingFunction: 'ease'
            });

            animation.step();
            component.data.set('animation', animation.export());
            let called = false;

            component.nextTick(() => {
                component.slaveRendered();

                component.communicator.onMessage('slaveRendered', () => {
                    called = true;
                });
                expect(called).toBe(false);

                component.dispose();
                done();
            });
        });

        it('animateEffect', done => {
            let component = buildComponent(
                'button',
                Button,
                {
                    data: {
                        disabled: false,
                        animation: {commandSetQueue: {}}
                    }
                }
            );
            attach2Document(component);
            const animation = createAnimation({
                duration: 100,
                timingFunction: 'ease'
            });

            animation.rotate(45).width(20).translate(30).step();
            animation
                .matrix(2)
                .matrix3d(2)
                .rotate(2)
                .rotate3d(2)
                .rotateX(2)
                .rotateY(2)
                .rotateZ(2)
                .scale(2)
                .scale3d(2)
                .scaleX(2)
                .scaleY(2)
                .scaleZ(2)
                .translate(2)
                .translate3d(2)
                .translateX(2)
                .translateY(2)
                .translateZ(2)
                .skew(2)
                .skewX(2)
                .skewY(2)
                .width(2)
                .height(2)
                .top(2)
                .right(2)
                .bottom(2)
                .left(2)
                .step();
            component.data.set('animation', animation.export());

            component.nextTick(() => {
                component.slaveRendered();

                const spy = sinon.spy(component, 'fire');
                expect(spy.callCount).toBe(0);

                spy.restore();
                component.dispose();
                done();
            });
        });
    });

    describe('nativeEventEffect', () => {
        it('bindNaBubblingEvent', done => {
            let component = buildComponent(
                'video',
                Video
            );
            const stub = sinon.stub(component, 'listeners').value(
                {
                    capturebindtouchstart: [
                        {
                            declaration: {expr: {args: [0, 0, 0, 0, {value: 'catch'}]}}
                        }
                    ]
                }
            );
            attach2Document(component);

            setTimeout(() => {
                component.getEventCatch('capturebindtouchstart', true);
                const spy = sinon.spy(component, 'fire');
                expect(spy.callCount).toBe(0);

                stub.restore();
                spy.restore();
                component.dispose();
                done();
            }, 2000);
        });
    });

    describe('nativeCover', () => {
        it('update fail', done => {
            let component = buildComponent(
                'cover-view',
                CoverView,
                {
                    data: {
                        unitTestParams: {
                            apiExecResult: 'updateFail'
                        }
                    }
                }
            );
            attach2Document(component);
            const spy = sinon.spy(component.boxjs.cover, 'update');

            component.nextTick(() => {
                component.communicator.fireMessage({
                    type: 'slaveUpdated'
                });

                expect(spy.callCount).toBe(0);
                spy.restore();
                component.dispose();
                done();
            });
        });

        it('style check', done => {
            const factory = getFactory();
            factory.componentDefine('cover-view-test', {
                template: `<view>
                    <cover-view s-ref="cover"
                        style="text-align: end; font-weight: 900;"
                    ></cover-view>
                </view>`,
            }, {
                classProperties: {
                    components: {
                        'cover-view': getComponentClass('cover-view', CoverView)
                    }
                }
            });
            const Component = factory.getComponents('cover-view-test');
            let component = new Component();
            attach2Document(component);

            const coverView = component.ref('cover');

            const spy = sinon.spy(component.boxjs.cover, 'update');

            component.nextTick(() => {
                component.communicator.fireMessage({
                    type: 'slaveUpdated'
                });

                expect(spy.callCount).toBe(0);
                spy.restore();
                component.dispose();
                done();
            });
        });
    });
});
