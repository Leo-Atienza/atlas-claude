#!/usr/bin/env python3
"""
Benchmark script comparing KittenTTS vs pocket-tts for voice summaries.

Usage:
    python benchmark_tts.py [--iterations N]

Simulates real-world voice summary scenario:
- Short text (~15-25 words)
- Measures time to generate audio
- Measures time to first sound (playback start)
- Tests multiple iterations for consistency
"""

import argparse
import io
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import numpy as np

# Test sentences similar to real voice summaries
TEST_SENTENCES = [
    "Done! I fixed the authentication bug and updated the tests.",
    "All set - created three new files and modified the config.",
    "Finished refactoring the database layer, everything passes now.",
    "Hell yeah, knocked out that feature request in record time!",
    "Updated the voice plugin with smarter summary extraction and silent hooks.",
]


def check_dependencies():
    """Check if required dependencies are available."""
    missing = []

    # Check for soundfile (needed for audio playback timing)
    try:
        import soundfile
    except ImportError:
        missing.append("soundfile")

    # Check for kittentts
    try:
        from kittentts import KittenTTS
    except ImportError:
        missing.append("kittentts")

    # Check for requests (for pocket-tts)
    try:
        import requests
    except ImportError:
        missing.append("requests")

    if missing:
        print(f"Missing dependencies: {', '.join(missing)}")
        print("Install with:")
        if "kittentts" in missing:
            print("  pip install https://github.com/KittenML/KittenTTS/releases/"
                  "download/0.1/kittentts-0.1.0-py3-none-any.whl")
        other = [m for m in missing if m != "kittentts"]
        if other:
            print(f"  pip install {' '.join(other)}")
        return False
    return True


def benchmark_kittentts(sentences: list[str], iterations: int = 3) -> dict:
    """Benchmark KittenTTS generation times."""
    from kittentts import KittenTTS
    import soundfile as sf

    print("\n=== KittenTTS Benchmark ===")

    # Model loading time
    print("Loading model...", end=" ", flush=True)
    load_start = time.perf_counter()
    model = KittenTTS("KittenML/kitten-tts-nano-0.2")
    load_time = time.perf_counter() - load_start
    print(f"done ({load_time:.2f}s)")

    results = {
        "model_load_time": load_time,
        "generation_times": [],
        "audio_durations": [],
        "chars_per_second": [],
    }

    for i in range(iterations):
        print(f"\nIteration {i + 1}/{iterations}")
        for sentence in sentences:
            # Generation time
            gen_start = time.perf_counter()
            audio = model.generate(sentence, voice="expr-voice-2-f")
            gen_time = time.perf_counter() - gen_start

            # Audio duration (24kHz sample rate)
            audio_duration = len(audio) / 24000

            results["generation_times"].append(gen_time)
            results["audio_durations"].append(audio_duration)
            results["chars_per_second"].append(len(sentence) / gen_time)

            print(f"  '{sentence[:40]}...' "
                  f"gen={gen_time:.3f}s, audio={audio_duration:.2f}s")

    return results


def benchmark_pocket_tts(sentences: list[str], iterations: int = 3,
                         host: str = "localhost", port: int = 8000) -> dict:
    """Benchmark pocket-tts generation times."""
    import requests

    print("\n=== pocket-tts Benchmark ===")

    base_url = f"http://{host}:{port}"

    # Check if server is running
    try:
        health = requests.get(f"{base_url}/health", timeout=2)
        if health.status_code != 200:
            print(f"pocket-tts server not healthy at {base_url}")
            return None
    except requests.exceptions.ConnectionError:
        print(f"pocket-tts server not running at {base_url}")
        print("Start it with: uvx pocket-tts serve")
        return None

    print(f"Server running at {base_url}")

    results = {
        "generation_times": [],
        "audio_durations": [],
        "chars_per_second": [],
    }

    for i in range(iterations):
        print(f"\nIteration {i + 1}/{iterations}")
        for sentence in sentences:
            # Generation time (includes network overhead)
            gen_start = time.perf_counter()
            response = requests.post(
                f"{base_url}/tts",
                data={"text": sentence},  # multipart/form-data, not JSON
                timeout=30,
            )
            gen_time = time.perf_counter() - gen_start

            if response.status_code != 200:
                print(f"  Error: {response.status_code}")
                continue

            # Get audio duration from WAV data
            audio_data = response.content
            # WAV header: sample rate at bytes 24-28, data size can be calculated
            # For simplicity, estimate from file size (16-bit, mono)
            # Actual sample rate from pocket-tts is typically 22050 or 24000
            audio_duration = (len(audio_data) - 44) / (2 * 24000)  # Rough estimate

            results["generation_times"].append(gen_time)
            results["audio_durations"].append(audio_duration)
            results["chars_per_second"].append(len(sentence) / gen_time)

            print(f"  '{sentence[:40]}...' "
                  f"gen={gen_time:.3f}s, audio={audio_duration:.2f}s")

    return results


