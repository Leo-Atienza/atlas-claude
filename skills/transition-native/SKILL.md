<!--
id: SK-099
name: transition-native
description: Native Transition & Scroll — screen transitions (shared elements, hero morphing, zoom), smooth scrolling (FlashList v2, Legend List), scroll-linked effects (parallax, collapsing headers, snap). The Barba.js + Lenis equivalent for native apps.
keywords: transition, screen-transition, shared-element, hero, morphing, flashlist, legend-list, scroll, parallax, collapsing-header, infinite-scroll, pull-to-refresh, skeleton, navigation, expo-router, react-navigation
version: 1.0.0
-->

# Native Transition & Scroll

## When to Use This Skill

**Auto-activate when:** building screen transitions, navigation animations, smooth scrolling lists, scroll-linked effects, or infinite scroll in React Native/Expo. SK-058 (Universal Conductor) routes here.

**Not for:** In-screen element animations (use SK-097), visual rendering/graphics (use SK-098), or haptics/sound (use SK-100).

---

## Screen Transitions

### Shared Element Transitions (Reanimated 4.2+)

Elements that visually morph between screens — the hero transition pattern.

**Requirements:** Reanimated 4.2+, Fabric (New Architecture), @react-navigation/native-stack

```typescript
import Animated from 'react-native-reanimated';
import { SharedTransition, withSpring } from 'react-native-reanimated';

// Define the transition
const heroTransition = SharedTransition.custom((values) => {
  'worklet';
  return {
    originX: withSpring(values.targetOriginX, { damping: 18, stiffness: 200 }),
    originY: withSpring(values.targetOriginY, { damping: 18, stiffness: 200 }),
    width: withSpring(values.targetWidth, { damping: 20, stiffness: 180 }),
    height: withSpring(values.targetHeight, { damping: 20, stiffness: 180 }),
  };
});

// Source screen — list item
function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <Pressable onPress={() => onPress(product)}>
      <Animated.Image
        sharedTransitionTag={`product-${product.id}`}
        sharedTransitionStyle={heroTransition}
        source={{ uri: product.image }}
        style={styles.thumbnail}
      />
      <Text>{product.name}</Text>
    </Pressable>
  );
}

// Destination screen — detail view
function ProductDetail({ route }: ProductDetailProps) {
  const { product } = route.params;

  return (
    <ScrollView>
      <Animated.Image
        sharedTransitionTag={`product-${product.id}`}
        sharedTransitionStyle={heroTransition}
        source={{ uri: product.image }}
        style={styles.heroImage}
      />
      <Text style={styles.title}>{product.name}</Text>
    </ScrollView>
  );
}
```

**Status:** Experimental — works on Fabric, not recommended for production-critical flows yet. Test thoroughly on both platforms.

### Expo Router Zoom Transitions (iOS 18+)

Native iOS zoom from a source element to a destination screen:

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="detail/[id]"
        options={{
          presentation: 'modal',
          animation: 'zoom',
        }}
      />
    </Stack>
  );
}

// app/index.tsx — source view with zoom source
import { Link } from 'expo-router';
import { ZoomSourceView } from 'expo-router';

function ListItem({ item }: { item: Item }) {
  return (
    <ZoomSourceView id={`item-${item.id}`}>
      <Link href={`/detail/${item.id}`}>
        <Card item={item} />
      </Link>
    </ZoomSourceView>
  );
}
```

**Limitation:** iOS 18+ only. Falls back to standard push on Android and iOS 17-.

### Custom Navigation Animations

Full control over screen enter/exit with React Navigation:

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransitionPresets } from '@react-navigation/stack';

const Stack = createNativeStackNavigator();

// Custom slide-up with fade
function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'slide_from_bottom',
        animationDuration: 300,
        gestureEnabled: true,
        gestureDirection: 'vertical',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="Modal"
        component={ModalScreen}
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
          animationDuration: 200,
        }}
      />
    </Stack.Navigator>
  );
}
```

### Built-in Animation Presets

| Animation | Use Case |
|-----------|----------|
| `default` | Standard platform push |
| `fade` | Modals, overlays, tab switches |
| `slide_from_right` | Detail screens (iOS-style) |
| `slide_from_bottom` | Sheets, create flows |
| `slide_from_left` | Back navigation |
| `flip` | Card flip reveal |
| `none` | Instant (data-heavy loads where animation distracts) |

### Staggered Screen Entry

Animate screen content in after the transition completes:

```typescript
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

function DetailScreen() {
  const [ready, setReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // Delay content entry until screen transition settles
      const timer = setTimeout(() => setReady(true), 50);
      return () => { clearTimeout(timer); setReady(false); };
    }, [])
  );

  if (!ready) return <SkeletonScreen />;

  return (
    <View>
      <Animated.View entering={FadeInUp.delay(0).duration(300)}>
        <Header />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(100).duration(300)}>
        <Content />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(200).duration(300)}>
        <Actions />
      </Animated.View>
    </View>
  );
}
```

---

## Smooth Scrolling — The List Engine

### FlashList v2

Drop-in FlatList replacement by Shopify. 50% less blank area, no item size estimates required.

```bash
npx expo install @shopify/flash-list
```

```typescript
import { FlashList } from '@shopify/flash-list';

function ProductFeed({ products }: { products: Product[] }) {
  return (
    <FlashList
      data={products}
      renderItem={({ item }) => <ProductCard product={item} />}
      estimatedItemSize={120} // Optional in v2, but helps initial render
      keyExtractor={(item) => item.id}
    />
  );
}
```

### FlashList v2 Advanced — Masonry Grid

