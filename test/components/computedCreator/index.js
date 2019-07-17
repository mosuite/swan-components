import san from 'san';
import {internalDataComputedCreator, typesCast} from '../../../src/computedCreator';

describe('component [' + 'computedCreator' + ']', () => {
    describe('oneOfType cast', () => {
        it('oneOfType cast', done => {
            let MyApp = san.defineComponent({
                template: '<div>{{value1}}</div>',
                initData() {
                    return {
                        value1: {},
                        value2: 'string',
                        value3: {}
                    };
                },
                computed: {
                    ...internalDataComputedCreator(
                        [
                            {name: 'value1', caster: [typesCast.stringCast, typesCast.numCast]},
                            {name: 'value2', caster: [typesCast.stringCast, typesCast.numCast]},
                            {name: 'value3', caster: typesCast.numCast}
                        ]
                    )
                },
                attached() {
                    expect(this.data.get('__value1')).toBe('');
                    expect(this.data.get('__value2')).toBe('string');
                    expect(this.data.get('__value3')).toBe(0);
                    done();
                }
            });
            let myApp = new MyApp();
            myApp.attach(document.body);
        });
    });
});
