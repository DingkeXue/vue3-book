/*
 * @Author: dingke
 * @Date: 2022-03-20 15:51:23
 * @Description: 监听器
 */
let activeEffect = null
const data = { text: 'hello' }
const bucket = new WeakMap()

const obj = new Proxy(data, {
  get(target, key) {
    track(target, key)
    return target[key]
  },
  set(target, key, value) {
    if (target[key] === value) return
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
  const effectsToRun = new Set(effects)
  effects && effects.forEach(effect => {
    if (effect !== activeEffect) {
      effectsToRun.add(effect)
    }
  })

  effectsToRun.forEach(effectFn => {
    if (activeEffect.options.scheduler) {
      activeEffect.options.scheduler(effectFn)
    } else {
      effectFn()
    }
  })
}

const effectStack = []
function effect(fn, options) {
  const effectFn = () => {
    effectStack.push(effectFn)
    activeEffect = effectFn
    cleanup(effectFn)
    const res = fn()
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
    return res
  }
  effectFn.deps = []
  effectFn.options = options
  if (!effectFn.options.lazy) {
    effectFn()
  }
  return effectFn
}

function cleanup(effectFn) {
  for(let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

// 新增
/**
 * Watch函数
 * @param { Object | Function } source 监听对象或getter 函数
 * @param { Function } cb 回调函数
 * @param { Objec } options 配置参数
 */
function watch(source, cb, options) {
  let getter
  if (typeof source === 'function') {
    getter = source
  } else {
    getter = () => traverse(source)
  }

  // 新老值
  let oldValue, newValue

  // cleanup函数用来存储用户注册的过期函数
  let cleanup
  function onInvalidate(fn) {
    cleanup = fn
  }

  const job = () => {
    newValue = effectFn()
    // 执行回调函数之前执行用户注册的过期函数(闭包)
    if (cleanup) {
      cleanup()
    }
    cb(newValue, oldValue, onInvalidate)
    oldValue = newValue
  }

  const effectFn = effect(
    // 执行getter
    () => getter(), 
    {
      lazy: true,
      // 调度器
      scheduler: () => {
        // flush 类型 post | pre | sync
        if (options.flush === 'post') {
          const p = Promise.resolve()
          p.then(job())
        } else {
          job()
        }
      }
    }
  )
  // 立即执行
  if (options.immediate) {
    // 此时回调函数的 oldValue 为 undefined
    job()
  } else {
    oldValue = effectFn()
  }
}

/**
 * 递归读取数据
 * @param { any } value 需要读取的数据(目前只考虑对象)
 * @param { Set } Set对象，用户存储读取过的属性
 */
function traverse(value, seen = new Set()) {
  if (typeof value !== 'object' || value === null || seen.has(value)) return
  // 将数据添加到 seen 中，代表遍历的读取过了，避免循环引用引起的死循环
  seen.add(value)
  // 依次对对象的key进行读取操作（收集依赖）
  for (const key in value) {
    traverse(value[key], seen)
  }
  return value
}

/*****************使用****************/
watch(obj, async (newValue, oldValue, onInvalidate) => {
  let expired = false
  onInvalidate(() => {
    expired = true
  })

  const res = await fetch('xxx', { newValue })
  if (!expired) {
    finalData = res
  }
}, { immediate: true, flush: 'post', deep: true })

watch(() => obj.text, async (newValue, oldValue, onInvalidate) => {
  let expired = false
  onInvalidate(() => {
    expired = true
  })

  const res = await fetch('xxx', { newValue })
  if (!expired) finalData = res
})