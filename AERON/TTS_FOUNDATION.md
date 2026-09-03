# AERON TTS Foundation

AERON now has a provider-independent local TTS layer at `AERON/js/aeron-tts.js`.

## Voices
- `male` — Indian Hindi male voice slot
- `female` — Indian Hindi female voice slot

## Current status
The architecture is ready for a local neural voice provider (ONNX/WebAssembly/native service). Until a model is installed, AERON temporarily falls back to the device/browser speech engine so voice conversation is not broken.

## Provider contract
Register a provider with:

```js
AERON_TTS.registerVoice("male", {
  speak: async (text, options) => true,
  stop: () => {}
});
```

The final neural voice model can be installed later without changing `aeron-widget.js`.
