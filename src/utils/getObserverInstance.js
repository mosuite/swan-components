/**
 * @file 获取全局的IntersectionObserver对象
 * @author funa(funa01@baidu.com)
 */

// polyfill
import 'intersection-observer';

class GlobalIntersectionObserver {
    constructor(options = {}) {
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), options);
        this.handlers = {};
        this.observeId = 0;

        // polyfill setting: Ignoring DOM changes
        if ('USE_MUTATION_OBSERVER' in this.observer) {
            this.observer.USE_MUTATION_OBSERVER = false;
        }
    }

    handleIntersection(entries) {
        entries.forEach(item => {
            const observeId = item.target.getAttribute('observe-id');
            const handler = this.handlers[observeId];
            handler && handler.call(this, item);
        });
    }

    observe(target, callback) {
        const observeId = this.observeId++;
        target.setAttribute('observe-id', observeId);
        this.handlers[observeId] = callback;
        this.observer.observe(target);
    }

    unobserve(target) {
        const observeId = target.getAttribute('observe-id');
        this.handlers[observeId] = undefined;
        target.removeAttribute('observe-id');
        this.observer.unobserve(target);
    }
}

let observers = {};

/**
 *
 * @param {string} type 标示某一类全局IntersectionObserver对象，一般同类型组件维护一个如image
 * @param {Object} options IntersectionObserver options
 * @return {Object} IntersectionObserver对象
 */
export default function (type, options) {
    if (type in observers) {
        return observers[type];
    }

    observers[type] = new GlobalIntersectionObserver(options);

    return observers[type];
}