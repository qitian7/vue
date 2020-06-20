import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

// var app = new Vue({
//   el: '#app',
//   data: {
//     message: 'Hello Vue!'
//   }
// })

// vue实例 创建点
// 最终是由 vm.$mount(vm.$options.el) 执行的
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue) // _init: _uid  _isVue  $options  _self 等等
stateMixin(Vue) // 实例方法/数据  $data  $props  $set  $delete  $watch
eventsMixin(Vue) // 实例方法/事件  vm.$on  $once  $off  $emit
lifecycleMixin(Vue) // 实例方法/生命周期  $forceUpdate  $destroy  _update
renderMixin(Vue) // $nextTick  _render  $slots  _c  $createElement 等等

export default Vue

// 以下的书写顺序不重要, 声明function等变量都会最先执行, 没有new Vue()之前
// function Vue (options) {
//   this._init(options)
// }
// Vue.prototype._init = function (options) {
//   const vm = this
//   vm.$mount(options)
// }
// Vue.prototype.$mount = function (options) {
//   console.log(options)
// }
