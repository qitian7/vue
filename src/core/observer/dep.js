/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

let uid = 0

/**
 * A dep is an observable that can have multiple       dep是可观察的，可以有多个指令订阅它。
 * directives subscribing to it.\
 * 观察订阅模式
 *
 */
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>; // subscriber 订阅者  是一个数组

  constructor () {
    this.id = uid++
    this.subs = []
  }

  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  // 加入观察者数组
  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  // 通知
  // 控制执行顺序, 并执行data对应的func, 如 watch: {..}
  notify () {
    // stabilize the subscriber list first   首先稳定 订户列表
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async    如果未运行异步，则不会在调度程序中排序
      // we need to sort them now to make sure they fire in correct   我们需要立即对其进行排序，以确保它们能够正确发射
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update() // 控制执行顺序, 并执行data对应的func, 如 watch: {..}
    }
  }
}

// The current target watcher being evaluated.  当前监听目标 被评估
// This is globally unique because only one watcher  全局唯一的观察者
// can be evaluated at a time.   可以一次评估。

Dep.target = null
const targetStack = []

export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
