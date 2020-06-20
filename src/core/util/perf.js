import { inBrowser } from './env'

// 测速API
export let mark
export let measure

if (process.env.NODE_ENV !== 'production') {
  // inBrowser 浏览器环境
  // API允许网页访问某些函数来测量网页和Web应用程序的性能
  const perf = inBrowser && window.performance
  /* istanbul ignore if */
  if (
    perf &&
    perf.mark &&
    perf.measure &&
    perf.clearMarks &&
    perf.clearMeasures
  ) {
    /** handler
     performance.mark()
         通过一个给定的名称，将该名称（作为键）和对应的DOMHighResTimeStamp（作为值）保存在一个哈希结构里。
     */
    mark = tag => perf.mark(tag)
    //  measure() 方法在浏览器性能记录缓存中创建了一个名为时间戳的记录来记录两个特殊标志位
    //  （通常称为开始标志和结束标志）。 被命名的时间戳称为一次测量（measure）。
    measure = (name, startTag, endTag) => {
      perf.measure(name, startTag, endTag)
      perf.clearMarks(startTag)
      perf.clearMarks(endTag)
      // perf.clearMeasures(name)
    }
  }
}
