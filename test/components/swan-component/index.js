/**
 * @file swan-component组件单测
 * @author yanghuabei@baidu.com
 */

import sinon from 'sinon';
import swanComponentProto from '../../../src/swan-component';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';
import {boxjsDataGetMock} from '../../mock/swan-api/mock-data';
import attach2Document from '../../utils/attach-to-document';
import Communicator from '../../mock/communicator';
import view from '../../../src/view';
import CoverView from '../../../src/cover-view';
import Canvas from '../../../src/canvas';
import Camera from '../../../src/camera';
import ARCamera from '../../../src/ar-camera';
import buildComponent from '../../mock/swan-core/build-component';
import superCustomComponent from '../../../src/super-custom-component';

const COMPONENT_NAME = 'swan-component';

/**
 * 创建单测用例
 *
 * @param {Function} callback 回调函数
 */
export const getTestCase = callback => {
    const factory = getFactory();
    const componentView = getComponentClass(COMPONENT_NAME, view);
    const componentSwanComponent = getComponentClass(COMPONENT_NAME, swanComponentProto);
    const properties = {
        classProperties: {
            components: {
                'view': componentView,
                'swan-component': componentSwanComponent
            }
        }
    };
    factory.componentDefine(
        'testComponent', {
            template: `
                <view s-ref="myView">
                    <swan-component s-ref="mySwanComponent"></swan-component>
                </view>`
        },
        properties
    );
    const TestView = factory.getComponents('testComponent');
    const testComponent = new TestView();
    testComponent.attach(document.body);
    // testComponent.nextTick(() => {
        console.log('testComponent ---- =:', testComponent.el, testComponent.ref);
        // console.log('ccccc:', {
        //     view: testComponent.ref('view'),
        //     swanComponent: testComponent.ref('swan-component')
        // });
        // callback({
        //     view: testComponent.ref('view'),
        //     swanComponent: testComponent.ref('swan-component')
        // });
        // console.log('myView:', testComponent.ref('myView'));
        // console.log("testComponent.ref('swan-component'):", testComponent.ref('swan-component'));
        callback({
            a: 1
        });
        testComponent.dispose();
    // });
};

