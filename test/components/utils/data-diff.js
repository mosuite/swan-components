/**
 * @file accumulateDiff
 * @author yangzongjun@baidu.com
 */

import {accumulateDiff} from '../../../src/utils/data-diff';

describe('utils accumulateDiff', () => {
    it('accumulateDiff', () => {
        let res = accumulateDiff({a: 1}, {b: 2}, [], []);
        expect(JSON.stringify(res)).toEqual('[{"kind":"N","path":["b"],"rhs":2}]');
    });

    it('accumulateDiff realTypeOf regexp', () => {
        let res = accumulateDiff(new RegExp('a'), new RegExp('b'), [], []);
        expect(JSON.stringify(res)).toEqual('[{"kind":"E","lhs":"/a/","rhs":"/b/"}]');
    });

    it('accumulateDiff realTypeOf null', () => {
        let res = accumulateDiff(null, new RegExp('b'), [], []);
        expect(JSON.stringify(res)).toEqual('[{"kind":"E","lhs":null,"rhs":{}}]');
    });

    it('accumulateDiff realTypeOf array', () => {
        let res = accumulateDiff(['null'], new RegExp('b'), [], []);
        expect(JSON.stringify(res)).toEqual('[{"kind":"E","lhs":["null"],"rhs":{}}]');
    });

    it('accumulateDiff: array array', () => {
        let res = accumulateDiff([{a: 1}], [{b: 2}, 2, 3], [], []);
        expect(JSON.stringify(res)).toEqual('[{"kind":"A","index":2,"item":{"kind":"N","rhs":3}},{"kind":"A","index":1,"item":{"kind":"N","rhs":2}},{"kind":"D","path":[0,"a"],"lhs":1},{"kind":"N","path":[0,"b"],"rhs":2}]');
    });

    it('accumulateDiff: array array', () => {
        let res = accumulateDiff([{a: 1}, 2, 3], [{b: 2}], [], []);
        expect(JSON.stringify(res)).toEqual('[{"kind":"A","index":2,"item":{"kind":"D","lhs":3}},{"kind":"A","index":1,"item":{"kind":"D","lhs":2}},{"kind":"D","path":[0,"a"],"lhs":1},{"kind":"N","path":[0,"b"],"rhs":2}]');
    });
});
