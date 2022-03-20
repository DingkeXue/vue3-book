/*
 * @Author: dingke
 * @Date: 2022-03-19 17:22:06
 * @Description: 避免无限递归
 */
const bucket = new WeakMap()
const activeEffect = null
const data = { number: 1 }

const obj = new Proxy(data, {
  get(target, key) {
    track(target, key)
    return target[key]
  },
  set(target, key, value) {
    const oldValue = target[key]
    if (!oldValue === value) return
    target[key] = value
    trigger(target, key)
  }
})

function track(target, key) {
  const depsMap = bucket.get(target)
  if(!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  const deps = depsMap.get(key)
  if(!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect)
  activeEffect.deps.push(deps)
}

function trigger(target, key) {
  const depsMap = bucket.get(target)
  if(!depsMap) return
  const effects = depsMap.get(key)
  // 新增
  const effectsToRun = new Set()
  effects && effects.forEach(effect => {
    if (effect !== activeEffect) {
      effectsToRun.add(effect)
    }
  })
  effectsToRun.forEach(effectFn => effectFn())
}

const effectsStack = []
function effect(fn) {
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn
    effectsStack.push(effectFn)
    fn()
    effectsStack.pop()
    activeEffect = effectsStack[effectsStack.length - 1]
  }
  effectFn.deps  = []
  effectFn()
}

// 使用
effect(() => {
  data.number++
})