```typescript
import { MasonryFlashList } from '@shopify/flash-list';

function ImageGallery({ images }: { images: GalleryImage[] }) {
  return (
    <MasonryFlashList
      data={images}
      numColumns={2}
      renderItem={({ item }) => (
        <Image
          source={{ uri: item.url }}
          style={{ aspectRatio: item.width / item.height }}
        />
      )}
      estimatedItemSize={200}
    />
  );
}
```

### Legend List — Fastest Pure-JS List

```bash
npm install @legendapp/list
```

```typescript
import { LegendList } from '@legendapp/list';

function ChatMessages({ messages }: { messages: Message[] }) {
  return (
    <LegendList
      data={messages}
      renderItem={({ item }) => <ChatBubble message={item} />}
      keyExtractor={(item) => item.id}
      estimatedItemSize={80}
      maintainScrollAtEnd // Auto-scroll to newest message
      maintainVisibleContentPosition // Stable position when loading older messages
      inverted // Chat-style (newest at bottom)
    />
  );
}
```

### List Decision Matrix

| Need | Use | Why |
|------|-----|-----|
| General-purpose list | FlashList v2 | Best all-rounder, Shopify-backed |
| Chat UI / bidirectional scroll | Legend List | `maintainVisibleContentPosition`, inverted |
| Masonry / Pinterest layout | FlashList MasonryFlashList | Built-in masonry support |
| Simple short list (<50 items) | FlatList / ScrollView | No dependency needed |
| Horizontal carousel | FlashList horizontal | Recycling + horizontal scroll |

---

## Scroll-Linked Effects

### Collapsing Header with Toolbar

```typescript
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const HEADER_MAX = 200;
const HEADER_MIN = 64;
const HEADER_SCROLL = HEADER_MAX - HEADER_MIN;

function CollapsibleHeaderScreen() {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });

  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, HEADER_SCROLL],
      [HEADER_MAX, HEADER_MIN],
      Extrapolation.CLAMP
    ),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(
      scrollY.value,
      [0, HEADER_SCROLL],
      [28, 18],
      Extrapolation.CLAMP
    ),
    opacity: interpolate(
      scrollY.value,
      [0, HEADER_SCROLL * 0.5, HEADER_SCROLL],
      [1, 0.8, 1],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Animated.Text style={[styles.title, titleStyle]}>Feed</Animated.Text>
      </Animated.View>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: HEADER_MAX }}
      >
        <FeedContent />
      </Animated.ScrollView>
    </View>
  );
}
```

### Scroll Snap Points

```typescript
import { FlatList, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_SPACING = 16;

function SnapCarousel({ items }: { items: CarouselItem[] }) {
  return (
    <FlatList
      data={items}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_WIDTH + CARD_SPACING}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: (width - CARD_WIDTH) / 2 }}
      renderItem={({ item }) => (
        <View style={{ width: CARD_WIDTH, marginHorizontal: CARD_SPACING / 2 }}>
          <CarouselCard item={item} />
        </View>
      )}
    />
  );
}
```

---

## Infinite Scroll with Prefetch

```typescript
function InfiniteList() {
  const [data, setData] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const newItems = await fetchItems(page + 1);
    setData((prev) => [...prev, ...newItems]);
    setPage((p) => p + 1);
    setLoading(false);
  }, [page, loading]);

  return (
    <FlashList
      data={data}
      renderItem={({ item }) => <ItemCard item={item} />}
      estimatedItemSize={100}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5} // Trigger at 50% from bottom
      ListFooterComponent={loading ? <LoadingSpinner /> : null}
    />
  );
}
```

---

## Pull-to-Refresh with Custom Animation

```typescript
import { RefreshControl } from 'react-native';
import LottieView from 'lottie-react-native';

function RefreshableList({ data, onRefresh }: RefreshableListProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  return (
    <FlashList
      data={data}
      renderItem={({ item }) => <Card item={item} />}
      estimatedItemSize={100}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="transparent" // Hide default spinner on iOS
        />
      }
      ListHeaderComponent={
        refreshing ? (
          <LottieView
            source={require('@/assets/animations/pull-refresh.json')}
            autoPlay
            loop
            style={{ height: 60, alignSelf: 'center' }}
          />
        ) : null
      }
    />
  );
}
```

---

## Skeleton Placeholders

Show structure before content loads:

```typescript
import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';

function CardSkeleton() {
  return (
    <MotiView
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 300 }}
      style={styles.card}
    >
      <Skeleton colorMode="light" width="100%" height={180} radius={12} />
      <Skeleton colorMode="light" width="70%" height={20} radius={4} />
      <Skeleton colorMode="light" width="40%" height={16} radius={4} />
    </MotiView>
  );
}

function FeedScreen() {
  const { data, isLoading } = useQuery({ queryKey: ['feed'], queryFn: fetchFeed });

  if (isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </View>
    );
  }

  return <FlashList data={data} renderItem={({ item }) => <FeedCard item={item} />} />;
}
```

---

## Performance Rules for Transitions & Scroll

1. **`scrollEventThrottle={16}`** on every Animated.ScrollView — ensures 60fps scroll tracking
2. **Never nest ScrollViews** — use section headers within a single FlashList instead
3. **Use `keyExtractor`** on every list — prevents unnecessary re-renders
4. **Memoize `renderItem`** with `useCallback` — list items should not re-render on scroll
5. **Prefetch images** — use `Image.prefetch()` for items about to scroll into view
6. **Avoid heavy `onScroll` JS callbacks** — use Reanimated's `useAnimatedScrollHandler` instead
7. **Test shared element transitions on both platforms** — behavior differs between iOS/Android
8. **Use `estimatedItemSize`** even in FlashList v2 — it improves initial render speed
