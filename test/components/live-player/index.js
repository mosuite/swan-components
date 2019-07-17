/**
 * @file live-player组件单测
 * @author v_wushuangzhao@baidu.com
 */

import sinon from 'sinon';
import livePlayer from '../../../src/live-player/index';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';

const COMPONENT_NAME = 'swan-live-player';

describe('component [' + COMPONENT_NAME + ']', () => {
    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, livePlayer);
        const $component = attach2Document(component);
        componentBaseFieldCheck(COMPONENT_NAME, component);
        it('should be rendered after attach', () => {
            const $swanLivePlayer = $component.querySelector('swan-live-player');
            expect($swanLivePlayer).not.toBe(null);
        });

        it('has a class name liveicon', () => {
            const $spanLiveicon = $component.querySelector('swan-live-player>span');
            expect($spanLiveicon.className.indexOf('liveicon')).not.toBe(-1);
        });

        it('should has one slot', () => {
            expect(component.slot.length).toBe(1);
        });

        describe('default props', () => {
            it('should has right default props', () => {
                const data = component.data;
                expect(data.get('autoplay')).toBe(false);
                expect(data.get('muted')).toBe(false);
                expect(data.get('objectFit')).toBe('contain');
                expect(data.get('backgroundMute')).toBe(false);
                expect(data.get('minCache')).toBe(1);
                expect(data.get('maxCache')).toBe(3);
            });
        });

        describe('liveplayer:fullscreenchange', () => {
            it('should set fullscreen if data equals "1"', done => {
                let component = buildComponent(COMPONENT_NAME, livePlayer);
                attach2Document(component);
                component.communicator.fireMessage({
                    type: `live_${component.data.get('id')}`,
                    params: {
                        action: 'fullscreenchange',
                        e: {
                            data: '{"fullscreen":"1", "width":"720", "height":"360", "videoId":"myde"}'
                        }
                    }
                });
                component.nextTick(() => {
                    expect(component.ref('slot').style.display).toBe('none');
                    expect(component.ref('full').style.display).toBe('block');
                    component.dispose();
                    done();
                });
            });
            it('should set fullscreen if data equals "0"', done => {
                let component = buildComponent(COMPONENT_NAME, livePlayer);
                attach2Document(component);
                component.communicator.fireMessage({
                    type: `live_${component.data.get('id')}`,
                    params: {
                        action: 'fullscreenchange',
                        e: {
                            data: '{"fullscreen":"0", "width":"720", "height":"360", "videoId":"myde"}'
                        }
                    }
                });
                component.nextTick(() => {
                    expect(component.ref('slot').style.display).toBe('block');
                    expect(component.ref('full').style.display).toBe('none');
                    component.dispose();
                    done();
                });
            });
        });
    });

    describe('updata props', () => {
        let component = null;
        let $component = null;
        beforeEach(() => {
            component = buildComponent(
                COMPONENT_NAME,
                livePlayer,
                {
                    data: {
                        src: 'http://xxx.mp4',
                        autoplay: true,
                        objectFit: 'fillCrop'
                    }
                }
            );
            $component = attach2Document(component);
        });
        afterEach(() => component.dispose());

        it('data check', done => {
            expect(component.data.get('autoplay')).toEqual(true);
            expect(component.data.get('objectFit')).toEqual('fillCrop');

            done();
        });

        it('should openLivePlayer while clicked', done => {
            component.nextTick(() => {
                const spy = sinon.spy(component.boxjs.media, 'live');
                $component.querySelector('span').click();
                expect(spy.calledOnce).toBe(true);

                spy.restore();
                done();
            });
        });

        it('should update native component while slaveUpdated', done => {
            const spy = sinon.spy(component.boxjs.media, 'live');
            component.el.style.top = '-1px';
            component.communicator.fireMessage({
                type: 'slaveUpdated'
            });
            component.nextTick(() => {
                expect(spy.calledOnceWith(sinon.match('type', 'update')));

                spy.restore();
                done();
            });
        });

        it('should call open when src change', done => {
            component.nextTick(() => {
                const spy = sinon.spy(component.boxjs.media, 'live');
                component.data.set('src', 'http://abc');
                // test中通过data.set改变字段不会自动触发 slaveRendered，需要手动触发
                component.communicator.fireMessage({
                    type: 'slaveUpdated'
                });
                component.nextTick(() => {
                    expect(spy.calledOnceWith(sinon.match.has('type', sinon.match('insert')))).toBe(true);

                    spy.restore();
                    done();
                });
            });
        });
    });

    describe('props: hidden', () => {
        const component = buildComponent(
            COMPONENT_NAME,
            livePlayer,
            {
                data: {
                    hidden: true
                }
            }
        );
        attach2Document(component);

        const spy = sinon.spy(component.boxjs.media, 'live');
        it('should not call open hidden', done => {

            component.nextTick(() => {
                expect(spy.callCount).toBe(0);

                spy.restore();
                component.dispose();
                done();
            });
        });
    });

    describe('video apiFail: openFail', () => {
        const component = buildComponent(
            COMPONENT_NAME,
            livePlayer,
            {
                data: {
                    unitTestParams: {
                        apiExecResult: 'openFail'
                    }
                }
            }
        );
        attach2Document(component);

        const spy = sinon.spy(component.boxjs.media, 'live');
        it('should catch', done => {
            component.data.set('direction', '-90');
            // test中通过data.set改变字段不会自动触发 slaveRendered，需要手动触发
            component.communicator.fireMessage({
                type: 'slaveUpdated'
            });
            component.nextTick(() => {
                expect(spy.calledWith(sinon.match.has('type', sinon.match('insert')))).toBe(true);

                spy.restore();
                component.dispose();
                done();
            });
        });
    });
});
