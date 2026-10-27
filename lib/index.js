/** 鲸蓝玻璃宿主：只管理本插件的配置和图片，路由随 Cordis 生命周期撤销。 */
import { mkdirSync, readFileSync, writeFileSync, renameSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const name = 'dsh-whale-glass';
export const inject = ['webServer'];
export const DEFAULTS = Object.freeze({
  enabled: true, image: 'portrait', imageOpacity: 72, glassTransparency: 58,
  blur: 22, readability: 62, imageScale: 100, imageX: 100, imageY: 50,
  imageFit: 'height', highlights: 45,
});
const RANGES = { imageOpacity: [0, 100], glassTransparency: [0, 90], blur: [0, 40],
  readability: [0, 95], imageScale: [50, 180], imageX: [0, 100], imageY: [0, 100], highlights: [0, 100] };
const BUILTINS = [ { id: 'portrait', label: '鲸娘 · 纯黑', file: 'portrait.png' },
  { id: 'ocean', label: '深海 · DeepSeek', file: 'ocean.png' } ];
const MAX_IMAGE = 20 * 1024 * 1024;

/** 验证配置边界；拒绝未知字段，防止不受控值进入 CSS 或文件路径。 */
export function validateConfig(input, base = DEFAULTS) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('配置必须是对象');
  const result = { ...base };
  for (const [key, value] of Object.entries(input)) {
    if (!(key in DEFAULTS)) throw new Error('不支持的设置项');
    if (key in RANGES) {
      const [min, max] = RANGES[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error('设置值超出范围');
      result[key] = Math.round(value);
    } else if (key === 'enabled') {
      if (typeof value !== 'boolean') throw new Error('开关值无效');
      result[key] = value;
    } else if (key === 'imageFit') {
      if (!['height', 'cover', 'contain'].includes(value)) throw new Error('适配方式无效');
      result[key] = value;
    } else if (key === 'image') {
      if (typeof value !== 'string' || !/^(portrait|ocean|[a-f0-9-]{36}\.(png|jpg|webp|gif))$/.test(value)) throw new Error('图片编号无效');
      result[key] = value;
    }
  }
  return result;
}

/** 按文件头识别栅格图片；不接收可执行 SVG、HTML 或任意文件路径。 */
export function imageType(bytes) {
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return ['png', 'image/png'];
  if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return ['jpg', 'image/jpeg'];
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return ['webp', 'image/webp'];
  if (bytes.length >= 13 && /^GIF8[79]a$/.test(bytes.toString('ascii', 0, 6))) return ['gif', 'image/gif'];
  throw new Error('请选择 PNG、JPEG、WebP 或 GIF 图片');
}

/** 读取有限大小请求；超限时停止保留数据，避免把整个大文件留在内存。 */
async function readBody(req, limit) {
  const chunks = []; let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > limit) throw new Error('文件过大，最大支持 20 MB');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/** 创建独立存储实例，可在测试中注入临时目录而不触碰用户配置。 */
export function createStore(root = join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'whale-glass')) {
  const imagesDir = join(root, 'images');
  const trashDir = join(root, 'trash');
  const configFile = join(root, 'config.json');
  const assets = fileURLToPath(new URL('../assets/', import.meta.url));
  /** 将不透明图片编号解析为插件自己的文件；不接受路径或 URL。 */
  function resolveImage(id) {
    validateConfig({ image: id });
    const builtin = BUILTINS.find(item => item.id === id);
    return builtin ? join(assets, builtin.file) : join(imagesDir, id);
  }
  /** 配置损坏时保留原文件并安全回落，宿主启动不因外观配置失败。 */
  function read() {
    try { return validateConfig(JSON.parse(readFileSync(configFile, 'utf8'))); }
    catch { return { ...DEFAULTS }; }
  }
  /** 临时文件加原子替换，写失败时保留上一次可用配置。 */
  function save(patch) {
    const next = validateConfig(patch, read());
    if (!statSync(resolveImage(next.image)).isFile()) throw new Error('图片不存在');
    mkdirSync(root, { recursive: true });
    const temp = join(root, `config-${randomUUID()}.tmp`);
    writeFileSync(temp, JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
    renameSync(temp, configFile);
    return next;
  }
  /** 列出内置及用户导入图片，不扫描其他目录，也不读取其他插件数据。 */
  function list() {
    const result = BUILTINS.map(({ id, label }) => ({ id, label, builtin: true }));
    try {
      for (const item of readdirSync(imagesDir).sort()) {
        if (/^[a-f0-9-]{36}\.(png|jpg|webp|gif)$/.test(item)) result.push({ id: item, label: `自选图片 ${result.length - 1}`, builtin: false });
      }
    } catch { /* 尚未导入图片时不创建目录。 */ }
    return result;
  }
  /** 导入使用随机文件名且不覆盖旧图；失败可重新选择，已有图库不受影响。 */
  function upload(bytes) {
    if (bytes.length > MAX_IMAGE) throw new Error('文件过大，最大支持 20 MB');
    const [ext] = imageType(bytes);
    mkdirSync(imagesDir, { recursive: true });
    const id = `${randomUUID()}.${ext}`;
    writeFileSync(join(imagesDir, id), bytes, { mode: 0o600, flag: 'wx' });
    return id;
  }
  /** 校验可删除的自选图片编号；内置图和外部路径永远不能进入删除或恢复流程。 */
  function customPath(id, directory) {
    validateConfig({ image: id });
    if (BUILTINS.some(item => item.id === id)) throw new Error('不支持删除内置图片');
    return join(directory, id);
  }
  /** 将自选图移入本插件回收区；当前图切回默认，写配置失败则把图片移回。 */
  function remove(id) {
    const source = customPath(id, imagesDir), destination = customPath(id, trashDir);
    const before = read();
    if (!existsSync(source)) throw new Error('图片编号不存在或已删除');
    mkdirSync(trashDir, { recursive: true });
    renameSync(source, destination);
    try {
      const config = before.image === id ? save({ image: 'portrait' }) : before;
      return { config, images: list(), deleted: id };
    } catch (error) {
      renameSync(destination, source);
      throw error;
    }
  }
  /** 撤销删除只恢复图库文件，不抢占用户在删除后选择的背景。 */
  function restore(id) {
    const source = customPath(id, trashDir), destination = customPath(id, imagesDir);
    if (!existsSync(source) || existsSync(destination)) throw new Error('图片编号无法恢复');
    renameSync(source, destination);
    return { config: read(), images: list() };
  }
  return { read, save, list, upload, resolveImage, remove, restore };
}

/** 挂载同源 HTTP 路由；所有写操作要求自定义请求头，阻止跨站表单修改设置。 */
export function apply(ctx) {
  const store = createStore();
  /** 返回受控 JSON，不回显本机路径、请求体或底层异常。 */
  function json(res, status, payload) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(payload));
  }
  /** 将同步或异步错误收敛到本插件，不让图片问题中断 Harness。 */
  function route(path, method, action) {
    ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/whale-glass/' + path,
      handler: async (req, res) => {
        if (req.method !== method) { json(res, 405, { error: '不支持的请求方法' }); return; }
        if (method === 'POST' && req.headers['x-whale-glass'] !== '1') { json(res, 403, { error: '请求来源无效' }); return; }
        const start = Date.now();
        if (method === 'POST') console.info(`[whale-glass] ${path} 开始`);
        try {
          await action(req, res);
          if (method === 'POST') console.info(`[whale-glass] ${path} 完成 ${Date.now() - start}ms`);
        } catch (error) {
          const safe = /^(配置|不支持|设置|开关|适配|图片编号|请选择|文件过大)/.test(error.message) ? error.message : '操作未完成，请重试或重新选择图片';
          console.warn(`[whale-glass] ${path} 失败 ${Date.now() - start}ms`);
          if (!res.headersSent) json(res, 400, { error: safe });
          else res.end();
        }
      }
    }));
  }
  route('state', 'GET', (_req, res) => json(res, 200, { config: store.read(), images: store.list() }));
  route('config', 'POST', async (req, res) => {
    if (!String(req.headers['content-type']).startsWith('application/json')) throw new Error('配置格式无效');
    const config = store.save(JSON.parse((await readBody(req, 8192)).toString('utf8')));
    json(res, 200, { config });
  });
  route('upload', 'POST', async (req, res) => {
    const id = store.upload(await readBody(req, MAX_IMAGE));
    json(res, 200, { id, images: store.list() });
  });
  route('delete', 'POST', async (req, res) => {
    const { id } = JSON.parse((await readBody(req, 8192)).toString('utf8'));
    json(res, 200, store.remove(id));
  });
  route('restore', 'POST', async (req, res) => {
    const { id } = JSON.parse((await readBody(req, 8192)).toString('utf8'));
    json(res, 200, store.restore(id));
  });
  route('image', 'GET', (req, res) => {
    const id = new URL(req.url, 'http://localhost').searchParams.get('id');
    const path = store.resolveImage(id);
    if (statSync(path).size > MAX_IMAGE) throw new Error('文件过大');
    const bytes = readFileSync(path); const [, mime] = imageType(bytes);
    res.writeHead(200, { 'Content-Type': mime, 'Content-Length': bytes.length, 'Cache-Control': 'private, max-age=86400', 'X-Content-Type-Options': 'nosniff' });
    res.end(bytes);
  });
  console.info('[whale-glass] 外观插件已加载');
}
export default { name, inject, apply };
