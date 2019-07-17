/**
 * @file video组件单测
 * @author yanghuabei@baidu.com
 */

import sinon from 'sinon';
import Video from '../../../src/video';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';

const COMPONENT_NAME = 'video';

/* eslint-disable max-nested-callbacks */
describe(`component [${COMPONENT_NAME}]`, () => {
    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, Video);
        const $component = attach2Document(component);
        componentBaseFieldCheck(COMPONENT_NAME, component);
        it('should be rendered after attach', () => {
            const $swanVideo = $component.querySelector('swan-video');
            expect($swanVideo).not.toBe(null);
        });

        it('should has one slot', () => {
            expect(component.slot.length).toBe(1);
        });

        describe('default props', () => {
            it('should has right default props', () => {
                const data = component.data;
                expect(data.get('controls')).toBe(true);
                expect(data.get('autoplay')).toBe(false);
                expect(data.get('loop')).toBe(false);
                expect(data.get('muted')).toBe(false);
                expect(data.get('objectFit')).toBe('contain');
            });
        });

        describe('video events:fullscreenchange', () => {
            it('should set fullscreen if data equals "1"', () => {

                component.communicator.fireMessage({
                    type: `video_${component.data.get('id')}`,
                    params: {
                        action: 'fullscreenchange',
                        e: {
                            data: '{"fullscreen":"1", "width":"720", "height":"360", "videoId":"myde"}'
                        }
                    }
                });

                component.nextTick(() => {
                    component.data.get('isFullScreen', true);
                });
            });

            it('should set half screen if data not equals "1"', () => {

                component.communicator.fireMessage({
                    type: `video_${component.data.get('id')}`,
                    params: {
                        action: 'fullscreenchange',
                        e: {
                            data: '{"fullscreen":"0", "width":"720", "height":"360", "videoId":"myde"}'
                        }
                    }
                });

                component.nextTick(() => {
                    component.data.get('isFullScreen', false);
                });
            });

            it('should be compatible with lower mobile model', () => {
                component.communicator.fireMessage({
                    type: `video_${component.data.get('id')}`,
                    params: {
                        action: 'fullscreenchange',
                        e: {
                            data: '{"fullscreen":"0", "videoId":"myde"}'
                        }
                    }
                });

                component.nextTick(() => {
                    component.data.get('isFullScreen', false);
                });
            });

            it('should be compatible with lower mobile model', () => {
                component.communicator.fireMessage({
                    type: `video_${component.data.get('id')}`,
                    params: {
                        action: 'fullscreenchange',
                        e: {
                            data: '{"fullscreen":"1", "videoId":"myde"}'
                        }
                    }
                });

                component.nextTick(() => {
                    component.data.get('isFullScreen', true);
                });
            });
        });

        // android 全屏兼容：全屏切半屏可能需要多次发update
        describe('video events:fullscreenchange', () => {
            const component = buildComponent(
                COMPONENT_NAME,
                Video,
                {
                    data: {
                        unitTestParams: {
                            isAndroid: true
                        }
                    }
                }
            );
            attach2Document(component);
            it('should compabible with android', done => {
                // 全屏
                component.communicator.fireMessage({
                    type: `video_${component.data.get('id')}`,
                    params: {
                        action: 'fullscreenchange',
                        e: {
                            data: '{"fullscreen":"1", "width":"720", "height":"360", "videoId":"myde"}'
                        }
                    }
                });
                component.el.style.width = '50px';
                // test中通过data.set改变字段不会自动触发 slaveRendered，需要手动触发
                component.communicator.fireMessage({
                    type: 'slaveUpdated'
                });

                const spy = sinon.spy(component.boxjs.media, 'video');
                // 全屏 -> 半屏
                component.communicator.fireMessage({
                    type: `video_${component.data.get('id')}`,
                    params: {
                        action: 'fullscreenchange',
                        e: {
                            data: '{"fullscreen":"0", "width":"720", "height":"360", "videoId":"myde"}'
                        }
                    }
                });
                component.nextTick(() => {
                    expect(spy.calledWith(sinon.match.has('type', sinon.match('update')))).toBe(true);

                    setTimeout(() => {
                        spy.restore();
                        component.dispose();
                        done();
                    }, 100);
                });
            });
        });

        // 弹幕功能
        describe('video events:danmu', () => {
            const component = buildComponent(
                COMPONENT_NAME,
                Video
            );
            attach2Document(component);
            it('should trigger binddanmu events', done => {
                const spy = sinon.spy(component, 'dispatchEvent');
                component.communicator.fireMessage({
                    type: `video_${component.data.get('id')}`,
                    params: {
                        action: 'danmu',
                        e: {
                            data: '{"ext":"danmu", "videoId":"myde"}'
                        }
                    }
                });
                component.nextTick(() => {
                    expect(spy.calledOnceWith(component, 'binddanmu'));
                    spy.restore();
                    component.dispose();
                    done();
                });
            });
        });

        // hidden="true"不发送端能力
        describe('video:hidden', () => {
            const component = buildComponent(
                COMPONENT_NAME,
                Video,
                {
                    data: {
                        hidden: true
                    }
                }
            );
            attach2Document(component);
            it('should not create video', done => {
                const spy = sinon.spy(component.boxjs.media, 'video');
                component.nextTick(() => {
                    expect(spy.calledOnceWith(sinon.match.has('type', sinon.match('insert')))).toBe(false);
                    spy.restore();
                    component.dispose();
                    done();
                });
            });
        });

        // 视频起播时间initialTime验证
        describe('video:initialTime', () => {
            const component = buildComponent(
                COMPONENT_NAME,
                Video
            );
            attach2Document(component);
            const spy = sinon.spy(component.boxjs.media, 'video');

            component.communicator.fireMessage({
                type: `video_${component.data.get('id')}`,
                params: {
                    action: 'timeupdate',
                    e: {
                        data: '{"currentTime": "10", "duration": "20", "videoId":"myde"}'
                    }
                }
            });
            it('should send correct initialTime', done => {
                component.nextTick(() => {
                    expect(spy.calledWith(
                        sinon.match
                            .has('data', sinon.match.has('initialTime', sinon.match('10')))
                    )).toBe(true);
                    spy.restore();
                    component.dispose();
                    done();
                });
            });
        });
    });

    // show-progress属性验证：若不设置，宽度大于240时才会显示
    describe('video attribute:showProgress', () => {
        const component = buildComponent(
            COMPONENT_NAME,
            Video,
            {
                data: {
                    showProgress: false
                }
            }
        );
        const spy = sinon.spy(component.boxjs.media, 'video');
        attach2Document(component);
        it('should send params with showProgress: false', done => {
            component.nextTick(() => {
                expect(spy.calledWith(
                    sinon.match.has('data', sinon.match.has('showProgress', false))
                )).toBe(true);
                spy.restore();
                component.dispose();
                done();
            });
        });
    });

    describe('video apiFail: openFail', () => {
        const component = buildComponent(
            COMPONENT_NAME,
            Video,
            {
                data: {
                    unitTestParams: {
                        apiExecResult: 'openFail'
                    }
                }
            }
        );
        attach2Document(component);

        const spy = sinon.spy(component.boxjs.media, 'video');
        it('should catch', done => {
            component.nextTick(() => {
                expect(spy.calledWith(sinon.match.has('type', sinon.match('insert')))).toBe(true);
                expect(component.isInserted).toBe(false);

                spy.restore();
                component.dispose();
                done();
            });
        });
    });

    describe('video apiFail: updateFail', () => {
        const component = buildComponent(
            COMPONENT_NAME,
            Video,
            {
                data: {
                    unitTestParams: {
                        apiExecResult: 'updateFail'
                    }
                }
            }
        );
        attach2Document(component);

        it('should catch', done => {
            const spy = sinon.spy(component.boxjs.media, 'video');
            component.data.set('showPlayBtn', false);
            // test中通过data.set改变字段不会自动触发 slaveRendered，需要手动触发
            component.communicator.fireMessage({
                type: 'slaveUpdated'
            });
            component.nextTick(() => {
                expect(spy.calledWith(sinon.match.has('type', sinon.match('update')))).toBe(true);

                spy.restore();
                component.dispose();
                done();
            });
        });
    });

    describe('props watch', () => {
        let component = null;
        beforeEach(() => {
            component = buildComponent(
                COMPONENT_NAME,
                Video,
                {
                    data: {
                        src: 'http://src'
                    }
                }
            );
            attach2Document(component);
        });
        afterEach(() => component.dispose());

        it('should call open when src change', done => {
            // 模拟触发attach
            component.communicator.fireMessage({
                type: 'slaveUpdated'
            });
            component.nextTick(() => {
                const spy = sinon.spy(component.boxjs.media, 'video');
                component.data.set('src', 'http');
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

        it('should not call update when no attribute changed', done => {
            // 模拟触发attach
            component.communicator.fireMessage({
                type: 'slaveUpdated'
            });
            component.nextTick(() => {
                const spy = sinon.spy(component.boxjs.media, 'video');
                component.communicator.fireMessage({
                    type: 'slaveUpdated'
                });
                component.nextTick(() => {
                    expect(spy.callCount).toBe(0);

                    spy.restore();
                    done();
                });
            });
        });

        it('should call update when other attribute changed', done => {
            // 模拟触发attach
            component.communicator.fireMessage({
                type: 'slaveUpdated'
            });
            component.nextTick(() => {
                const spy = sinon.spy(component.boxjs.media, 'video');
                component.data.set('hidden', !component.data.get('hidden'));
                // test中通过data.set改变字段不会自动触发 slaveUpdated，需要手动触发
                component.communicator.fireMessage({
                    type: 'slaveUpdated'
                });
                component.nextTick(() => {
                    expect(spy.calledOnceWith(sinon.match.has('type', sinon.match('update')))).toBe(true);

                    spy.restore();
                    done();
                });
            });
        });

    });
});
