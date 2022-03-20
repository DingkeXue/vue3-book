/*
 * @Author: dingke
 * @Date: 2022-03-19 17:04:15
 * @Description: 可嵌套副作用函数
 */
let activeEffect = null
const bucket = new WeakMap()
const data = { foo: 'hello', bar: 'world' }

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
  const newEffects = new Set(effects)
  newEffects.forEach(effectFn => effectFn())
}

// 新增effect 栈
const effectStacks = []
function effect(fn) {
  const effectFn = () => {
    cleanup(effectFn)
    // 新增
    activeEffect = effectFn
    effectStacks.push(effectFn)
    fn()
    effectStacks.pop()
    activeEffect = effectStacks[effectStacks.length - 1]
  }
  effectFn.deps = []
  effectFn()
}

function cleanup(effectFn) {
  for(let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

// 使用
effect(function effectFn1() {
  console.log(obj.bar)
  effect(function effectFn2() {
    console.log(obj.foo)
  })
})