/**
 * unit test for mask
 * @author liuyuekeng(liuyuekeng@baidu.com)
 */

import Mask from '../../../src/mask';
import buildComponent from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';

const COMPONENT_NAME = 'map';

describe('component [' + COMPONENT_NAME + ']', () => {
    it('should be default hidden', () => {
        const component = buildComponent(COMPONENT_NAME, Mask);
        const $component = attach2Document(component);
        const $mask = $component.querySelector('div');
        expect($mask).not.toBe(null);
        expect(getComputedStyle($mask).display).toBe('none');
        component.dispose();
    });
    it('should show up while hidden is false', () => {
        const component = buildComponent(COMPONENT_NAME, Mask, {
            data: {hidden: false}
        });
        const $component = attach2Document(component);
        const $mask = $component.querySelector('div');
        expect($mask).not.toBe(null);
        expect(getComputedStyle($mask).display).toBe('block');
        component.dispose();
    })
});