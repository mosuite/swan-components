
/**
 * @file cover-view组件单测
 * @author sunbaixin@baidu.com
 */

import sinon from 'sinon';
import CoverView from '../../../src/cover-view';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import Communicator from '../../mock/communicator';
import {tapEventCallbackFieldCheck} from '../../utils/event-callback-field-check';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';
const COMPONENT_NAME = 'cover-view';

/* eslint-disable max-nested-callbacks */
describe(`component [${COMPONENT_NAME}]`, () => {
    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, CoverView);
        const $component = attach2Document(component);
        componentBaseFieldCheck(COMPONENT_NAME, component);
        it('should be rendered after attach', () => {
            const $swanCoverView = $component.querySelector('swan-cover-view');
            expect($swanCoverView).not.toBe(null);
        });

    });

    describe('event and message and methods', () => {
        let component = null;
        beforeEach(() => {
            component = buildComponent(COMPONENT_NAME, CoverView);
            attach2Document(component);
        });
        afterEach(() => {
            component.dispose();
        });

        it('should execute correctly', () => {
            const spy1 = sinon.spy(component, 'insertNativeCoverView');
            const stub = sinon.stub(component, 'getParams').callsFake(function () {
                return {};
            });
            const spy2 = sinon.spy(component, 'updateNativeCoverView');
            const spy3 = sinon.spy(component, 'removeNativeCoverView');
            component.nextTick(() => {
                expect(spy1.called).toBe(true);
                spy1.restore();
                Communicator.getInstance().fireMessage({
                    type: 'fullscreenchange'
                });
                component.nextTick(() => {
                    expect(spy2.calledOnce).toBe(true);
                    spy2.restore();
                    component.isInserted = true;
                    component.detached();
                    component.slaveUpdated();
                    expect(spy3.called).toBe(true);
                    component.nextTick(() => {
                        expect(component.isInserted).toBe(false);
                        expect(component.args).toBe(null);
                        spy3.restore();
                        stub.restore();
                    });
                });
            });
        });
    });
    describe('tap event', () => {
        it('should handle tap event', done => {
            const factory = getFactory();
            factory.componentDefine('cover-view-test', {
                template: `<view>
                    <cover-view s-ref="cover" on-bindtap="test('bindtap', $event, '', '', '')"></cover-view>
                </view>`,
                test(e, $event) {
                    tapEventCallbackFieldCheck(expect, done, $event);
                    done();
                }
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
            coverView.communicator.fireMessage({
                type: `coverView_${coverView.data.get('id')}`,
                params: {
                    action: 'touchstart',
                    e: {
                        touches: [{
                            x: 176,
                            y: 577,
                            clientX: 176,
                            clientY: 577,
                            pageX: 176,
                            pageY: 577,
                            identifier: 0
                        }],
                        changedTouches: [{
                            x: 176,
                            y: 577,
                            clientX: 176,
                            clientY: 577,
                            pageX: 176,
                            pageY: 577,
                            identifier: 0
                        }]
                    }
                }
            });
            coverView.communicator.fireMessage({
                type: `coverView_${coverView.data.get('id')}`,
                params: {
                    action: 'tap',
                    e: {
                        touches: [{
                            x: 176,
                            y: 577,
                            clientX: 176,
                            clientY: 577,
                            pageX: 176,
                            pageY: 577,
                            identifier: 0
                        }],
                        changedTouches: [{
                            x: 176,
                            y: 577,
                            clientX: 176,
                            clientY: 577,
                            pageX: 176,
                            pageY: 577,
                            identifier: 0
                        }]
                    }
                }
            });

        });
    });
});
describe('coverView Fail: insertFail', () => {
    const component = buildComponent(
        COMPONENT_NAME,
        CoverView,
        {
            data: {
                unitTestParams: {
                    apiExecResult: 'insertFail'
                }
            }

        }
    );
    attach2Document(component);
    const spy = sinon.spy(component.boxjs.cover, 'insert');
    it('should catch', done => {
        setTimeout(() => {
            expect(component.isInserted).toBe(false);
            spy.restore();
            component.dispose();
            done();
        }, 500);
    });
});
describe('coverView Fail: updateFail', () => {
    const component = buildComponent(
        COMPONENT_NAME,
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
    it('should catch', done => {
        setTimeout(() => {
            expect(component.isInserted).toBe(true);
            spy.restore();
            component.dispose();
            done();
        }, 500);
    });
});
describe('coverView Fail: removeFail', () => {
    const component = buildComponent(
        COMPONENT_NAME,
        CoverView,
        {
            data: {
                unitTestParams: {
                    apiExecResult: 'removeFail'
                }
            }
        }
    );
    attach2Document(component);
    const spy = sinon.spy(component.boxjs.cover, 'remove');
    it('should catch', done => {
        setTimeout(() => {
            expect(component.isInserted).toBe(true);
            spy.restore();
            component.dispose();
            done();
        }, 500);
    });
});