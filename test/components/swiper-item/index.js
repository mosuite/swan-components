import swiperItem from '../../../src/swiper-item/index';
import attach2Document from '../../utils/attach-to-document';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import sinon from 'sinon';
const COMPONENT_NAME = 'swiperItem';


describe('component [' + COMPONENT_NAME + ']', () =>{
    const component = buildComponent(COMPONENT_NAME,swiperItem);
    const $component = attach2Document(component);
    componentBaseFieldCheck(COMPONENT_NAME, component);
    const $swiper = $component.querySelector('swan-swiper-item');
    it('should be rendered after attach', () =>{
        expect($component).not.toBe(null);
        expect($swiper).not.toBe(null);
    })
    it('slot children component' , () =>{
        expect(component.slot.length).toBe(1);
    })
})