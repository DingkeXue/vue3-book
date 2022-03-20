/*
 * @Author: dingke
 * @Date: 2022-03-19 17:58:07
 * @Description: 计算属性
 */
const activeEffect = null
const bucket = new WeakMap()
const data = { foo: 1, bar: 2 }

const obj = new Proxy(data, {
  get(target, key) {
    track(target, key)
    return target[key]
  },
  set(target, key, value) {
    const oldVal = target[key]
    if(oldVal === value) return
    target[key] = value
    trigger(target, key)
  }
})

function track(target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap) {
    bucket.set(target, ( depsMap = new Map()))
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
  if(!depsMap) return
  const effects = depsMap.get(key)
  const effectsToRun = new Set(effects)
  effects && effects.forEach(effect => {
    if (effect !== activeEffect) {
      effectsToRun.add(effect)
    }
  })
  effectsToRun.forEach(effectFn => {
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    } else {
      effectFn()
    }
  })
}

const effetsStack = []
/**
 * 副作用函数构造器
 * @param { Function } fn 副作用函数
 * @param { Object } options 调度器
 */
function effect(fn, options) {
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn
    effectsStack.push(effectFn)
    // 将 fn 的执行结果存起来
    const res = fn()
    effectsStack.pop()
    activeEffect = effectsStack[effectsStack.length-1]
    // 返回res
    return res
  }
  effectFn.deps = []
  effectFn.options = options
  // 懒计算
  if (!effectFn.options.lazy) {
    effectFn()
  }
  return effectFn // 返回
}

function cleanup(effectFn) {
  for(let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

// 新增
function computed(getter) {
  let value
  let dirty = true
  const effectFn = effect(getter, {
    lazy: true,
    scheduler(fn) {
      if(!dirty) {
        dirty = true
        // 当计算属性依赖的响应式数据变化时，手动调用trigger函数进行更新
        trigger(obj, value)
        fn()
      }
    }
  })
  const obj = {
    get value() {
      // 当读取 obj 的 value时，手动调用track函数进行追踪
      track(obj, 'value')
      if (dirty) {
        value = effectFn()
        dirty = false
      }
      return value // 这里的执行结果为上面的res
    }
  }
  return obj
}
