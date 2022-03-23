/*
 * @Author: dingke
 * @Date: 2022-03-23 22:29:44
 * @Description: toRef/toRefs实现原理
 */

function toRef(obj, key) {
  const wrapper = {
    get value() {
      return obj[key]
    },
    set value(val) {
      obj[key] = val
    }
  }

  Object.defineProperty(wrapper, '__v-isRef_', {
    value: true
  })

  return wrapper
}

function toRefs(obj) {
  const ret = {}
  for (const key in obj) {
    ret[key] = toRef(obj, key)
  }

  return ret
}

/**
 * 自动脱ref
 * @param {Object} target 需要脱ref的对象 
 */
function proxyRefs(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver)
      return value.__v_isRef_ ? value.value : value
    },
    set(target, key, newVal, receiver) {
      const value = target[key]
      // 如果值是 Ref,则设置其对应的 value 属性值
      if (value.__v_isRef_) {
        value.value = newVal
        return true
      }
      return Reflect.set(target, key, newVal, receiver)
    }
  })
}

// 使用proxyRefs
const MyComponent = {
  setup() {
    const count = ref(0)
    // 返回这个对象会传递给 proxyRefs
    return { count }
  }
}