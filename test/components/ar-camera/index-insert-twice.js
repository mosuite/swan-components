// insert twice
// camera 一个页面唯一，只能创建一个，为了模拟创建失败用多个页面
import sinon from 'sinon';
import ARCamera from '../../../src/ar-camera/index';
import buildComponent from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';
const COMPONENT_NAME = 'ar-camera';

describe('component [' + COMPONENT_NAME + ']', () => {
    describe('api remove fail', () => {
        const component = buildComponent(
            COMPONENT_NAME,
            ARCamera,
        );
        attach2Document(component);

        component.getBoxJsData = () => null;

        const component2 = buildComponent(
            COMPONENT_NAME,
            ARCamera,
        );
        attach2Document(component2);

        const spy = sinon.spy(component2.boxjs.media, 'ARCamera');
        it('insert fail', done => {
            component.nextTick(() => {
                expect(spy.calledWith(sinon.match.has('type', sinon.match('insert')))).toBe(false);
                spy.restore();
                done();
            });
        });
    });
});