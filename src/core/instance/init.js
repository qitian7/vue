/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

// 处理vue的初始化, 私有方法 _init
export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    // vue构建测速
    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true

    // var app = new Vue({
    //   el: '#app',
    //   data: {
    //     message: 'Hello Vue!'
    //   }
    // })
    // merge options
    // 如果是内部组件   createComponentInstanceForVnode 里有 _isComponent: true
    if (options && options._isComponent) {
      // optimize优化 internal component instantiation实例化
      // since因为 dynamic动态 options merging is pretty slow, and none of the
      // internal component options needs special treatment.

      // 优化内部组件实例化
      // 因为动态选项合并非常慢，而且没有内部组件选项需要特殊处理。
      initInternalComponent(vm, options)
    } else { // 外部组件
      /** mergeOptions
       *    1. 把所有属性merge起来
       *       比如: data  directives  filters  watch  props inject 等等
       */
      vm.$options = mergeOptions(
        /** 把一些全局组件 和全局方法挂载到 vue.$option 下
         * {
         *   components: {KeepAlive: {…}, Transition: {…}, TransitionGroup: {…}}
             directives: {model: {…}, show: {…}}
             filters: {}
             _base: ƒ Vue(options)
         * }
         */
        // vm 是 new Vue()出来的新对象, vm.constructor 指向构造函数就是 Vue
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      // 错误提示 监听 vm.$options.$data 的属性, 有问题则报错  比如this.$data.a = 1 √  写成 this.a = 1 给个错误提醒
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm) // 实现 _c $createElement 渲染函数  $slots  $scopedSlots  v-bind="$attrs"  v-on="$listeners"
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm) // initProps  methods  data  computed  watch
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    // 计算构建(init)时间
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

// 内部组件
export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

/** 把一些全局组件 和全局方法挂载到 vue.$option 下
 * {
 *   components: {KeepAlive: {…}, Transition: {…}, TransitionGroup: {…}}
     directives: {model: {…}, show: {…}}
     filters: {}
     _base: ƒ Vue(options)
 * }
 */
// 处理Constructor的选项  ctor 是constructor的意思
export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  // super关键字用于访问和调用一个对象的父对象上的函数。 (可这么理解: super 类似this是关键字, super指向父的this)
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}


