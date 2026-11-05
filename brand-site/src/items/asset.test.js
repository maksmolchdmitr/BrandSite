import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

test('shipped garden includes a rigged loop, an independent dial and local decoders', async () => {
  const base = new URL('../../public/items/', import.meta.url);
  const bytes = await readFile(new URL('quiet-garden/quiet-garden.glb', base));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.ok(bytes.length < 8 * 1024 * 1024);
  const length = bytes.readUInt32LE(12);
  const model = JSON.parse(bytes.toString('utf8', 20, 20 + length));
  assert.ok(model.skins.length > 0, 'leaves retain their skeletons');
  assert.equal(model.animations.length, 1, 'one synchronised scene loop');
  const dial = model.nodes.find(node => node.name === 'WeatherDial');
  const axisIndex = model.nodes.findIndex(node => node.name === 'WeatherDialAxis');
  assert.ok(dial.children.includes(axisIndex));
  assert.ok(dial.children.some(index => model.nodes[index].mesh !== undefined));
  for (const file of ['draco_decoder.js', 'draco_wasm_wrapper.js', 'draco_decoder.wasm', 'LICENSE.txt']) {
    await access(new URL(`draco/${file}`, base));
  }
});
