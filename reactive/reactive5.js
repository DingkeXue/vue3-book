/*
 * @Author: dingke
 * @Date: 2022-03-19 16:38:00
 * @Description: 分支切换和cleanup
 */
let activeEffect = null
const bucket = new WeakMap()
const data = { ok: true, text: 'hello world' }

const obj = new Proxy(data, {
  get(target, key) {
    track(target, key)
    return target[key]
  },
  set(target, key, value) {
    const oldVal = target[key]
    if (oldVal === value) return
    target[key] = value
    trigger(target, key)
  }
})

// 收集依赖
function track(target, key) {
  const depsMap = bucket.get(target)
  if(!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  const effects = depsMap.get(key)
  if(!effects) {
    depsMap.set(key, (effects = new Set()))
  }
  effects.add(activeEffect)
  activeEffect.deps.push(effects) // 新增
}

// 触发更新
function trigger(target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)
  // 新增Set,避免无限循环
  const newDeps = new Set(effects)
  newDeps.forEach(effectFn => effectFn())
}

// 副作用函数
function effect(fn) {
  const effectFn = () => {
    // 每次收集依赖前删除之前的依赖
    cleanup(effectFn)
    activeEffect = effectFn
    fn()
  }
  effectFn.deps = []
  effectFn()
}

function cleanup(effectFn) {
  for(let i = 0; i < effectFn.deps.length; i++) {
    // deps 是依赖集合
    const deps = effectFn.deps[i]
    // 将副作用函数从依赖集合中删除
    deps.delete(effectFn)
  }
  effectFn.deps.length = []
}

effect(() => {
  document.body.innerText = obj.ok ? obj.text : 'not'
})