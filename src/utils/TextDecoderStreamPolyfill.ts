// polyfill for TextDecoderStream
// as seen on: https://developer.mozilla.org/en-US/docs/Web/API/TransformStream

const tds: {
  decoder: TextDecoder | undefined;
  encoding: string | undefined;
  options: Record<string, any> | undefined;
  start: () => void;
  transform: (chunk: Uint8Array, controller: any) => void;
} = {
  decoder: undefined,
  encoding: 'utf-8',
  options: {},
  start() {
    this.decoder = new TextDecoder(this.encoding, this.options);
  },
  transform(chunk: Uint8Array, controller: any) {
    controller.enqueue(this.decoder?.decode(chunk, { stream: true }));
  },
};

const textDecoderStreamWeakMap = new WeakMap();
class TextDecoderStreamPolyfill extends TransformStream {
  constructor(encoding = 'utf-8', { ...options } = {}) {
    const t = { ...tds, encoding, options };

    super(t);
    textDecoderStreamWeakMap.set(this, t);
  }

  get encoding() {
    return textDecoderStreamWeakMap.get(this).decoder.encoding;
  }

  get fatal() {
    return textDecoderStreamWeakMap.get(this).decoder.fatal;
  }

  get ignoreBOM() {
    return textDecoderStreamWeakMap.get(this).decoder.ignoreBOM;
  }
}

export const PolyfilledTextDecoderStream =
  TextDecoderStream || TextDecoderStreamPolyfill;
