/**
 * @file navigator组件单测
 * @author v_wushuangzhao@baidu.com
 */

import navigator from '../../../src/navigator/index';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import sinon from 'sinon';

const COMPONENT_NAME = 'navigator';

describe('component[' + COMPONENT_NAME + ']', () => {
    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, navigator, {});
        const $component = attach2Document(component);
        componentBaseFieldCheck(COMPONENT_NAME, component);

        it('should be rendered after attach', () => {
            const $swanNav = $component.querySelector('swan-nav');
            expect($swanNav).not.toBe(null);
        });

        it('should have zero slot', () => {
            expect($component.slot.length).toBe(0);
        });
        describe('default props', () => {
            it('should have four default props', () => {
                const data = component.data;
                expect(data.get('openType')).toEqual('navigate');
                expect(data.get('hoverStopPropagation')).toBe(false);
                expect(data.get('hoverStartTime')).toEqual(50);
                expect(data.get('hoverStayTime')).toEqual(600);
            });
        });
    });
    describe('compiled', () => {
        let component = null;
        let $swanNav = null;
        beforeEach(() => {
            component = buildComponent(COMPONENT_NAME, navigator);
        });
        afterEach(() => component.dispose());
        describe('should to do something when compiled', () => {
            it('should listen bindtap and dispatch when compiled', (done) => {
                const spy = sinon.spy(component, 'dispatch');
                $swanNav = attach2Document(component).querySelector('swan-nav');
                component.data.set('openType', 'redirect');
                component.data.set('url', '/pages/index/index');
                component.data.set('delta', 0);
                component.fire('bindtap', {});
                component.nextTick(() => {
                    expect(
                        spy.calledOnceWith(
                            'abilityMessage',
                            sinon.match
                                .has('eventType', 'navigate')
                                .and(sinon.match.has('eventParams', {
                                    uri: component.data.get('url'),
                                    openType: component.data.get('openType'),
                                    delta: component.data.get('delta'),
                                    domId: component.uid
                                }))
                        )
                    ).toBe(true);
                    spy.restore();
                    done();
                });
            });
        });
    });
    describe('navigate fail: launchfail', () => {
        it('should catch', done => {
            const component = buildComponent(
                COMPONENT_NAME,
                navigator,
                {
                    data: {
                        target: 'miniProgram',
                        openType: 'navigate',
                        version: 'develop',
                        unitTestParams: {
                            apiExecResult: 'launchFail'
                        }
                    }
                }
            );
            attach2Document(component);
            const spy = sinon.spy(component.boxjs.webView, 'launch');
            component.nextTick(() => {
                component.fire('bindtap', {});
                expect(spy.calledOnce).toBe(true);
                spy.restore();
                done();
            });
        });
    });
    describe('compiled in miniProgram', () => {
        let component = null;
        let $swanNav = null;
        beforeEach(() => {
            component = buildComponent(COMPONENT_NAME, navigator, {
                data: {
                    target: 'miniProgram'
                }
            });
        });
        afterEach(() => component.dispose());
        describe('should to do something when compiled in miniProgram', () => {
            it('should exit in miniProgram when openType is exit', done => {
                component.data.set('openType', 'exit');
                let spy = sinon.spy(component.boxjs.webView, 'exit');
                component.nextTick(() => {
                    component.fire('bindtap', {});
                    expect(spy.calledOnce).toBe(true);
                    spy.restore();
                    done();
                });
            });
            it('should launch in miniProgram when version is develop', done => {
                component.data.set('openType', 'navigate');
                component.data.set('version', 'develop');
                let spy = sinon.spy(component.boxjs.webView, 'launch');
                component.nextTick(() => {
                    component.fire('bindtap', {});
                    expect(spy.calledOnce).toBe(true);
                    spy.restore();
                    done();
                });
            });
            it('should launch in miniProgram when version is trial', done => {
                component.data.set('openType', 'navigate');
                component.data.set('version', 'trial');
                let spy = sinon.spy(component.boxjs.webView, 'launch');
                component.nextTick(() => {
                    component.fire('bindtap', {});
                    expect(spy.calledOnce).toBe(true);
                    spy.restore();
                    done();
                });
            });
        });
    });

});
