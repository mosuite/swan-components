import { eventProccesser } from '../../src/utils';
export function tapEventCallbackFieldCheck(expect, done, data) {
    let e = eventProccesser('tap', data)
    expect(e.currentTarget).not.toBe(undefined);
    expect(e.currentTarget.id).not.toBe(undefined);
    expect(e.currentTarget.offsetLeft).not.toBe(undefined);
    expect(e.currentTarget.offsetTop).not.toBe(undefined);
    expect(e.target).not.toBe(undefined);
    expect(e.target.id).not.toBe(undefined);
    expect(e.target.offsetLeft).not.toBe(undefined);
    expect(e.target.offsetTop).not.toBe(undefined);
    expect(e.type).toBe('tap');
    expect(typeof e.detail.x).toBe('number');
    expect(typeof e.detail.y).toBe('number');
    done();
}
export function loadEventCallbackFieldCheck(expect, done, data) {
    let e = eventProccesser('load', data);
    expect(e.currentTarget).not.toBe(undefined);
    expect(e.currentTarget.id).not.toBe(undefined);
    expect(e.currentTarget.offsetLeft).not.toBe(undefined);
    expect(e.currentTarget.offsetTop).not.toBe(undefined);
    expect(e.target).not.toBe(undefined);
    expect(e.target.id).not.toBe(undefined);
    expect(e.target.offsetLeft).not.toBe(undefined);
    expect(e.target.offsetTop).not.toBe(undefined);
    expect(e.type).not.toBe(undefined)
    done();
}
export function swiperBindChangeEventCallbackFieldCheck(expect, done, data) {
    let e = eventProccesser('load', data);
    expect(e.currentTarget).not.toBe(undefined);
    expect(e.currentTarget.id).not.toBe(undefined);
    expect(e.currentTarget.offsetLeft).not.toBe(undefined);
    expect(e.currentTarget.offsetTop).not.toBe(undefined);
    expect(e.target).not.toBe(undefined);
    expect(e.target.id).not.toBe(undefined);
    expect(e.target.offsetLeft).not.toBe(undefined);
    expect(e.target.offsetTop).not.toBe(undefined);
    expect(typeof e.detail.current).toBe('number');
    expect(e.detail.source).toBe("");
    done();
}
export function pickerBindChangeEventCallbackFieldCheck(expect, done, data) {
    let e = eventProccesser('load', data);
    expect(e.currentTarget).not.toBe(undefined);
    expect(e.currentTarget.id).not.toBe(undefined);
    expect(e.currentTarget.offsetLeft).not.toBe(undefined);
    expect(e.currentTarget.offsetTop).not.toBe(undefined);
    expect(e.target).not.toBe(undefined);
    expect(e.target.id).not.toBe(undefined);
    expect(e.target.offsetLeft).not.toBe(undefined);
    expect(e.target.offsetTop).not.toBe(undefined);
    expect(e.detail.value).toBe('success');
    done();
}