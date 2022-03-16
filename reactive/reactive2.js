// 全局副作用函数
let activeEffect = null

const bucket = new Set()

const data = { text: 'hello  world' }
const obj = new Proxy(data, {
  get(target,key) {
    bucket.add(activeEffect)
    return target[key]
  },
  set(target, key, value) {
    if (value === target[key]) return true
    target[key] = value
    bucket.forEach(fn => fn())
    return true
  }
})

// 注册副作用函数
function effect(fn) {
  activeEffect = fn
  fn()
}

effect(() => {
  console.log(1111111)
  document.body.innerText = obj.text
})

setTimeout(() => {
  obj.text = 'change....'
}, 2000);

setTimeout(() => {
  obj.noExit = 'hhhhhhh'
}, 4000);