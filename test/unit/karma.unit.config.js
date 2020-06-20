const base = require('./karma.base.config.js')

module.exports = function (config) {
  config.set(Object.assign(base, {
    // browsers: ['Chrome', 'Firefox', 'Safari'],
    // Chrome要换成ChromeHeadless,
    // 另2个('Firefox', 'Safari')暂时用不了, 原因可能 1.浏览器版本 2.window系统问题
    browsers: ['ChromeHeadless'],
    reporters: ['progress'],
    singleRun: true,
    plugins: base.plugins.concat([
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-safari-launcher'
    ])
  }))
}
