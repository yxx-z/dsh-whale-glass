/** 鲸蓝玻璃客户端：使用原生深色主题；图片只画在 body 背景上，没有覆盖聊天的全屏元素。 */
window.__ModuleLoader__.load({
  id: 'dsh-whale-glass',
  factory: (require) => {
    const React = require('react');
    const h = React.createElement;
    const API = '/whale-glass';
    const THEME = 'whale-glass-dark';
    const MARKER = 'data-whale-glass';

    /** 图片地址只来自宿主验证过的编号，并进行 URL 编码。 */
    function imageUrl(id) { return API + '/image?id=' + encodeURIComponent(id) + '&v=1.0.2'; }

    /** 生成原生主题覆盖值；只修改背景和边框，不反转全局色阶或文本颜色。 */
    function tokens(config) {
      const alpha = (1 - config.glassTransparency / 100).toFixed(3);
      const surface = `rgba(8,12,19,${alpha})`;
      const values = {
        '--dsw-alias-bg-base': 'transparent',
        '--dsw-alias-bg-layer-1': surface,
        '--dsw-alias-bg-layer-2': 'rgba(14,19,28,.84)',
        '--dsw-alias-bg-layer-3': 'rgba(18,24,35,.92)',
        '--dsw-specific-sidebar-fill': surface,
        '--dsw-specific-input-major': surface,
        '--dsw-specific-bubble': surface,
        '--dsw-alias-bg-module-platform': surface,
        '--dsw-alias-settings-card-fill': surface,
        '--dsw-specific-menu': 'rgba(14,19,28,.96)',
        '--dsw-alias-bg-overlay': 'rgba(14,19,28,.96)',
        '--dsw-alias-markdown-code-block': 'rgba(8,12,19,.88)',
        '--dsw-alias-markdown-code-block-banner': 'rgba(18,24,35,.92)',
        '--dsw-alias-border-l3': 'rgba(174,210,255,.14)',
      };
      return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { light: value, dark: value }]));
    }

    /** 只模糊侧栏与原生输入卡片；不能用 composer 类名前缀匹配，否则会命中全宽外层并重复模糊。 */
    function buildCss(config) {
      const size = config.imageFit === 'height' ? `auto ${config.imageScale}vh` : config.imageFit;
      const dim = (1 - config.imageOpacity / 100).toFixed(3);
      const mask = (config.readability / 100).toFixed(3);
      const edge = (config.highlights / 500).toFixed(3);
      const alpha = (1 - config.glassTransparency / 100).toFixed(3);
      return `
body[${MARKER}] {
  background-color:#000 !important;
  background-image:linear-gradient(rgba(0,0,0,${dim}),rgba(0,0,0,${dim})),linear-gradient(90deg,rgba(0,0,0,.94),rgba(0,0,0,${mask}) 52%,rgba(0,0,0,.06) 100%),url("${imageUrl(config.image)}") !important;
  background-size:100% 100%,100% 100%,${size} !important;
  background-position:center,center,${config.imageX}% ${config.imageY}% !important;
  background-repeat:no-repeat !important;
  background-attachment:fixed !important;
}
body[${MARKER}] [class*="_sidebarCol"],body[${MARKER}] [class*="_rightbarCol"] {
  background:linear-gradient(135deg,rgba(187,221,255,${edge}),transparent 40%),rgba(4,7,12,${alpha}) !important;
  backdrop-filter:blur(${config.blur}px) saturate(135%);
  -webkit-backdrop-filter:blur(${config.blur}px) saturate(135%);
  box-shadow:inset -1px 0 rgba(190,220,255,${edge});
}
body[${MARKER}] [data-composer-card] {
  backdrop-filter:blur(${config.blur}px) saturate(135%);
  -webkit-backdrop-filter:blur(${config.blur}px) saturate(135%);
  box-shadow:inset 0 1px rgba(220,235,255,${edge});
}
body[${MARKER}] [role="dialog"] {background-color:rgba(7,11,18,.94);}
@media(prefers-reduced-transparency:reduce) {
  body[${MARKER}] [class*="_sidebarCol"],body[${MARKER}] [class*="_rightbarCol"],body[${MARKER}] [data-composer-card] {background:rgba(8,12,19,.96) !important;backdrop-filter:none;-webkit-backdrop-filter:none;}
}`;
    }

    const PANEL_CSS = `
.wg-panel{max-width:760px;min-width:0;border:0;margin:0;padding:8px 4px 30px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.6}
.wg-image-card{min-width:0;display:flex;flex-direction:column;gap:5px}.wg-panel .wg-delete{align-self:flex-end;padding:3px 10px;font-size:12px;color:#e88484}.wg-panel button:disabled{cursor:wait;opacity:.55}
.wg-panel *{box-sizing:border-box}.wg-panel h2{font-size:21px;margin:0 0 3px;font-weight:600}.wg-panel h3{font-size:14px;margin:22px 0 10px}
.wg-panel p{color:var(--dsw-alias-label-secondary);margin:5px 0 16px}.wg-panel button,.wg-panel select{font:inherit;color:inherit;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l3);border-radius:10px;padding:8px 12px;cursor:pointer}
.wg-panel button:hover{border-color:#78b9ff}.wg-panel button:focus-visible,.wg-panel input:focus-visible,.wg-panel select:focus-visible{outline:2px solid #78b9ff;outline-offset:3px}
.wg-head{display:flex;justify-content:space-between;align-items:center;gap:16px}.wg-toggle{display:flex;align-items:center;gap:8px;white-space:nowrap}.wg-panel input[type=checkbox]{accent-color:#6dafff;width:17px;height:17px}
.wg-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.wg-panel .wg-image{padding:0;overflow:hidden;text-align:left;background:#03070d;position:relative;border:2px solid transparent;color:#e6f0ff}.wg-panel .wg-image[aria-pressed=true]{border-color:#70b5ff}
.wg-image img{display:block;width:100%;height:112px;object-fit:cover;object-position:right center;background:#000}.wg-image span{display:block;padding:6px 10px}.wg-image[aria-pressed=true] span:after{content:' ✓';color:#70b5ff}
.wg-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.wg-controls{border:1px solid var(--dsw-alias-border-l3);border-radius:14px;padding:3px 16px;background:var(--dsw-alias-settings-card-fill)}
.wg-range{display:grid;grid-template-columns:132px minmax(70px,1fr) 50px;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--dsw-alias-border-l3)}.wg-range:last-child{border-bottom:0}.wg-range input{width:100%;accent-color:#76b8ff}.wg-range output{text-align:right;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary)}
.wg-status{min-height:24px;color:var(--dsw-alias-label-secondary);font-size:12px}.wg-status[data-error=true]{color:#ff8787}.wg-fit{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0}.wg-footer{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.wg-panel small{color:var(--dsw-alias-label-secondary)}
@media(max-width:640px){.wg-range{grid-template-columns:100px minmax(60px,1fr) 42px;gap:7px}.wg-head{align-items:flex-start}.wg-image img{height:85px}}
`;

    /** 创建可撤销视觉层；退出插件、关闭开关时恢复原主题且移除自己的样式。 */
    function createVisual(theme, doc) {
      let style = null, dropTokens = null, unregister = null, previous = null, active = false, pendingTheme = false;
      /** 原生设置异步到达会覆盖临时主题；在本次事件投影完成后重新应用，避免嵌套事件反序。 */
      function syncTheme() {
        if (!active || theme.getTheme().preference === THEME) return;
        previous = theme.getTheme().preference;
        if (pendingTheme) return;
        pendingTheme = true;
        queueMicrotask(() => {
          pendingTheme = false;
          if (active && theme.getTheme().preference !== THEME) theme.setTheme(THEME);
        });
      }
      /** 撤销恰好由本插件拥有的主题层；不改其他插件 token。 */
      function clear() {
        const wasActive = active;
        active = false; // 先解除主题同步，撤销产生的事件不能重新激活插件。
        doc.body.removeAttribute(MARKER);
        style?.remove(); style = null;
        dropTokens?.(); dropTokens = null;
        if (wasActive && theme.getTheme().preference === THEME) theme.setTheme(previous || 'system');
        unregister?.(); unregister = null; active = false; previous = null;
      }
      /** 应用预览；任何异常均撤销，不能把用户锁在不可读的界面。 */
      function render(config) {
        if (!config.enabled) { clear(); return; }
        try {
          if (!active) {
            previous = theme.getTheme().preference;
            unregister = theme.register({ id: THEME, colorScheme: 'dark', tokens: {} });
            active = true;
            theme.setTheme(THEME);
          }
          const nextDrop = theme.overrideTokens('dsh-whale-glass', tokens(config));
          dropTokens?.(); dropTokens = nextDrop;
          if (!style) { style = doc.createElement('style'); style.dataset.pluginCss = 'dsh-whale-glass/appearance'; doc.head.appendChild(style); }
          style.textContent = buildCss(config);
          doc.body.setAttribute(MARKER, '');
          syncTheme();
        } catch (error) { clear(); throw error; }
      }
      return { render, clear, syncTheme };
    }

    /** 启动配置控制器与设置槽位；网络请求、定时器、注册和样式统一绑定生命周期。 */
    function apply(ctx) {
      const visual = createVisual(ctx.theme, document);
      const abort = new AbortController();
      let disposed = false, timer = null, queue = Promise.resolve(), revision = 0;
      let state = { config: null, images: [], status: '正在读取设置…', error: false, uploading: false, busy: false, deleted: null };
      const listeners = new Set();
      /** 广播不可变状态，设置页关闭后不保留 React 订阅。 */
      function publish(patch) { state = { ...state, ...patch }; for (const listener of listeners) listener(state); }
      /** 请求仅发往本机同源插件路由，错误在设置面板内呈现。 */
      async function request(path, options = {}) {
        const response = await fetch(API + path, { ...options, signal: abort.signal, cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || '操作未完成');
        return result;
      }
      /** 串行保存，防止拖动滑块时旧请求晚完成覆盖新值；最后一次修改一定入队。 */
      function persist(config, version) {
        queue = queue.catch(() => {}).then(async () => {
          if (disposed) return;
          await request('/config', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Whale-Glass': '1' }, body: JSON.stringify(config) });
          if (!disposed && version === revision) publish({ status: '已保存 · 立即生效', error: false });
        }).catch(error => {
          if (!disposed && version === revision) publish({ status: '未保存：' + error.message + '。点击「重试保存」。', error: true });
        });
      }
      /** 即时预览与防抖持久化分开；关闭开关立即恢复原 UI。 */
      function change(patch) {
        if (!state.config || disposed || state.busy) return;
        const config = { ...state.config, ...patch };
        try { visual.render(config); }
        catch { publish({ status: '当前版本不支持此主题，已恢复原界面', error: true }); return; }
        revision++;
        publish({ config, status: '正在保存…', error: false });
        clearTimeout(timer);
        timer = setTimeout(() => persist(config, revision), 250);
      }
      /** 导入前先让浏览器解码图片，避免无效文件进入用户图库。 */
      async function upload(file) {
        if (!file || disposed) return;
        publish({ uploading: true, status: '正在导入图片…', error: false });
        try {
          if (file.size > 20 * 1024 * 1024) throw new Error('图片最大 20 MB');
          const bitmap = await createImageBitmap(file); bitmap.close();
          const data = await request('/upload', { method: 'POST', headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Whale-Glass': '1' }, body: file });
          if (disposed) return;
          publish({ images: data.images }); change({ image: data.id });
        } catch (error) { if (!disposed) publish({ status: '导入失败：' + error.message, error: true }); }
        finally { if (!disposed) publish({ uploading: false }); }
      }

      /** 删除与撤销共用串行边界：先保存最后一次预览，再修改图库，避免延迟保存重新选中已删除图。 */
      async function editImage(id, restore = false) {
        if (disposed || state.busy || state.uploading || !state.config) return;
        clearTimeout(timer); revision++;
        const config = { ...state.config };
        publish({ busy: true, status: restore ? '正在恢复图片…' : '正在删除图片…', error: false });
        try {
          await queue;
          if (disposed) return;
          await request('/config', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Whale-Glass': '1' }, body: JSON.stringify(config) });
          const data = await request(restore ? '/restore' : '/delete', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Whale-Glass': '1' }, body: JSON.stringify({ id }) });
          if (disposed) return;
          visual.render(data.config);
          publish({ config: data.config, images: data.images, deleted: restore ? null : id,
            status: restore ? '图片已恢复到图库' : config.image === id ? '已删除，并切回默认鲸娘图；可撤销' : '图片已删除；可撤销', error: false });
        } catch (error) {
          if (!disposed) publish({ status: (restore ? '恢复失败：' : '删除失败：') + error.message, error: true });
        } finally { if (!disposed) publish({ busy: false }); }
      }

      /** 原生设置区组件：预设图库、上传、位置和玻璃参数以及可逆关闭开关。 */
      function Settings() {
        const [view, setView] = React.useState(state);
        const uploadRef = React.useRef(null);
        React.useEffect(() => { listeners.add(setView); setView(state); return () => listeners.delete(setView); }, []);
        const c = view.config;
        if (!c) return h('div', { className: 'wg-panel' }, view.status);
        /** 渲染带可访问名称和实时数值的滑块。 */
        function range(key, label, min, max, unit = '%') {
          return h('label', { className: 'wg-range', key }, h('span', null, label),
            h('input', { type: 'range', min, max, step: 1, value: c[key], 'aria-label': label,
              onChange: event => change({ [key]: Number(event.target.value) }) }), h('output', null, c[key] + unit));
        }
        return h('fieldset', { className: 'wg-panel', 'aria-label': '鲸蓝玻璃设置', disabled: view.busy || view.uploading },
          h('div', { className: 'wg-head' }, h('div', null, h('h2', null, '鲸蓝玻璃'), h('p', null, '纯黑底色 · 透光玻璃 · 蓝色鲸娘')),
            h('label', { className: 'wg-toggle' }, h('input', { type: 'checkbox', checked: c.enabled, onChange: event => change({ enabled: event.target.checked }) }), '启用背景')),
          h('div', { className: 'wg-status', role: 'status', 'data-error': view.error }, view.status),
          view.deleted ? h('button', { type: 'button', onClick: () => editImage(view.deleted, true) }, '撤销上次删除') : null,
          h('h3', null, '选择图片'),
          h('div', { className: 'wg-gallery' }, view.images.map(image => h('div', { key: image.id, className: 'wg-image-card' },
            h('button', { className: 'wg-image', type: 'button', 'aria-pressed': c.image === image.id, onClick: () => change({ image: image.id }) },
              h('img', { src: imageUrl(image.id), alt: image.label, loading: 'lazy' }), h('span', null, image.label)),
            !image.builtin ? h('button', { className: 'wg-delete', type: 'button', 'aria-label': '删除' + image.label, onClick: () => editImage(image.id) }, '删除图片') : null))),
          h('div', { className: 'wg-toolbar' }, h('input', { ref: uploadRef, type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', style: { display: 'none' }, onChange: event => { upload(event.target.files?.[0]); event.target.value = ''; } }),
            h('button', { type: 'button', disabled: view.uploading, onClick: () => uploadRef.current?.click() }, view.uploading ? '导入中…' : '＋ 上传自己的图片')),
          h('small', null, '支持 PNG / JPEG / WebP / GIF，最大 20 MB。图片仅保存在本机。'),
          h('h3', null, '玻璃与可读性'),
          h('div', { className: 'wg-controls' }, range('imageOpacity', '图片不透明度', 0, 100), range('glassTransparency', '玻璃透明度', 0, 90), range('blur', '玻璃模糊', 0, 40, ' px'), range('readability', '文字区暗幕', 0, 95), range('highlights', '玻璃边缘高光', 0, 100)),
          h('h3', null, '图片位置'),
          h('div', { className: 'wg-controls' }, h('label', { className: 'wg-fit' }, h('span', null, '适配方式'),
            h('select', { value: c.imageFit, 'aria-label': '适配方式', onChange: event => change({ imageFit: event.target.value }) },
              h('option', { value: 'height' }, '按高度 · 可缩放'), h('option', { value: 'cover' }, '铺满窗口'), h('option', { value: 'contain' }, '完整显示'))),
            c.imageFit === 'height' ? range('imageScale', '角色缩放', 50, 180) : null, range('imageX', '水平位置（右）', 0, 100), range('imageY', '垂直位置（下）', 0, 100)),
          h('div', { className: 'wg-footer' }, h('button', { type: 'button', onClick: () => change({ image: 'portrait', imageOpacity: 72, glassTransparency: 58, blur: 22, readability: 62, imageScale: 100, imageX: 100, imageY: 50, imageFit: 'height', highlights: 45 }) }, '恢复推荐参数'),
            h('button', { type: 'button', onClick: () => change({ enabled: false }) }, '关闭并恢复原界面'),
            view.error ? h('button', { type: 'button', onClick: () => change({}) }, '重试保存') : null));
      }

      ctx.effect(() => {
        const style = document.createElement('style'); style.dataset.pluginCss = 'dsh-whale-glass/settings'; style.textContent = PANEL_CSS; document.head.appendChild(style);
        return () => { disposed = true; abort.abort(); clearTimeout(timer); listeners.clear(); visual.clear(); style.remove(); };
      });
      ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'whale-glass', order: 27, label: '鲸蓝玻璃' }, Settings)));
      ctx.effect(() => ctx.on('theme/change', visual.syncTheme));
      request('/state').then(data => {
        if (disposed) return;
        visual.render(data.config);
        publish({ config: data.config, images: data.images, status: '已保存 · 立即生效', error: false });
      }).catch(() => { if (!disposed) { visual.clear(); publish({ status: '背景载入失败，原界面已保留；请重启插件后重试。', error: true }); } });
    }

    return { name: 'dsh-whale-glass', inject: ['slots', 'theme'], apply,
      __test: { buildCss, tokens, createVisual } };
  }
});
