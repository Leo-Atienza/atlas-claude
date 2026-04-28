# Tool → UI Component Mapping

## The Pattern

AI calls tools → each tool invocation maps to a React component. The server handles data, the client handles rendering.

## Component Registry

```tsx
// components/ai/tool-components.tsx
import type { ToolInvocation } from 'ai';

const TOOL_COMPONENTS: Record<string, React.ComponentType<{ data: any }>> = {
  getWeather: WeatherCard,
  searchProducts: ProductGrid,
  getChart: ChartDisplay,
  createTask: TaskConfirmation,
  runCalculation: CalculationResult,
};

const TOOL_SKELETONS: Record<string, React.ComponentType> = {
  getWeather: () => <div className="skeleton" style={{ height: 120 }} />,
  searchProducts: () => <div className="skeleton" style={{ height: 240 }} />,
  getChart: () => <div className="skeleton" style={{ height: 300 }} />,
  default: () => <div className="skeleton" style={{ height: 100 }} />,
};

export function ToolResult({ invocation }: { invocation: ToolInvocation }) {
  if (invocation.state === 'call') {
    const Skeleton = TOOL_SKELETONS[invocation.toolName] ?? TOOL_SKELETONS.default;
    return <Skeleton />;
  }

  if (invocation.state === 'result') {
    const Component = TOOL_COMPONENTS[invocation.toolName];
    if (Component) return <Component data={invocation.result} />;
    return <pre className="code">{JSON.stringify(invocation.result, null, 2)}</pre>;
  }

  return null;
}
```

## Example Components

```tsx
function WeatherCard({ data }: { data: { city: string; temperature: number; condition: string } }) {
  return (
    <div className="weather-card">
      <h3>{data.city}</h3>
      <span className="temperature">{data.temperature}°</span>
      <span className="condition">{data.condition}</span>
    </div>
  );
}

function ProductGrid({ data }: { data: Product[] }) {
  return (
    <div className="product-grid">
      {data.map(product => (
        <a key={product.id} href={`/products/${product.id}`} className="product-card">
          <img src={product.image} alt={product.name} />
          <h4>{product.name}</h4>
          <span className="price">${product.price}</span>
        </a>
      ))}
    </div>
  );
}
```

## Integration with Chat

```tsx
function ChatMessage({ message }: { message: Message }) {
  return (
    <div className={`message message--${message.role}`}>
      {/* Text content */}
      {message.content && <Markdown>{message.content}</Markdown>}

      {/* Tool invocation results rendered as rich components */}
      {message.toolInvocations?.map(invocation => (
        <ToolResult key={invocation.toolCallId} invocation={invocation} />
      ))}
    </div>
  );
}
```

## Multi-Step Tool Use

When `maxSteps > 1`, the AI can call tools, see results, then call more tools or respond:

```
User: "What's the weather in Paris and recommend what to wear?"
  → AI calls getWeather({ city: "Paris" })
  → AI sees: { temperature: 15, condition: "cloudy" }
  → AI responds: "It's 15°C and cloudy in Paris. I'd recommend..."
```

Each intermediate tool call renders its component immediately, even before the AI finishes reasoning.
