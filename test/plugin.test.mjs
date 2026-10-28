import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import vm from 'node:vm';
import { DEFAULTS, createStore, validateConfig, imageType, apply } from '../lib/index.js';

/** 拒绝越界、路径穿越和未知设置，确保输入不能逃出图片目录或进入任意 CSS。 */
test('配置验证拒绝路径、非法数值和不支持的参数', () => {
  for (const patch of [{ blur: -1 }, { blur: Infinity }, { image: '../secret.png' }, { imageOpacity: '50' }, { enabled: 1 }, { imageFit: 'url(x)' }, { extra: true }]) {
    assert.throws(() => validateConfig(patch));
  }
  assert.equal(validateConfig({ blur: 24 }).blur, 24);
});

/** 导入与保存失败均不得覆盖现有配置，损坏配置不能阻止宿主启动。 */
test('存储保持独立、原子保存且拒绝非图片', () => {
  const dir = mkdtempSync(join(tmpdir(), 'whale-store-'));
  try {
    const store = createStore(dir);
    assert.deepEqual(store.read(), DEFAULTS);
    assert.equal(store.list().length, 2);
    const bytes = readFileSync(new URL('../assets/portrait.png', import.meta.url));
    const id = store.upload(bytes);
    assert.equal(store.list().length, 3);
    assert.deepEqual(readFileSync(store.resolveImage(id)), bytes);
    store.save({ image: id, blur: 31 });
    assert.equal(store.read().blur, 31);
    assert.throws(() => store.save({ image: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png' }));
    assert.equal(store.read().image, id);
    assert.throws(() => imageType(Buffer.from('<svg onload="alert(1)">')));
    writeFileSync(join(dir, 'config.json'), '{bad');
    assert.deepEqual(store.read(), DEFAULTS);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

/** 删除仅移入插件回收区；当前图安全回退，撤销不抢占背景，内置图不可删除。 */
test('自选图片可删除和恢复，当前图片删除后回退且不改变其他设置', () => {
  const dir = mkdtempSync(join(tmpdir(), 'whale-delete-'));
  try {
    const store = createStore(dir);
    const bytes = readFileSync(new URL('../assets/portrait.png', import.meta.url));
    const id = store.upload(bytes), inactive = store.upload(bytes);
    store.save({ image: id, blur: 31 });
    assert.equal(store.remove(inactive).config.image, id);
    const result = store.remove(id);
    assert.equal(result.config.image, 'portrait');
    assert.equal(result.config.blur, 31);
    assert.equal(result.images.length, 2);
    assert.deepEqual(readFileSync(join(dir, 'trash', id)), bytes);
    assert.throws(() => store.save({ image: id }));
    assert.throws(() => store.remove(id));
    for (const invalid of ['portrait', 'ocean', '../config.json', undefined]) {
      assert.throws(() => store.remove(invalid));
      assert.throws(() => store.restore(invalid));
    }
    store.save({ image: 'ocean' });
    const restored = store.restore(id);
    assert.equal(restored.config.image, 'ocean');
    assert.equal(restored.images.length, 3);
    assert.deepEqual(readFileSync(store.resolveImage(id)), bytes);
    assert.throws(() => store.restore(id));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

/** 真实 HTTP 验证请求头保护、参数校验、二进制上传与读取以及路由撤销。 */
test('HTTP 路由可读取、保存和上传，拒绝越界及跨站表单请求', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'whale-http-'));
  const oldHome = process.env.DSH_HOME; process.env.DSH_HOME = dir;
  const routes = new Map(); const cleanup = [];
  apply({ effect(fn) { cleanup.push(fn()); }, webServer: { register({ path, handler }) { routes.set(path, handler); return () => routes.delete(path); } } });
  const server = createServer((req, res) => {
    const handler = routes.get(new URL(req.url, 'http://localhost').pathname);
    if (handler) handler(req, res); else { res.statusCode = 404; res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/whale-glass`;
  try {
    const initial = await (await fetch(base + '/state')).json(); assert.equal(initial.images.length, 2);
    assert.equal((await fetch(base + '/config', { method: 'POST', body: '{}' })).status, 403);
    const headers = { 'X-Whale-Glass': '1', 'Content-Type': 'application/json' };
    const saved = await (await fetch(base + '/config', { method: 'POST', headers, body: JSON.stringify({ enabled: false, blur: 30 }) })).json();
    assert.equal(saved.config.enabled, false); assert.equal(saved.config.blur, 30);
    assert.equal((await fetch(base + '/image?id=..%2Fconfig.json')).status, 400);
    const bytes = readFileSync(new URL('../assets/portrait.png', import.meta.url));
    const uploaded = await (await fetch(base + '/upload', { method: 'POST', headers: { 'X-Whale-Glass': '1' }, body: bytes })).json();
    assert.equal(uploaded.images.length, 3);
    const image = await fetch(base + '/image?id=' + uploaded.id);
    assert.equal(image.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), bytes);
    const deletion = { method: 'POST', headers, body: JSON.stringify({ id: uploaded.id }) };
    assert.equal((await fetch(base + '/delete', { ...deletion, headers: {} })).status, 403);
    await fetch(base + '/config', { method: 'POST', headers, body: JSON.stringify({ image: uploaded.id }) });
    const deleted = await (await fetch(base + '/delete', deletion)).json();
    assert.equal(deleted.config.image, 'portrait');
    assert.equal(deleted.images.length, 2);
    assert.equal((await fetch(base + '/image?id=' + uploaded.id)).status, 400);
    assert.equal((await fetch(base + '/restore', { ...deletion, headers: {} })).status, 403);
    const restored = await (await fetch(base + '/restore', deletion)).json();
    assert.equal(restored.images.length, 3);
    assert.equal(restored.config.image, 'portrait');
    assert.equal((await fetch(base + '/upload', { method: 'POST', headers: { 'X-Whale-Glass': '1' }, body: '<script>no</script>' })).status, 400);
  } finally {
    for (const dispose of cleanup) dispose(); assert.equal(routes.size, 0);
    await new Promise(resolve => server.close(resolve));
    if (oldHome === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = oldHome;
    rmSync(dir, { recursive: true, force: true });
  }
});

/** 加载真实客户端工厂，但使用最小 DOM 与主题服务以验证资源所有权。 */
function clientHarness() {
  let client;
  vm.runInNewContext(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load({ factory }) { client = factory(() => ({})); } } },
    console, URL, encodeURIComponent, queueMicrotask,
  });
  const nodes = new Set(), attrs = new Set(), layers = new Map([['another-plugin', { untouched: true }]]);
  let preference = 'light'; const registered = new Set();
  const theme = {
    getTheme() { return { preference }; },
    setTheme(id) { preference = id; },
    register(definition) { assert.equal(definition.colorScheme, 'dark'); registered.add(definition.id); return () => registered.delete(definition.id); },
    overrideTokens(id, values) { layers.set(id, values); return () => { if (layers.get(id) === values) layers.delete(id); }; },
  };
  const document = {
    body: { setAttribute(key) { attrs.add(key); }, removeAttribute(key) { attrs.delete(key); } },
    createElement(tag) { assert.equal(tag, 'style'); const node = { dataset: {}, remove() { nodes.delete(node); } }; return node; },
    head: { appendChild(node) { nodes.add(node); } },
  };
  return { client, theme, document, nodes, attrs, layers, registered };
}

/** 反复调整只保留一个样式层；关闭恢复主题且不移除其他插件覆盖。 */
test('视觉层反复更新、关闭和清理完全可逆', () => {
  const env = clientHarness(); const visual = env.client.__test.createVisual(env.theme, env.document);
  for (let blur = 0; blur <= 40; blur++) visual.render({ ...DEFAULTS, blur });
  assert.equal(env.nodes.size, 1); assert.equal(env.registered.size, 1);
  assert.equal(env.theme.getTheme().preference, 'whale-glass-dark');
  visual.render({ ...DEFAULTS, enabled: false }); visual.clear();
  assert.equal(env.theme.getTheme().preference, 'light');
  assert.equal(env.nodes.size, 0); assert.equal(env.attrs.size, 0); assert.equal(env.registered.size, 0);
  assert.equal(env.layers.size, 1); assert.ok(env.layers.has('another-plugin'));
});

/** 模拟启动后到达的原生主题同步；保持深色，关闭时还原最新原生偏好。 */
test('启动后异步主题同步不会产生黑底黑字，关闭不会被待处理任务重新激活', async () => {
  const env = clientHarness(); const visual = env.client.__test.createVisual(env.theme, env.document);
  visual.render(DEFAULTS);
  env.theme.setTheme('light'); visual.syncTheme();
  await Promise.resolve();
  assert.equal(env.theme.getTheme().preference, 'whale-glass-dark');
  env.theme.setTheme('system'); visual.syncTheme();
  visual.clear();
  await Promise.resolve();
  assert.equal(env.theme.getTheme().preference, 'system');
  assert.equal(env.nodes.size, 0); assert.equal(env.layers.size, 1);
});

/** 验证旧配置升级及侧栏独立调节，不影响已有输入框参数。 */
test('旧配置自动获得独立透明侧栏，侧栏内层不叠加底色', () => {
  const dir = mkdtempSync(join(tmpdir(), 'whale-sidebar-'));
  try {
    writeFileSync(join(dir, 'config.json'), JSON.stringify({ image: 'ocean', blur: 22, glassTransparency: 58 }));
    const store = createStore(dir);
    const config = store.read();
    assert.equal(config.image, 'ocean');
    assert.equal(config.sidebarTransparency, 100); assert.equal(config.sidebarBlur, 0);
    store.save({ sidebarTransparency: 0, sidebarBlur: 10 });
    assert.equal(store.read().blur, 22); assert.equal(store.read().glassTransparency, 58);
    assert.throws(() => store.save({ sidebarTransparency: 101 }));
    assert.throws(() => store.save({ sidebarBlur: -1 }));
    const { client } = clientHarness();
    assert.equal(client.__test.tokens(config)['--dsw-specific-sidebar-fill'].dark, 'transparent');
    const css = client.__test.buildCss(config);
    assert.ok(css.includes('background:rgba(4,7,12,0.000)'));
    assert.ok(!css.includes('rgba(0,0,0,.94)'));
    assert.ok(client.__test.buildCss(store.read()).includes('background:rgba(4,7,12,1.000)'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

/** 背景只写 CSS；没有固定全屏覆盖层，也没有反转全局色阶。 */
test('样式没有覆盖层和全局反色，0% 与 100% 透明度端点有效', () => {
  const { client } = clientHarness();
  const css = client.__test.buildCss({ ...DEFAULTS, imageOpacity: 0 });
  assert.ok(css.includes('rgba(0,0,0,1.000)'));
  assert.ok(!css.includes('z-index')); assert.ok(!css.includes('position:fixed'));
  assert.ok(!css.includes('static-neutral')); assert.ok(css.includes('body[data-whale-glass]'));
  // composerSeat / composerHero / composerStack 均是布局容器，只允许输入卡片获得模糊。
  assert.ok(css.includes('[data-composer-card]'));
  assert.ok(!css.includes('[class*="_composer"]'));
  assert.ok(!css.includes('[class*="_inputCard"]'));
  assert.ok(client.__test.buildCss({ ...DEFAULTS, imageOpacity: 100 }).includes('rgba(0,0,0,0.000)'));
});
