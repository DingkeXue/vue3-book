/*
 * @Author: dingke
 * @Date: 2022-03-23 22:22:24
 * @Description: Ref实现原理
 */
import reactive from './reactive'

/**
 * 原始值的响应式代理
 * @param {Boolean | Number | String | BingInt | null | undefined } val 原始数据类型
 * @returns 响应式对象
 */
function ref(val) {
  const wrapper = {
    value: val
  }

  // 判断一个对象是否是 ref
  Object.defineProperty(wrapper, '__v_isRef', {
    value: true
  })

  return reactive(wrapper)
}