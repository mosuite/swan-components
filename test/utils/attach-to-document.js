export default function attach2Document(component) {
    let wrapper = document.createElement('div');
    let id =  'wrapper_' + (Date.now() + '').slice(-4) + '_' + (Math.random() + '').slice(-4)
    wrapper.id = id;
    document.body.appendChild(wrapper);
    component.attach(wrapper);
    return wrapper;
}