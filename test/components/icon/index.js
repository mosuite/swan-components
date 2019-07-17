import icon from '../../../src/icon/index';
import buildComponent from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
const COMPONENT_NAME = 'icon';


describe('component [' + COMPONENT_NAME + ']', () => {
    const component = buildComponent(COMPONENT_NAME, icon);
    const $component = attach2Document(component);
    componentBaseFieldCheck(COMPONENT_NAME, component);
    it('should be render while attach', () => {
        let $swanIcon = $component.querySelector('swan-icon');
        expect($swanIcon).not.toBe(null);
    });
});
describe('component [' + COMPONENT_NAME + ']',() => {
    const component = buildComponent(COMPONENT_NAME, icon,{
        data:{
            type:"success",
            size:30,
            color:"#f00"
        }
    });
    const $component = attach2Document(component);
    it("data verify", done => {
        let $swanIcon = $component.querySelector('swan-icon');
        let $swanSpan = $component.querySelector("swan-icon>span");      
        
        expect($swanSpan.className.indexOf('swan-icon-success')).not.toBe(-1);
        expect($swanSpan.style.color).toBe('rgb(255, 0, 0)');
        expect($swanSpan.style.fontSize).toBe('30px');      
        component.data.set('type','loadingWhite');
        
        component.nextTick(() => {
            $swanSpan = $component.querySelector('swan-icon>span');
            expect($swanSpan.className.indexOf('swan-icon-loadingWhite')).not.toBe(-1);
            expect($swanSpan.style.width).toBe('30px');
            expect($swanSpan.style.height).toBe('30px');
            done();
        });
    })
})
