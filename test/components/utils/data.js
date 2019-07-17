/**
 * @file data
 * @author yangzongjun@baidu.com
 */

import {Data} from '../../../src/utils/data';

describe('utils data', () => {
    it('data set', () => {
        let data = new Data({default: {d1: 1}});
        data.set('', 1);
        expect(data.raw).toEqual({default: {d1: 1}});

        data.set('default.a', 2);
        expect(data.raw).toEqual({default: {d1: 1, a: 2}});

        data.set('defaultB.a', 1);
        expect(data.raw).toEqual({
            default: {d1: 1, a: 2},
            defaultB: {a: 1}
        });
    });

    it('data push', () => {
        let data = new Data({default: {d1: 1, d2: [2]}});
        let res = data.push('', 1);
        expect(res).toEqual(null);

        res = data.push('default.d2', 2);
        expect(res).toEqual(2);
    });

    it('data pop', () => {
        let data = new Data({default: {d1: 1, d2: [3]}});
        let res = data.pop('', 1);
        expect(res).toEqual(null);

        res = data.pop('default.d2');
        expect(res).toEqual(3);
    });

    it('data unshift', () => {
        let data = new Data({default: {d1: 1, d2: [3]}});
        let res = data.unshift('', 1);
        expect(res).toEqual(null);

        res = data.unshift('default.d2', 4);
        expect(res).toEqual(2);
    });

    it('data shift', () => {
        let data = new Data({default: {d1: 1, d2: [3]}});
        let res = data.shift('', 1);
        expect(res).toEqual(null);

        res = data.shift('default.d2');
        expect(res).toEqual(3);
    });

    it('data removeAt', () => {
        let data = new Data({default: {d1: 1, d2: [3]}});
        let res = data.removeAt('', 1);
        expect(res).toEqual(null);

        res = data.removeAt('default.d2', 0);
        expect(res).toEqual([3]);
    });

    it('data splice', () => {
        let data = new Data({default: {d1: 1, d2: [1, 2, 4]}});
        let res = data.splice('', 1);
        expect(res).toEqual(null);

        res = data.splice('default.d2', 3, 0, 3);
        expect(res).toEqual([]);
    });
});
