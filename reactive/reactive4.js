/**
 * 封装追踪和触发函数
 */

const activeEffect = null
const bucket = new WeakMap()
const data = { text: 'hello world' }

const obj = new Proxy(data, {
  get(target, key) {
    track(target, key)
    return target[key]
  },
  set(target, key, newVal) {
    const oldVal = target[key]
    if(oldVal === newVal) return
    target[key] = newVal
    trigger(target, key)
    return true
  }
})

// 注册副作用函数
function effect(fn) {
  activeEffect = fn
  fn()
}

// 在get拦截函数内调用track函数进行追踪变化
function track(target, key) {
  const depMaps = bucket.get(target)
  if (!depMaps) {
    bucket.set(target, (depMaps = new Map()))
  }
  const effets = depMaps.get(key)
  if(!effects) {
    depMaps.set(key, (effets = new Set()))
  }
  effets.add(activeEffect)
}

// 在set时触发变化
function trigger(target, key) {
  const depMaps = bucket.get(target)
  if(!depMaps) return
  const effects = depMaps.get(key)
  effects && effects.forEach(fn => fn())
}