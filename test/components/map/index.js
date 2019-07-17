/**
 * @file map组件单测
 * @author v_wushuangzhao@baidu.com
 */

import sinon from 'sinon';
import Map from '../../../src/map/index';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import animationView from '../../../src/animation-view';
import Video from '../../../src/video';

const COMPONENT_NAME = 'map';

describe('component [' + COMPONENT_NAME + ']', () => {
    describe('base feature', () => {
        !window.pageInfo && (window.pageInfo = {});
        window.pageInfo.appPath = '';
        const component = buildComponent(
            COMPONENT_NAME,
            Map,
            {
                data: {
                    markers: [{
                        iconPath: '/image/a.png',
                        callout: {
                            bgColor: '#f00',
                            content: 'hello',
                            color: '00f',
                            display: 'ALWAYS',
                            textAlign: 'center',
                            borderRadius: '50',
                            borderWidth: '20'
                        },
                        id: 0,
                        latitude: 23.099994,
                        longitude: 113.324520,
                        width: 50,
                        height: 50
                    }]
                }
            }
        );
        const spy = sinon.spy(component, 'openMap');
        const $component = attach2Document(component);

        it('openMap will be executed while attached', done => {
            component.nextTick(() => {
                expect(spy.calledOnce).toBe(true);
                spy.restore();
                done();
            });
        });
        componentBaseFieldCheck(COMPONENT_NAME, component);

        it('should be rendered after attach', () => {
            const $swanMap = $component.querySelector('swan-map');
            expect($swanMap).not.toBe(null);
        });

        it('should has one slot', () => {
            expect($component.slot.length).toBe(0);
        });

        describe('default props', () => {

            it('should has one default props', () => {
                const data = component.data;
                expect(data.get('scale')).toBe(16);
            });
        });

        it('should call updateMap when slaveUpdated', done => {
            const spy = sinon.spy(component.boxjs.map, 'update');
            component.data.set('longitude', 114);
            component.communicator.fireMessage({
                type: 'slaveUpdated'
            });
            component.nextTick(() => {
                expect(spy.calledOnce).toBe(true);
                spy.restore();
                done();

            });

        });

        it('should call updateMap when slaveUpdated', done => {
            const spy = sinon.spy(component.boxjs.map, 'update');
            component.data.set('longitude', 114);
            component.data.set('scale', 114);
            component.communicator.fireMessage({
                type: 'slaveUpdated'
            });
            component.nextTick(() => {
                expect(spy.calledOnce).toBe(false);
                spy.restore();
                done();

            });
        });
        it('scale call check updateMap when slaveUpdated', done => {
            const spy = sinon.spy(component.boxjs.map, 'update');
            component.data.set('longitude', 114);
            component.args.scale = 0;
            component.communicator.fireMessage({
                type: 'slaveUpdated'
            });
            component.nextTick(() => {
                expect(spy.calledOnce).toBe(true);
                spy.restore();
                done();

            });
        });

        const component2 = buildComponent(
            COMPONENT_NAME,
            Map,
            {
                data: {
                    controls: [{
                        iconPath: '/image/a.png',
                        callout: {
                            bgColor: '#f00',
                            content: 'hello',
                            color: '00f',
                            display: 'ALWAYS',
                            textAlign: 'center',
                            borderRadius: '50',
                            borderWidth: '20'
                        },
                        id: 0,
                        latitude: 23.099994,
                        longitude: 113.324520,
                        width: 50,
                        height: 50
                    }]
                }
            }
        );
        attach2Document(component2);
        it('should removeMap while detached', () => {
            const spy = sinon.spy(component2, 'removeMap');
            component2.dispose();
            expect(spy.calledOnce).toBe(true);
        });

        it('should handle control tap', done => {
            const component = buildComponent(COMPONENT_NAME, Map);
            attach2Document(component);
            component.nextTick(() => {
                component.on('bindcontroltap', e => {
                    expect(e.controlId).toBe(123);
                    done();
                    component.dispose();
                });
                component.communicator.fireMessage({
                    type: `map_${component.data.get('id')}`,
                    params: {
                        action: 'controltap',
                        e: {
                            data: JSON.stringify({
                                controlId: 123
                            })
                        }
                    }
                });
            });
        });
        it('should handle poitap tap', done => {
            const component = buildComponent(COMPONENT_NAME, Map);
            attach2Document(component);
            component.nextTick(() => {
                component.on('bindpoitap', e => {
                    expect(e).not.toBe(123);
                    done();
                    component.dispose();
                });
                component.communicator.fireMessage({
                    type: `map_${component.data.get('id')}`,
                    params: {
                        action: 'poitap',
                        e: {
                            data: JSON.stringify({
                                controlId: 123
                            })
                        }
                    }
                });
            });
        });
        it('should handle marker tap', done => {
            const component = buildComponent(COMPONENT_NAME, Map);
            attach2Document(component);
            component.nextTick(() => {
                component.on('bindmarkertap', e => {
                    expect(e.markerId).toBe(456);
                    done();
                    component.dispose();
                });
                component.communicator.fireMessage({
                    type: `map_${component.data.get('id')}`,
                    params: {
                        action: 'markertap',
                        e: {
                            data: JSON.stringify({
                                markerId: 456
                            })
                        }
                    }
                });
            });
        });
    });

    describe('map apiFail: openFail', () => {
        const component = buildComponent(
            COMPONENT_NAME,
            Map,
            {
                data: {
                    unitTestParams: {
                        apiExecResult: 'insertFail'
                    }
                }
            }
        );
        attach2Document(component);

        const spy = sinon.spy(component.boxjs.map, 'insert');
        it('should catch', done => {
            component.nextTick(() => {
                expect(spy.calledOnce).toBe(true);

                spy.restore();
                component.dispose();
                done();
            });
        });
    });
    describe('map apiFail: updateFail', () => {
        const component = buildComponent(
            COMPONENT_NAME,
            Map,
            {
                data: {
                    unitTestParams: {
                        apiExecResult: ['updateFail', 'removeFail']
                    }
                }
            }
        );
        attach2Document(component);

        it('updateFail should catch', done => {
            const spy = sinon.spy(component.boxjs.map, 'update');
            component.data.set('scale', 20);
            // test中通过data.set改变字段不会自动触发 slaveRendered，需要手动触发
            component.communicator.fireMessage({
                type: 'slaveUpdated'
            });
            component.dispose();

            component.nextTick(() => {
                expect(spy.calledOnce).toBe(true);

                spy.restore();
                done();
            });
        });
    });

});
