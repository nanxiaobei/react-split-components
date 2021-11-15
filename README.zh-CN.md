# React Split Components (RiC)

一种全新的 React 函数组件写法，再不需要 Hooks。

[English](./README.md) | 简体中文

---

## 介绍

[React Split Components 介绍 →](./INTRODUCTION.zh-CN.md)

闭包模式的 React 函数组件。

像写 Svelte 一样写 React，最自然流畅的代码。

## 特点

- 解除对 Hooks 的依赖，但不是指纯函数组件
- 仅在写法层面，无需 ESLint 支持
- 类似高阶组件，是一种 "设计模式"，非 API，无需库支持

## 简单示例

```jsx
function demo({ atom }) {
  const state = atom({
    count: 0,
  });

  const onClick = () => {
    state.count += 1;
  };

  return () => {
    const { count } = state;
    return (
      <>
        <h1>{count}</h1>
        <button onClick={onClick}>Click me</button>
      </>
    );
  };
}

const Demo = create(demo);
```

## 完整示例

```jsx
function demo({ props, atom, onMount, onEffect }) {
  const state = atom({
    // for useState
    loading: true,
    data: null,
    count: 0,

    // for useMemo
    power: () => state.count * state.count,
    text: () => `${props.theme} ~ ${state.count}`,
  });

  // for useRef
  const countRef = { current: null };

  // for useCallback
  const onClick = () => {
    const { setTheme } = props;
    setTheme();
    state.count += 1;
  };

  const getData = () => {
    request().then((res) => {
      state.data = res.data;
      state.loading = false;
    });
  };

  // for useEffect
  onMount(() => {
    getData();
    console.log('mount!');

    return () => {
      console.log('unmount!');
    };
  });

  onEffect(state.power, (val, prevVal) => {
    console.log('enter state.power', val, prevVal);

    return () => {
      console.log('clear state.power', val, prevVal);
    };
  });

  const onReload = () => {
    state.loading = true;
    getData();
  };

  return () => {
    const { theme } = props;
    const { loading, data, count, power, text } = state;

    return (
      <>
        <h1>{loading ? 'loading...' : JSON.stringify(data)}</h1>
        <button onClick={onReload}>Reload data</button>
        <h1>{theme}</h1>
        <h1 ref={countRef}>{count}</h1>
        <h1>{power}</h1>
        <h1>{text}</h1>
        <button onClick={onClick}>Click me</button>
      </>
    );
  };
}

const Demo = create(demo);
```

## 在线演示

[![Edit react-split-components-final](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/react-split-components-final-9ftjx?fontsize=14&hidenavigation=1&theme=dark)

## 辅助函数

`create` 实现示例：

```js
const create = (fn) => (props, ref) => {
  const [, setState] = useState(false);
  const mountCallback = useRef();

  const propsProxy = useRef({});
  const stateTarget = useRef({});
  const deriveState = useRef({});

  const deriveMap = useRef({});
  const deriveRefresh = useRef({});

  const effectSource = useRef({});
  const effectRunning = useRef([]);

  useMemo(() => {
    Object.assign(propsProxy.current, props);
  }, [props]);

  Object.keys(deriveRefresh.current).forEach((key) => {
    const val = deriveState.current[key]();
    stateTarget.current[key] = val;

    const uniqueId = `state.${key}`;
    const effectData = effectSource.current[uniqueId];
    if (effectData) {
      effectData.params = [val, effectData.params[0]];
      effectRunning.current.push(uniqueId);
    }
  });

  deriveRefresh.current = {};

  useEffect(() => {
    effectRunning.current.forEach((uniqueId) => {
      const { clear } = effectSource.current[uniqueId];
      if (typeof clear === 'function') clear();
    });
  });

  useEffect(() => {
    effectRunning.current.forEach((uniqueId) => {
      const { fn, params } = effectSource.current[uniqueId];
      effectSource.current[uniqueId].clear = fn(...params);
    });
    effectRunning.current = [];
  });

  useEffect(() => {
    return () => {
      Object.values(effectSource.current).forEach(({ clear }) => {
        if (typeof clear === 'function') clear();
      });
      effectSource.current = {};
    };
  }, []);

  useEffect(() => mountCallback.current?.(), []);

  const [ins] = useState(() => {
    let curUniqueId = null;
    let curDerivePair = null;

    const createHandler = (type) => ({
      get(target, key) {
        curUniqueId = `${type}.${key}`;
        if (curDerivePair) {
          if (!deriveMap.current[curUniqueId]) {
            deriveMap.current[curUniqueId] = {};
          }
          const [deriveKey, deriveGetter] = curDerivePair;
          deriveMap.current[curUniqueId][deriveKey] = deriveGetter;
        }
        return target[key];
      },
      set(target, key, val) {
        if (val !== target[key]) {
          const uniqueId = `${type}.${key}`;
          const deriveData = deriveMap.current[uniqueId];
          if (deriveData) {
            Object.assign(deriveRefresh.current, deriveData);
          }
          const effectData = effectSource.current[uniqueId];
          if (effectData) {
            effectData.params = [val, target[key]];
            effectRunning.current.push(uniqueId);
          }
        }
        target[key] = val;
        if (type === 'state') setState((s) => !s);
        return true;
      },
    });

    const propsHandler = createHandler('props');
    const stateHandler = createHandler('state');

    propsProxy.current = new Proxy(propsProxy.current, propsHandler);

    const atom = (initState) => {
      Object.entries(initState).forEach(([key, val]) => {
        if (typeof val === 'function') deriveState.current[key] = val;
        stateTarget.current[key] = val;
      });
      return new Proxy(stateTarget.current, stateHandler);
    };

    const onEffect = (val, fn) => {
      if (effectSource.current[curUniqueId]) {
        throw new Error(`${curUniqueId} effect is already exist`);
      }
      effectSource.current[curUniqueId] = { params: [val], fn };
      effectRunning.current.push(curUniqueId);
      curUniqueId = null;
    };

    const onMount = (fn) => {
      mountCallback.current = fn;
    };

    const res = fn({ props: propsProxy.current, atom, onMount, onEffect });

    Object.entries(deriveState.current).forEach(([key, getter]) => {
      curDerivePair = [key, getter];
      const val = getter();
      curDerivePair = null;

      stateTarget.current[key] = val;
      const effectData = effectSource.current[`state.${key}`];
      if (effectData) effectData.params = [val];
    });

    const get = (target, key) => target[key];
    propsHandler.get = get;
    stateHandler.get = get;
    return res;
  });

  return ins(props, ref);
};

// const Demo = create(demo);
// const Demo = memo(create(demo)); // if memo
// const Demo = forwardRef(create(demo)); // if forwardRef
```

## 协议

[MIT License](https://github.com/nanxiaobei/react-split-components/blob/main/LICENSE) (c) [nanxiaobei](https://lee.so/)

## FUTAKE

试试 [**FUTAKE**](https://sotake.com/f) 小程序，你的灵感相册。🌈

![FUTAKE](https://s3.jpg.cm/2021/09/21/IFG3wi.png)