/* eslint-disable max-nested-callbacks */
describe(`base component [${COMPONENT_NAME}]`, () => {

    it('should be an Object', () => {
        const actual = typeof swanComponentProto;
        const expected = 'object';
        expect(actual).toBe(expected);
    });

    describe('swan component proto public methods exist check', () => {
        const functions = [
            'constructor', 'bindAction', 'onTouchEnd',
            'onTouchcancel', 'onTouchStart', 'onTouchMove',
            'onContextmenu', 'slaveUpdated', 'slaveRendered',
            'getFirstParentComponentId'
        ];
        functions.forEach(name => {
            it(`should has a ${name} function`, () => {
                const actual = typeof swanComponentProto[name];
                const expected = 'function';
                expect(actual).toBe(expected);
            });
        });
    });

    describe('swan component instance check', () => {
        const SwanComponent = getComponentClass('test-component', {template: '<swan-component></swan-component>'});
        let component = null;

        beforeAll(() => {
            component = new SwanComponent();
            attach2Document(component);
        });

        afterAll(() => {
            component.dispose();
        });

        it('should has instance property slaveId', () => {
            const actual = component.slaveId;
            const expected = boxjsDataGetMock['swan-slaveIdSync']['res'].slaveId;
            expect(actual).toBe(expected);
        });

        it('should has instance function property absolutePathResolve', () => {
            const actual = typeof component.absolutePathResolve;
            const expected = 'function';
            expect(actual).toBe(expected);
        });

        it('should has an not null instance property uid', () => {
            const actual = component.uid;
            expect(actual).toBeDefined();
        });

        it('should has a ref named sanComponent to self on el', () => {
            const actual = component.el.sanComponent;
            const expected = component;
            expect(actual).toBe(expected);
        });

        it('should has not hidden attibute on el', () => {
            const actual = component.el.hidden;
            const expected = false;
            expect(actual).toBe(expected);
        });

        describe('bindAction method', () => {
            it('should call on method with right args when called', () => {
                const on = sinon.spy(component, 'on');
                const callback = new Function();
                component.bindAction('test', callback);
                const actual = on.calledWith('test', callback);
                const expected = true;
                expect(actual).toBe(expected);
                on.restore();
            });
        });

        describe('getFirstParentComponentId method', () => {
            it('should return empty string on baidu app version less than 10.8.5', () => {
                const versionCompare = sinon.stub(component.boxjs.platform, 'versionCompare');
                versionCompare.returns(-1);
                const actual = component.getFirstParentComponentId(component);
                const expected = '';
                expect(actual).toBe(expected);
                versionCompare.restore();
            });


            it('should return empty string when self is topest element', () => {
                const actual = component.getFirstParentComponentId(component);
                const expected = '';
                expect(actual).toBe(expected);
            });
        });

        describe('data watch', () => {
            let component = null;

            beforeEach(() => {
                component = new SwanComponent();
                attach2Document(component);
            });

            afterEach(() => {
                component.dispose();
            });

            it('should watch hidden data change and update el attribute', done => {
                component.data.set('hidden', true);
                component.nextTick(() => {
                    const actual = component.el.hidden;
                    const expected = true;
                    expect(actual).toBe(expected);
                    done();
                });
            });
        });

        describe('life circle event bind', () => {
            let component = null;
            beforeEach(() => {
                component = new SwanComponent();
                attach2Document(component);
            });

            it('should listen slaveUpdated event and call slaveUpdated hook properly', () => {
                const slaveUpdated = sinon.stub(component, 'slaveUpdated');
                expect(slaveUpdated.notCalled).toBe(true);
                Communicator.getInstance().fireMessage({type: 'slaveUpdated'});
                expect(slaveUpdated.calledOnce).toBe(true);

                component.dispose();
                Communicator.getInstance().fireMessage({type: 'slaveUpdated'});
                expect(slaveUpdated.calledOnce).toBe(true);
                slaveUpdated.restore();
            });

            it('should listen slaveRendered event and call slaveRendered hook properly', () => {
                const slaveRendered = sinon.stub(component, 'slaveRendered');
                expect(slaveRendered.notCalled).toBe(true);
                Communicator.getInstance().fireMessage({type: 'slaveRendered'});
                expect(slaveRendered.calledOnce).toBe(true);

                component.dispose();
                Communicator.getInstance().fireMessage({type: 'slaveRendered'});
                expect(slaveRendered.calledOnce).toBe(true);
                slaveRendered.restore();
            });
        });

        describe('customComponent inner swan-component', () => {
            const viewComponent = buildComponent('swan-view', view);
            attach2Document(viewComponent);
            const factory = getFactory();

            // 自定义组件custom1
            factory.componentDefine('custom1', Object.assign({}, superCustomComponent, {
                template: '<swan-custom1><view class="my-class1">inner view1</view></swan-custom1>',
                componentPath: 'custom1',
                componentName: 'custom1',
                customComponentCss: ''
            }), {
                classProperties: {
                    components: Object.assign({}, factory.getAllComponents())
                }
            });
            const CustomComponent1 = factory.getComponents('custom1');

            // 自定义组件custom
            factory.componentDefine('custom', Object.assign({}, superCustomComponent, {
                template: '<swan-custom><view class="my-class other-class">inner view</view><custom1 my-class1="extra-class1"></custom1></swan-custom>',
                componentPath: 'custom',
                componentName: 'custom',
                customComponentCss: ''
            }), {
                classProperties: {
                    components: Object.assign({}, factory.getAllComponents(), {custom1: CustomComponent1})
                }
            });
            const CustomComponent = factory.getComponents('custom');

            factory.componentDefine('test', {
                template: '<view><custom s-ref="cus" my-class="extra-class"></custom></view>'
            }, {
                classProperties: {
                    components: {
                        custom: CustomComponent
                    }
                }
            });
            const TestView = factory.getComponents('test');
            const testView = new TestView();
            attach2Document(testView);
            const cus = testView.ref('cus');
            const cusUid = cus.uid;

            it('should swan-component receive addExternalClasses message', () => {
                const viewTest = cus.children[0];
                viewTest.communicator.fireMessage({
                    type: 'convertCustomComponentClass',
                    nodeId: cusUid,
                    extraMessage: {
                        eventType: 'addExternalClasses',
                        value: {
                            externalClasses: ['my-class'],
                            availableClasses: ['extra-class'],
                            classes: {
                                'my-class': 'extra-class'
                            }
                        }
                    }
                });
                viewTest.nextTick(() => {
                    const actual = viewTest.data.get('class');
                    const expectedPerfix = !!~actual.indexOf('custom__other-class');
                    const expectedExternalClass = !!~actual.indexOf('extra-class');
                    expect(expectedPerfix).toBe(true);
                    expect(expectedExternalClass).toBe(true);
                });
            });

            it('should return parentComponent getFirstParentComponentId when parent is other component', () => {
                testView.nextTick(() => {
                    const actual = cus.getFirstParentComponentId();
                    const expected = '';
                    expect(actual).toBe(expected);
                });
            });

            it('should swan-component inner customComponent\'s swan-component receive addExternalClasses message', () => {
                const cus1 = cus.children[1];
                const viewTest1 = cus1.children[0];
                viewTest1.communicator.fireMessage({
                    type: 'convertCustomComponentClass',
                    nodeId: cus1.uid,
                    extraMessage: {
                        eventType: 'addExternalClasses',
                        value: {
                            externalClasses: ['my-class1'],
                            availableClasses: ['extra-class1'],
                            classes: {
                                'my-class1': 'extra-class1'
                            }
                        }
                    }
                });
                viewTest1.nextTick(() => {
                    const actual = viewTest1.data.get('class');
                    const expected = 'custom__extra-class1';
                    expect(actual).toBe(expected);
                });
            });

            it('should swan-component receive addGlobalClass message', () => {
                const viewTest = cus.children[0];
                viewTest.communicator.fireMessage({
                    type: 'convertCustomComponentClass',
                    nodeId: cusUid,
                    extraMessage: {
                        eventType: 'addGlobalClass'
                    }
                });
                expect(viewTest.addGlobalClassStatus).toBe(true);
            });

            it('should get the right parentId', () => {
                const componentCanvas = getComponentClass('canvas', Canvas);
                const componentCoverView = getComponentClass('cover-view', CoverView);
                const componentARCamera = getComponentClass('ar-camera', ARCamera);
                const componentCamera = getComponentClass('camera', Camera);
                factory.componentDefine('custom', {
                    template: `<view>
                            <canvas canvas-id="myVideo">
                                <cover-view style="width: 100rpx;">123</cover-view>
                            </canvas>
                            <camera>
                                <cover-view style="width: 100rpx;">123</cover-view>
                            </camera>
                            <ar-camera>
                                <cover-view style="width: 100rpx;">123</cover-view>
                            </ar-camera>
                            <cover-view fixed="true">
                                <cover-view style="width: 100rpx;">123</cover-view>
                            </cover-view>
                        </view>`
                }, {
                    classProperties: {
                        components: {
                            'canvas': componentCanvas,
                            'ar-camera': componentARCamera,
                            'camera': componentCamera,
                            'cover-view': componentCoverView,
                            'custom1': CustomComponent1
                        }
                    }
                });
                const CustomComponent = factory.getComponents('custom');
                const testComponent = new CustomComponent();
                testComponent.attach(document.body);
            });
        });
    });
});
