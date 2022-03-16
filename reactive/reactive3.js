let activeEffect = null
const data = { text: 'hello world' }
const bucket = new WeakMap() // 结构：target: Map

const obj = new Proxy(data, {
  get(target, key) {
    if (!activeEffect) return
    // 根据target从桶中获取依赖， depMaps 结构：key: effects
    const depMaps = bucket.get(target)
    if(!depMaps) {
      bucket.set(target, (depMaps = new Map()))
    }
    // 根据 key 获取对应的 副作用函数
    const effets = depMaps.get(key)
    if(!effets) {
      depMaps.set(key, (effets = new Set()))
    }
    // 收集依赖
    effets.add(activeEffect)
    return target[key]
  },
  set(target, key, newVal) {
    const oldVal = target[key]
    if (oldVal === newVal) return true
    target[key] = newVal
    // 根据target获取Map
    const depMaps = bucket.get(target)
    if (!depMaps) return
    const effects = depMaps.get(key)
    // 执行副作用函数
    effects && effects.forEach(fn => fn())
  }
})

function effect(fn) {
  activeEffect = fn
  fn()
}