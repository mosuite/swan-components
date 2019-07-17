import sinon from 'sinon';
import ARCamera from '../../../src/ar-camera/index';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
const COMPONENT_NAME = 'ar-camera';

describe('component [' + COMPONENT_NAME + ']', () => {
    const component = buildComponent(COMPONENT_NAME, ARCamera);
    const $component = attach2Document(component);

    afterAll(() => {
        component.dispose();
    });

    it('should be render while attach', () => {
        let $swanARCamera = $component.querySelector('swan-ar-camera');
        let $innerDiv = $component.querySelector('swan-ar-camera>div');
        expect($swanARCamera).not.toBe(null);
        expect($innerDiv).not.toBe(null);
    });

    it('should update Native component while slaveRenderd', done => {
        const spy = sinon.spy(component.boxjs.media, 'ARCamera');
        component.el.style.top = '-1px';
        component.slaveUpdated();
        component.nextTick(() => {
            expect(spy.calledWith(sinon.match.has('type', sinon.match('update')))).toBe(true)
            spy.restore();
            done();
        });
    });

    const component2 = buildComponent(COMPONENT_NAME, ARCamera);
    const $component2 = attach2Document(component2);
    componentBaseFieldCheck(COMPONENT_NAME, component2);

    it('should trigger binderror event', done => {
        const spy = sinon.spy(component, 'dispatchEvent');
        component.communicator.fireMessage({
            type: `ARCamera_${component.ARCameraId}`,
            params: {
                action: 'fullscreenchange',
                e: {
                    data: '{"fullscreen":"1", "width":"720", "height":"360", "videoId":"myde"}'
                }
            }
        });
        expect(spy.callCount).toBe(1);
        spy.restore();
        done();
    });
});