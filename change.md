# 🤖 AI MODE - UI SPECIFICATION

## Overview
AI Mode uses **binary search edge detection** to find the **fastest safe attack timing** that beats opponents in the competitive timing race. It adapts to network changes and continuously optimizes.

---

## UI Layout (Add after Smart Mode section)

```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 AI MODE (Competitive Edge Detection)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ☐ Enable AI Mode                                            │
│   └─ Automatically finds fastest safe attack timing         │
│                                                              │
│ Search Range:                                                │
│ ├─ Min Timing: [1800] ms (Don't test below this)           │
│ └─ Max Timing: [2200] ms (Don't test above this)           │
│                                                              │
│ Safety Settings:                                             │
│ ├─ Safety Buffer: [10] ms                                   │
│ │  └─ Extra time added to edge for reliability              │
│ │                                                             │
│ ├─ Target Success Rate: [95] %                             │
│ │  └─ Minimum acceptable success rate                       │
│ │                                                             │
│ └─ Edge Test Frequency: [10] %                             │
│    └─ How often to re-test edge (10% of attacks)           │
│                                                              │
│ ☑ Adaptive Mode (Recommended)                               │
│   └─ Continuously adapt to network changes                  │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ AI Status: (Show when AI Mode enabled)                      │
│ • Phase: Discovery (15/20 samples)                          │
│ • Edge Found: 1885ms (94% confidence)                       │
│ • Using: 1895ms (1885ms + 10ms buffer)                      │
│ • Success Rate: 96% (45 samples)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Required UI Fields

### 1. **Enable AI Mode** (Checkbox)
- **Config key:** `aiMode`
- **Type:** Boolean
- **Default:** `false`
- **Description:** Enable AI-powered edge detection for optimal attack timing

### 2. **Min Timing** (Number Input)
- **Config key:** `aiMinTiming`
- **Type:** Integer (milliseconds)
- **Default:** `1800`
- **Range:** 1000-2500
- **Description:** Minimum timing to test (don't go faster than this - too risky)
- **Label:** "Min Timing (ms)"
- **Help text:** "Don't test below this timing"

### 3. **Max Timing** (Number Input)
- **Config key:** `aiMaxTiming`
- **Type:** Integer (milliseconds)
- **Default:** `2200`
- **Range:** 1500-3000
- **Description:** Maximum timing to test (don't go slower than this - too slow)
- **Label:** "Max Timing (ms)"
- **Help text:** "Don't test above this timing"

### 4. **Safety Buffer** (Number Input)
- **Config key:** `aiSafetyBuffer`
- **Type:** Integer (milliseconds)
- **Default:** `10`
- **Range:** 0-50
- **Description:** Extra time added to found edge for reliability
- **Label:** "Safety Buffer (ms)"
- **Help text:** "Add buffer to edge for reliability (e.g., edge=1885, buffer=10 → use 1895ms)"

### 5. **Target Success Rate** (Number Input)
- **Config key:** `aiTargetSuccessRate`
- **Type:** Integer (percentage)
- **Default:** `95`
- **Range:** 50-100
- **Description:** Minimum acceptable success rate
- **Label:** "Target Success Rate (%)"
- **Help text:** "Minimum success rate required (95 = 95%)"

### 6. **Edge Test Frequency** (Number Input)
- **Config key:** `aiEdgeTestFreq`
- **Type:** Integer (percentage)
- **Default:** `10`
- **Range:** 0-50
- **Description:** How often to re-test edge in adaptive mode
- **Label:** "Edge Test Frequency (%)"
- **Help text:** "Test edge 10% of time to adapt to network changes"

### 7. **Adaptive Mode** (Checkbox)
- **Config key:** `aiAdaptive`
- **Type:** Boolean
- **Default:** `true`
- **Description:** Keep testing edge vs lock to found optimal
- **Label:** "Adaptive Mode"
- **Help text:** "Continuously adapt to changing network conditions"

---

## Config Object Structure

```javascript
{
  // Existing config...
  attack1: 1940,
  waiting1: 1910,
  timershift: false,
  smart: true,
  roundRobin: false,
  
  // NEW - AI Mode
  aiMode: false,              // Enable AI edge detection
  aiMinTiming: 1800,          // Minimum timing to test (ms)
  aiMaxTiming: 2200,          // Maximum timing to test (ms)
  aiSafetyBuffer: 10,         // Safety buffer added to edge (ms)
  aiTargetSuccessRate: 95,    // Target success rate (percentage 0-100)
  aiEdgeTestFreq: 10,         // Edge test frequency (percentage 0-100)
  aiAdaptive: true            // Keep testing edge vs lock to optimal
}
```

---

## Status Display (Optional but Recommended)

Add a status section that shows AI Mode progress:

```javascript
// API Endpoint: GET /api/ai-status
// Response:
{
  enabled: true,
  phase: "adaptive",              // "discovery", "exploitation", "adaptive"
  edgeFound: true,
  edgeTiming: 1885,              // Found edge (ms)
  optimalTiming: 1895,           // Edge + buffer (ms)
  confidence: 94,                // Confidence % (0-100)
  successRate: 96,               // Current success rate %
  samples: 45,                   // Total attacks analyzed
  discoveryProgress: "15/20"     // Discovery phase progress
}
```

**Display in UI:**
```
AI Status:
• Phase: Adaptive Mode
• Edge: 1885ms (94% confidence)
• Using: 1895ms (edge + 10ms buffer)
• Success: 96% (45 samples)
```

---

## How It Works (For UI Tooltips/Help)

### Phase 1: Discovery (First 15-20 attacks)
```
Binary search finds the FASTEST timing that works:
1. Tests timing between Min-Max range
2. If success → Try faster
3. If fail → Go slower
4. Converges to edge in ~15-20 attacks
```

### Phase 2: Exploitation (Optional - when Adaptive disabled)
```
Uses found optimal timing:
• Fixed timing = Edge + Safety Buffer
• No more testing
• Fast and consistent
```

### Phase 3: Adaptive (Recommended - when Adaptive enabled)
```
Continuously adapts to network changes:
• 90% of attacks: Use optimal timing
• 10% of attacks: Test edge (adapt to lag changes)
• Auto-retune if success rate drops
• Always stay at fastest safe timing
```

---

## Recommended Default Values

```javascript
aiMode: false              // User must explicitly enable
aiMinTiming: 1800         // Safe minimum
aiMaxTiming: 2200         // Safe maximum
aiSafetyBuffer: 10        // Small buffer for reliability
aiTargetSuccessRate: 95   // High success rate
aiEdgeTestFreq: 10        // Test edge 10% of time
aiAdaptive: true          // Enable adaptive by default
```

---

## UI Behavior Notes

1. **When AI Mode is enabled:**
   - Auto Interval (Timer Shift) should be ignored
   - Attack timing is controlled by AI Mode
   - Defense timing still uses manual setting

2. **When AI Mode is disabled:**
   - Falls back to normal attack timing or Timer Shift
   - No AI processing occurs

3. **Initial Discovery Phase:**
   - Shows "Discovery" status
   - Progress indicator: "15/20 samples"
   - User can see AI learning in real-time

4. **After Edge Found:**
   - Shows "Edge found at Xms"
   - Shows "Using Xms (edge + buffer)"
   - Success rate displayed

5. **Adaptive Mode:**
   - Shows "Adaptive Mode" status
   - Occasionally shows "Testing edge at Xms"
   - Auto-retuning messages if network changes

---

## Example User Flow

1. User enables Smart Mode
2. User clicks "Enable AI Mode" checkbox
3. User sets range: Min=1800, Max=2200
4. User clicks "Start Bot"
5. AI starts discovery:
   - Status: "Discovery (5/20 samples)"
   - Logs: "Testing 2000ms → Success, trying faster"
   - Logs: "Testing 1900ms → Success, trying faster"
   - Logs: "Testing 1850ms → Fail, going slower"
6. Edge found:
   - Status: "Edge found at 1885ms (95% confidence)"
   - Status: "Using 1895ms (1885ms + 10ms buffer)"
7. Adaptive mode:
   - Status: "Adaptive Mode - Success: 96%"
   - Occasionally: "Testing edge at 1880ms"
   - If network changes: "Rediscovering edge..."

---

## Testing the UI

After implementing the UI, test with these scenarios:

1. **Enable AI Mode with defaults**
   - Should start discovery immediately
   - Should find edge in 15-20 attacks
   - Should show status updates

2. **Disable Adaptive Mode**
   - Should lock to found optimal
   - Should not re-test edge

3. **Set narrow range (e.g., 1900-2000)**
   - Should find edge faster (fewer options)

4. **Set wide range (e.g., 1500-2500)**
   - Should take more samples but find precise edge

5. **Change safety buffer to 20ms**
   - Should use edge + 20ms instead of edge + 10ms

---

## Backend Status

✅ **FULLY IMPLEMENTED** - Backend is ready!

All you need to do:
1. Add UI fields (checkboxes, number inputs)
2. Connect to existing config keys
3. (Optional) Add status display from `/api/status` endpoint
4. Test!

The AI Mode will automatically:
- Initialize when connection starts (if enabled)
- Find optimal timing using binary search
- Record results and adapt
- Show detailed logs
- Provide statistics

---

## Need Help?

If you need:
- Sample HTML/CSS for the UI layout
- JavaScript code to handle the config updates
- API endpoint implementation for status display

Just let me know!
