# WebGPU Compute

**Chrome 113+, Edge, Firefox 141+, Safari 26+. ~70% global coverage**

## Device setup

```js
async function initWebGPU() {
  if (!navigator.gpu) throw new Error('WebGPU not supported');

  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: 'high-performance',
  });
  if (!adapter) throw new Error('No GPU adapter found');

  const device = await adapter.requestDevice();
  device.lost.then((info) => {
    console.error('GPU device lost:', info.message);
    if (info.reason !== 'destroyed') initWebGPU(); // Recover
  });

  return device;
}
```

## Compute shader (double array values)

```js
const device = await initWebGPU();

const module = device.createShaderModule({
  code: `
    @group(0) @binding(0) var<storage, read_write> data: array<f32>;

    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let i = id.x;
      if (i >= arrayLength(&data)) { return; }
      data[i] = data[i] * 2.0;
    }
  `,
});

const pipeline = device.createComputePipeline({
  layout: 'auto',
  compute: { module, entryPoint: 'main' },
});

// Upload data
const inputData = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]);
const buffer = device.createBuffer({
  size: inputData.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(buffer, 0, inputData);

// Dispatch
const bindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [{ binding: 0, resource: { buffer } }],
});

const encoder = device.createCommandEncoder();
const pass = encoder.beginComputePass();
pass.setPipeline(pipeline);
pass.setBindGroup(0, bindGroup);
pass.dispatchWorkgroups(Math.ceil(inputData.length / 64));
pass.end();
device.queue.submit([encoder.finish()]);
```

## Use cases

- On-device LLM inference (WebLLM, transformers.js)
- Real-time image processing and filters
- Physics simulation
- Data visualization and point cloud rendering
- Neural style transfer
