/*
 * @Author: dingke
 * @Date: 2022-03-21 22:27:12
 * @Description: 理解Reflect
 */
const obj = { 
  foo: 1, 
  get bar () { return this.foo} 
}
const bucket = new WeakMap()
const activeEffect = null

const p = new Proxy(obj, {
  // 新增第三个参数receiver,它表示谁在读取属性
  get(target, key, receiver) {
    track(target, key)
    Reflect.get(target, key, receiver)
  },
  set(target, key, value) {
    if (target[key] === value) return
    target[key] = value
    trigger(target, key)
  }
})

function track(target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  const deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect)
  activeEffect.deps.push(deps)
}

function trigger(target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)
  const effectsToRun = new Set()

  effects && effects.forEach(effect => {
    if (effect !== activeEffect) {
      effectsToRun.add(effect)
    }
  })

  effectsToRun.forEach(effectFn => {
    if (effectFn.options.schdular) {
      effectFn.options.schdular(effectFn)
    } else {
      effectFn()
    }
  })
}

const effectsStack = []
function effect(fn, options = new Set()) {
  const effectFn = () => {
    activeEffect = effectFn
    effectsStack.push(effectFn)
    cleanup(effectFn)
    const res = fn()
    effectsStack.pop()
    activeEffect = effectsStack[effectsStack.length - 1]
    return res
  }
  effectFn.deps = []
  effectFn.options = options

  if (!effectFn.options.lazy) {
    effectFn()
  } else {
    return effectFn
  }
}

function cleanup(effectFn) {
  for(let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}