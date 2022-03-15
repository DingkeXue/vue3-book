/*
 * @Author: dingke
 * @Date: 2022-03-15 23:00:41
 * @Description: 渲染器:将虚拟node生成真实node
 */
/**
 * 
 * @param {object} vnode 虚拟node节点
 * @param {HTMLBodyElement} container 挂载位置 
 */
function renderer(vnode, container) {
  const el = document.createElement(vnode.tag)
  // 遍历属性
  for (const key in vnode.props) {
    if (key.startsWith('on')) {
      el.addEventListener(key.slice(2).toLowerCase(), vnode.props[key])
    } else {
      el.setAttribute(key, vnode.props[key])
    }
  }

  // 处理子节点
  if (typeof vnode.children === 'string') {
    const text = document.createTextNode(vnode.children)
    el.appendChild(text)
  } else if (Array.isArray(vnode.children)) {
    vnode.children.forEach(child => renderer(child, el))
  }

  container.appendChild(el)
}

const vnode = {
  tag: 'div',
  props: {
    class: 'test',
    onClick: () => alert('hello')
  },
  children: [
    { tag: 'span', props: null, children: 'word' }
  ]
}

renderer(vnode, document.body)