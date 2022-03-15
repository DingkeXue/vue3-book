/*
 * @Author: dingke
 * @Date: 2022-03-15 23:36:06
 * @Description: 渲染器：支持组件
 */
const MyComponent = {
  // 返回 Vnode
  render() {
    return {
      tag: 'div',
      props: {
        class: 'test',
        onClick: () => alert('hello')
      },
      children: [
        { tag: 'span', props: null, children: 'world' }
      ]
    }
  }
}

// Vnode
const vonde = {
  tag: MyComponent
}

/**
 * 渲染器
 * @param {Object} vnode 虚拟对象
 * @param {HTMLNode} container 挂载容器
 */
function renderer(vnode, container) {
  if(typeof vnode.tag === 'string') {
    mountElement(vnode, container)
  } else if (typeof vnode.tag === 'function') {
    mountComponent(vnode, container)
  }
}

// 挂载普通 Vnode
function mountElement(vnode, contaier) {
  const el = document.createElement(vnode.tag)
  // 处理属性
  for (const key in vnode.props) {
    if (key.startsWith('on')) {
      el.addEventListener(key.slice(2).toLowerCase(), vnode.props[key])
    } else {
      el.setAttribute(key, vnode.props[key])
    }
  }
  // 处理children
  if (typeof vnode.children === 'string') {
    const text = document.createTextNode(vnode.children)
    el.appendChild(text)
  } else if (Array.isArray(vnode.children)) {
    vnode.children.forEach(child => mountElement(child))
  }

  contaier.appendChild(vnode)
}

// 挂载组件
function mountComponent(vnode, container) {
  const subtree = vnode.tag.render()
  mountElement(subtree, container)
}