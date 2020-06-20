/* @flow */

import Vue from 'core/index'
import config from 'core/config'
import { extend, noop } from 'shared/util'
import { mountComponent } from 'core/instance/lifecycle'
import { devtools, inBrowser } from 'core/util/index'

import {
  query,
  mustUseProp,
  isReservedTag,
  isReservedAttr,
  getTagNamespace,
  isUnknownElement
} from 'web/util/index'

import { patch } from './patch'
import platformDirectives from './directives/index'
import platformComponents from './components/index'

// install platform specific utils 安装特定平台工具
Vue.config.mustUseProp = mustUseProp // 必须使用prop的配置, return  Boolean
Vue.config.isReservedTag = isReservedTag // 预留标签
Vue.config.isReservedAttr = isReservedAttr // 预留属性 style,class
Vue.config.getTagNamespace = getTagNamespace // 'svg' 'math'
Vue.config.isUnknownElement = isUnknownElement //  Unknown Element?

// install platform runtime directives & components  安装平台运行时指令和组件
extend(Vue.options.directives, platformDirectives) // v-show  v-model
extend(Vue.options.components, platformComponents) // <transition> <transition-group> 动画的全局组件

// install platform patch function  此处  挂载私有的patch方法
Vue.prototype.__patch__ = inBrowser ? patch : noop

// public mount method
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  // 挂载之前, 先执行钩子 beforeCreated created beforeMounted
  return mountComponent(this, el, hydrating)
}

// devtools global hook
/* istanbul ignore next */
if (inBrowser) {
  setTimeout(() => {
    if (config.devtools) {
      if (devtools) {
        devtools.emit('init', Vue)
      } else if (
        process.env.NODE_ENV !== 'production' &&
        process.env.NODE_ENV !== 'test'
      ) {
        console[console.info ? 'info' : 'log'](
          'Download the Vue Devtools extension for a better development experience:\n' +
          'https://github.com/vuejs/vue-devtools'
        )
      }
    }
    if (process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'test' &&
      config.productionTip !== false &&
      typeof console !== 'undefined'
    ) {
      console[console.info ? 'info' : 'log'](
        `You are running Vue in development mode.\n` +
        `Make sure to turn on production mode when deploying for production.\n` +
        `See more tips at https://vuejs.org/guide/deployment.html`
      )
    }
  }, 0)
}

export default Vue
