<!--
id: SK-089
name: device-hardware-bridge
description: Device Hardware Bridge — camera (Vision Camera v5), scanning (QR/barcode/document/OCR), biometrics (Face ID/Touch ID), NFC, sensors, haptics. Permission handling patterns across iOS/Android. Tauri plugin equivalents for desktop.
keywords: camera, vision-camera, scanning, barcode, qr-code, biometrics, face-id, touch-id, nfc, sensors, haptics, permissions, hardware, native-modules
version: 1.0.0
-->

# Device Hardware Bridge

## When to Use This Skill

**Auto-activate when:** accessing device hardware (camera, scanner, biometrics, NFC, sensors), handling permissions, or integrating native device capabilities. SK-058 (Universal Conductor) routes here.

---

## Hardware Decision Matrix

| Hardware | Mobile (Expo/RN) | Desktop (Tauri) | Web |
|----------|-----------------|-----------------|-----|
| Camera | Vision Camera v5 | WebView getUserMedia | MediaDevices API |
| QR/Barcode | expo-camera or Vision Camera frame processor | tauri-plugin-barcode-scanner (mobile only) | jsQR / zxing-js |
| Biometrics | expo-local-authentication | OS keychain (Rust) | WebAuthn API |
| NFC | react-native-nfc-manager | tauri-plugin-nfc (mobile only) | Web NFC API (Chrome) |
| Haptics | expo-haptics | Not available | Navigator.vibrate() |
| Geolocation | expo-location | tauri-plugin-geolocation (mobile) | Geolocation API |
| Accelerometer | expo-sensors | Not available | DeviceMotion API |
| Clipboard | expo-clipboard | tauri-plugin-clipboard | Clipboard API |
| File picker | expo-document-picker | tauri-plugin-dialog | `<input type="file">` |

---

## Vision Camera v5 Deep Dive

### Setup

```bash
npx expo install react-native-vision-camera
# Requires dev client (not Expo Go)
npx expo prebuild
```

**Permissions (app.json):**
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-vision-camera",
        {
          "cameraPermissionText": "$(PRODUCT_NAME) needs camera access to scan documents",
          "enableMicrophonePermission": false
        }
      ]
    ]
  }
}
```

### Basic Camera

```tsx
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

function CameraScreen() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>Camera access required</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  if (!device) return <Text>No camera device</Text>;

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
      photo={true}
      video={false}
    />
  );
}
```

### Photo Capture

```tsx
import { useRef } from 'react';
import { Camera, useCameraDevice } from 'react-native-vision-camera';

function PhotoCapture() {
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');

  const takePhoto = async () => {
    if (!camera.current) return;
    const photo = await camera.current.takePhoto({
      qualityPrioritization: 'quality',
      flash: 'auto',
      enableShutterSound: true,
    });
    // photo.path contains the file path
    console.log('Photo saved to:', photo.path);
    return photo;
  };

  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device!}
        isActive={true}
        photo={true}
      />
      <TouchableOpacity style={styles.captureButton} onPress={takePhoto} />
    </View>
  );
}
```

### Multi-Camera & Device Selection

```tsx
import { useCameraDevice, useCameraDevices } from 'react-native-vision-camera';

function MultiCamera() {
  const devices = useCameraDevices();
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  // Best device for the selected facing
  const device = useCameraDevice(facing, {
    physicalDevices: [
      'ultra-wide-angle-camera',
      'wide-angle-camera',
      'telephoto-camera',
    ],
  });

  const flipCamera = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={{ flex: 1 }}>
      {device && (
        <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} photo={true} />
      )}
      <TouchableOpacity onPress={flipCamera}>
        <Text>Flip</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Frame Processors (Real-Time Analysis)

Frame processors run on a worklet thread — no JS bridge overhead.

```bash
npm install react-native-worklets-core
```

```tsx
import { Camera, useFrameProcessor } from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';

function FrameAnalyzer() {
  const device = useCameraDevice('back');

  const onDetection = (result: string) => {
    console.log('Detected:', result);
  };

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    // frame.width, frame.height, frame.pixelFormat
    // Process frame data here (e.g., pass to ML model)
    // Use runOnJS to send results back to JS thread
  }, []);

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device!}
      isActive={true}
      frameProcessor={frameProcessor}
      pixelFormat="yuv"
    />
  );
}
```

---

## Scanning Architecture

### QR/Barcode with expo-camera

```bash
npx expo install expo-camera
```

