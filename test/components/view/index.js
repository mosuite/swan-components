/**
 * @file web-view组件单测
 * @author yanghuabei@baidu.com
 */

import View from '../../../src/view';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
const COMPONENT_NAME = 'view';

describe('component [' + COMPONENT_NAME + ']', () => {
    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, View);
        const $component = attach2Document(component);

        componentBaseFieldCheck(COMPONENT_NAME, component);
        it('should be rendered after attach', () => {
            const $swanView = $component.querySelector('swan-view');
            expect($swanView).not.toBe(null);
        });

        it('should has one default slot', () => {
            expect(component.slot.length).toBe(1);
        });

        describe('default props', () => {
            it('should has right default props', () => {
                const data = component.data;
                expect(data.get('hoverStartTime')).toBe(50);
                expect(data.get('hoverStayTime')).toBe(400);
                expect(data.get('hoverStopPropagation')).toBe(false);
            });
        });
    });
});