def print_summary(kitten_results: dict | None, pocket_results: dict | None):
    """Print comparison summary."""
    print("\n" + "=" * 60)
    print("BENCHMARK SUMMARY")
    print("=" * 60)

    if kitten_results and len(kitten_results.get("generation_times", [])) > 0:
        gen_times = kitten_results["generation_times"]
        print(f"\nKittenTTS:")
        print(f"  Model load time:     {kitten_results['model_load_time']:.2f}s")
        print(f"  Generation time:     {np.mean(gen_times):.3f}s "
              f"(±{np.std(gen_times):.3f}s)")
        print(f"  Min/Max:             {np.min(gen_times):.3f}s / "
              f"{np.max(gen_times):.3f}s")
        print(f"  Chars/second:        {np.mean(kitten_results['chars_per_second']):.1f}")
    elif kitten_results:
        print(f"\nKittenTTS: No generation data (model may have failed)")

    if pocket_results and len(pocket_results.get("generation_times", [])) > 0:
        gen_times = pocket_results["generation_times"]
        print(f"\npocket-tts:")
        print(f"  Generation time:     {np.mean(gen_times):.3f}s "
              f"(±{np.std(gen_times):.3f}s)")
        print(f"  Min/Max:             {np.min(gen_times):.3f}s / "
              f"{np.max(gen_times):.3f}s")
        print(f"  Chars/second:        {np.mean(pocket_results['chars_per_second']):.1f}")
    elif pocket_results:
        print(f"\npocket-tts: No generation data (server may not be running)")

    kitten_has_data = kitten_results and len(kitten_results.get("generation_times", [])) > 0
    pocket_has_data = pocket_results and len(pocket_results.get("generation_times", [])) > 0

    if kitten_has_data and pocket_has_data:
        kitten_avg = np.mean(kitten_results["generation_times"])
        pocket_avg = np.mean(pocket_results["generation_times"])
        diff = pocket_avg - kitten_avg
        faster = "KittenTTS" if diff > 0 else "pocket-tts"
        pct = abs(diff) / max(kitten_avg, pocket_avg) * 100
        print(f"\n{faster} is {pct:.1f}% faster on average")
        print(f"  (KittenTTS: {kitten_avg:.3f}s vs pocket-tts: {pocket_avg:.3f}s)")
    elif not kitten_has_data and not pocket_has_data:
        print("\nNo benchmark data collected!")
    elif not pocket_has_data:
        print("\npocket-tts: No data (server not running?)")
    elif not kitten_has_data:
        print("\nKittenTTS: No data (install issue?)")


def main():
    parser = argparse.ArgumentParser(description="Benchmark TTS backends")
    parser.add_argument("--iterations", "-n", type=int, default=3,
                        help="Number of iterations per sentence (default: 3)")
    parser.add_argument("--kitten-only", action="store_true",
                        help="Only benchmark KittenTTS")
    parser.add_argument("--pocket-only", action="store_true",
                        help="Only benchmark pocket-tts")
    args = parser.parse_args()

    if not check_dependencies():
        sys.exit(1)

    print("TTS Benchmark - Voice Summary Scenario")
    print(f"Testing {len(TEST_SENTENCES)} sentences, {args.iterations} iterations each")

    kitten_results = None
    pocket_results = None

    if not args.pocket_only:
        kitten_results = benchmark_kittentts(TEST_SENTENCES, args.iterations)

    if not args.kitten_only:
        pocket_results = benchmark_pocket_tts(TEST_SENTENCES, args.iterations)

    print_summary(kitten_results, pocket_results)


if __name__ == "__main__":
    main()
