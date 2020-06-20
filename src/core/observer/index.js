/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}

/**
 * Observer class类 that is attached to each observed object
 * Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data  具有该对象作为根$data的vm的数量

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    // 给每个data的对象{...} 增加一个 __ob__ 属性
    def(value, '__ob__', this) // Define a property.
    if (Array.isArray(value)) {
      // 因为 Object.defineProperty 监听不了数组的变化, 所以此处, 给每个属性加上数组修改时的监听,在__proto__
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into getter/setters. 遍历所有属性并将其转换为getter/setters.
   *  This method should only be called when value type is Object. 仅在 值类型为Object才应调用此方法
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      // ( 给每个键 值 ) 添加响应式
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value(值)  为一个值创建观察者(监听),
 * returns the new observer if successfully observed,
 * or the existing(现有) observer if the value(值) already has one(已经有了一个).
 */
// 为 data 做 监听
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void

  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) { // 已有 监听者 的话, 就用现在有的
    ob = value.__ob__
  } else if ( // 没有的话, 则新建一个 new Observer
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&  // Object.isExtensible() 方法判断一个对象是否是可扩展的（是否可以在它上面添加新的属性）。
    !value._isVue
  ) {
    // 一连串的校验后, 此处真正进入监听
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.  把对象的属性变成响应式
 */
// 添加响应式
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep()

  /** 返回改属性的描述
         o = { bar: 42 };
         d = Object.getOwnPropertyDescriptor(o, "bar");

         - d {
         -   configurable: true,
         -   enumerable: true,
         -   value: 42,
         -   writable: true
         - }


         o = { get foo() { return 17; } };
         d = Object.getOwnPropertyDescriptor(o, "foo");

         - d {
         -   configurable: true,
         -   enumerable: true,
         -   get: /*the getter function  * /,    获取该属性的访问器函数（getter）
         -   set: undefined     获取该属性的设置器函数（setter）。 如果没有设置器， 该值为undefined
         - }
   */
  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  // 递归处理多层嵌套, 比如data:{ a: {b: {..} } }, 达到每个值都监听到
  let childOb = !shallow && observe(val) // 如果不隐藏属性

  // 默认给每个对象绑上  get 和 set
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    /**
     *  1. 如果一个data有写getter, 则执行一次
     *  2. 将每个data加入观察者数组(多层的话用递归)
     */
    get: function reactiveGetter () {
      // 如果有getter 就执行getter:   getter.call(obj)
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend() // 加入观察者数组
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    // 如果改变一个值, 如果有setter的话, 就执行
    // 如: watch: {..} 监听的值, 已改变, 就执行对应的func
    set: function reactiveSetter (newVal) {
      // 先拿到value的值
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter 用于没有setter的访问器属性
      if (getter && !setter) return
      if (setter) { // 如果有set 执行setter
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 递归处理多层嵌套, 比如data:{ a: {b: {..} } }, 达到每个值都监听到
      childOb = !shallow && observe(newVal)
      dep.notify()  // 控制执行顺序, 并执行data对应的func, 如 watch: {..}
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set (target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
