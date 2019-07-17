import sinon from 'sinon';
import camera from '../../../src/camera/index';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
const COMPONENT_NAME = 'camera';

describe('component [' + COMPONENT_NAME + ']', () => {
    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, camera);
        const $component = attach2Document(component);
        componentBaseFieldCheck(COMPONENT_NAME, component);
        afterAll(() => {
            component.dispose();
        })
        it('should be render while attach', () => {
            let $swanCamera = $component.querySelector('swan-camera');
            let $innerDiv = $component.querySelector('swan-camera>div');
            expect($swanCamera).not.toBe(null);
            expect($innerDiv).not.toBe(null);
        });
        it('should has one slot', () => {
            expect(component.slot.length).toBe(1);
        });
        it('should update Native component while slaveUpdated', done => {
            const spy = sinon.spy(component.boxjs.media, 'camera');
            component.data.set('hidden', true);
            component.slaveUpdated();
            component.nextTick(() => {
                expect(spy.calledWith(sinon.match.has('type', sinon.match('update')))).toBe(true)
                spy.restore();
                done();
            });
        });

        it('should trigger binderror event', done => {
            const spy = sinon.spy(component, 'dispatchEvent');
            component.communicator.fireMessage({
                type: `camera_${component.cameraId}`,
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
});