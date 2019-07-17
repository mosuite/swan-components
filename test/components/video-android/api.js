/**
 * @file Video api test spec
 * @author wuhuiyao@baidu.com
 */

import sinon from 'sinon';
import {createVideoInstance, fakeTouchEvent} from './util';

describe('同层渲染安卓 Video api', () => {
    it('should call play api', () => {
        const component = createVideoInstance();
        const spyPlay = sinon.spy(component, 'play');

        component.communicator.fireMessage({
            type: `video-${component.data.get('id')}`,
            value: {
                api: 'play'
            }
        });
        expect(spyPlay.calledOnce).toBe(true);

        component.dispose();
    });

    it('should call pause api', () => {
        const component = createVideoInstance();
        const spyPause = sinon.spy(component, 'pause');

        component.communicator.fireMessage({
            type: `video-${component.data.get('id')}`,
            value: {
                api: 'pause'
            }
        });
        expect(spyPause.calledOnce).toBe(true);

        component.dispose();
    });

    it('should call seek api', () => {
        const component = createVideoInstance();
        const spySeek = sinon.spy(component, 'seek');

        component.communicator.fireMessage({
            type: `video-${component.data.get('id')}`,
            value: {
                api: 'seek',
                params: {
                    position: 20
                }
            }
        });
        expect(spySeek.calledOnceWith(20)).toBe(true);

        component.dispose();
    });

    it('should call sendDanmu api', () => {
        const component = createVideoInstance();
        const spySendDanmu = sinon.spy(component, 'sendDanmu');

        const apiArgs = {
            text: 'a',
            color: '#ccc'
        };
        component.communicator.fireMessage({
            type: `video-${component.data.get('id')}`,
            value: {
                api: 'sendDanmu',
                params: apiArgs
            }
        });
        expect(spySendDanmu.calledOnceWith(apiArgs)).toBe(true);

        component.dispose();
    });

    it('should call requestFullScreen api', () => {
        const component = createVideoInstance();
        const spyRequestFullScreen = sinon.spy(component, 'toggleFullscreen');

        component.communicator.fireMessage({
            type: `video-${component.data.get('id')}`,
            value: {
                api: 'requestFullScreen'
            }
        });
        expect(spyRequestFullScreen.calledOnceWith(true)).toBe(true);

        component.dispose();
    });

    it('should call exitFullScreen api', () => {
        const component = createVideoInstance();
        const spyExitFullScreen = sinon.spy(component, 'toggleFullscreen');

        component.communicator.fireMessage({
            type: `video-${component.data.get('id')}`,
            value: {
                api: 'exitFullScreen'
            }
        });
        expect(spyExitFullScreen.calledOnceWith(false)).toBe(true);

        component.dispose();
    });
});