```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';

function QRScanner({ onScan }: { onScan: (data: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission?.granted) {
    return <Button title="Grant Camera" onPress={requestPermission} />;
  }

  return (
    <CameraView
      style={StyleSheet.absoluteFill}
      barcodeScannerSettings={{
        barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'],
      }}
      onBarcodeScanned={scanned ? undefined : (result) => {
        setScanned(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onScan(result.data);
        // Reset after 2s to allow re-scanning
        setTimeout(() => setScanned(false), 2000);
      }}
    />
  );
}
```

### Document Scanner

```bash
npx expo install react-native-document-scanner-plugin
```

```tsx
import DocumentScanner from 'react-native-document-scanner-plugin';

async function scanDocument() {
  const { scannedImages } = await DocumentScanner.scanDocument({
    maxNumDocuments: 5,
    croppedImageQuality: 100,
  });

  if (scannedImages && scannedImages.length > 0) {
    return scannedImages; // Array of file URIs
  }
  return null;
}
```

---

## Biometric Authentication

### Expo Local Authentication

```bash
npx expo install expo-local-authentication
```

```tsx
import * as LocalAuthentication from 'expo-local-authentication';

async function authenticateWithBiometrics(): Promise<boolean> {
  // Check hardware availability
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;

  // Check enrollment
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) return false;

  // Check what types are available
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const hasFaceId = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  const hasFingerprint = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);

  // Authenticate
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: hasFaceId ? 'Verify with Face ID' : 'Verify with fingerprint',
    fallbackLabel: 'Use passcode',
    disableDeviceFallback: false,
    cancelLabel: 'Cancel',
  });

  return result.success;
}
```

**Protected route pattern:**
```tsx
function ProtectedScreen({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    authenticateWithBiometrics().then((success) => {
      if (success) {
        setIsAuthenticated(true);
      } else {
        router.back();
      }
    });
  }, []);

  if (!isAuthenticated) {
    return <ActivityIndicator />;
  }

  return <>{children}</>;
}
```

---

## NFC

```bash
npm install react-native-nfc-manager
# Requires dev client
```

```tsx
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

// Initialize at app start
await NfcManager.start();

async function readNfcTag(): Promise<string | null> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();

    if (tag?.ndefMessage) {
      const record = tag.ndefMessage[0];
      const text = Ndef.text.decodePayload(new Uint8Array(record.payload));
      return text;
    }
    return null;
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
}

async function writeNfcTag(text: string): Promise<boolean> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const bytes = Ndef.encodeMessage([Ndef.textRecord(text)]);
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
    return true;
  } catch {
    return false;
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
}
```

---

## Sensor Fusion

```bash
npx expo install expo-sensors
```

```tsx
import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';

function useSensorFusion(interval = 100) {
  const [motion, setMotion] = useState({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [heading, setHeading] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    Accelerometer.setUpdateInterval(interval);
    Gyroscope.setUpdateInterval(interval);
    Magnetometer.setUpdateInterval(interval);

    const subs = [
      Accelerometer.addListener(setMotion),
      Gyroscope.addListener(setRotation),
      Magnetometer.addListener(setHeading),
    ];

    return () => subs.forEach((s) => s.remove());
  }, [interval]);

  return { motion, rotation, heading };
}
```

---

## Permission Handling Pattern

```tsx
import * as Linking from 'expo-linking';

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface PermissionResult {
  status: PermissionStatus;
  canAskAgain: boolean;
}

async function ensurePermission(
  checkFn: () => Promise<PermissionResult>,
  requestFn: () => Promise<PermissionResult>,
  settingsMessage: string
): Promise<boolean> {
  // 1. Check current status
  const current = await checkFn();
  if (current.status === 'granted') return true;

  // 2. Request if we can
  if (current.status === 'undetermined' || current.canAskAgain) {
    const result = await requestFn();
    return result.status === 'granted';
  }

  // 3. Direct to settings if permanently denied
  Alert.alert(
    'Permission Required',
    settingsMessage,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ]
  );
  return false;
}

// Usage:
import * as Camera from 'expo-camera';

const granted = await ensurePermission(
  Camera.getCameraPermissionsAsync,
  Camera.requestCameraPermissionsAsync,
  'Camera access is needed to scan documents. Please enable it in Settings.'
);
```

---

## Haptics Integration

```bash
npx expo install expo-haptics
```

```typescript
import * as Haptics from 'expo-haptics';

// Tap feedback — every button, switch, interactive element
export const haptic = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  selection: () => Haptics.selectionAsync(),
};
```

---

## Integration

- **SK-058** — Universal Conductor routes hardware tasks here
- **SK-088** — Tauri Desktop Engine for desktop hardware via plugins
- **SK-090** — Local-First Architecture for offline-capable hardware apps
- **SK-091** — Edge Intelligence for ML-powered camera processing (MediaPipe, frame processors)
- **SK-092** — Cross-Platform Monorepo for shared hardware interfaces
