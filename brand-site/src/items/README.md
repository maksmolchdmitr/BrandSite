# Interactive item collection

Open `/?page=items` for the catalog or `/?page=items&item=quiet-garden` for the model. The catalog and viewer are lazy-loaded;
Three.js and the 4.6 MB model load only when the visitor selects the garden.
All models, textures, audio and Draco decoders are served locally.

Drag the garden to orbit, scroll/pinch to zoom, or reset the view. Grabbing the
visible brass dial takes priority over orbiting: clockwise movement speeds up
the scene (0–3×), counterclockwise slows it down. A centre grab supports horizontal
dragging. The dial rotates around its
exported local axis after mixer updates, independently of the baked scene clip.

The model contains real skinned leaf animation and a four-second scene loop.
Sampler timestamps are normalised once per shared array, preserving synchronisation.
Sound is enabled by default. If autoplay is blocked, the first interaction unlocks audio. Quiet rain, drops and leaf
rustle follow the playback rate; dial detents generate brief filtered clicks.
Explicit mute is respected on later dial gestures. Pause/zero speed stop ambient
sources, hidden tabs suspend playback, and navigation disposes GPU/audio resources.

## Validation

From `brand-site`: `npm run test:items` and `npm run build`.

## Regenerating the model

The source is the personally created Quiet Garden Blender scene, not a stock model.
The `.blend` source stays outside this web repository. With Blender's glTF exporter
and Draco support installed, run from the repository root:

```sh
blender -b /path/to/quiet-garden.blend --python-exit-code 1 --python tools/export-items.py -- /tmp/garden-export
```

The exporter preserves armatures, combines static meshes, bakes ceramic/copper
colour maps and adds a named `WeatherDial` pivot plus `WeatherDialAxis` marker.
Copy the generated GLB and model-info.json to `public/items/quiet-garden/`.
GLB axis conversion must be read from the marker rather than hard-coded.
The poster and three quiet audio loops are separate assets from the same scene.
Google's Draco runtime is bundled under its Apache 2.0 license in `public/items/draco/`.
