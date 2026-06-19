# Interactive UI & Animation Components 🎨

This document provides a detailed analysis of the calculations, math, and rendering configurations behind the interactive UI components in **Amazing Websites (The Vault)**.

---

## 🎨 Gooey Text Morphing

The landing page features a pure CSS/SVG text morphing effect. Unlike canvas-based solutions, this is implemented using standard HTML text elements and an SVG filter.

* **Component Source**: [src/components/ui/gooey-text-morphing.jsx](file:///d:/antigravity/amazing-websites/src/components/ui/gooey-text-morphing.jsx)

### 1. The SVG Alpha Threshold Filter
The text element has a blur filter applied. An SVG threshold filter then processes the blurred result, sharpening the edges:

```html
<svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
  <defs>
    <filter id="threshold" colorInterpolationFilters="sRGB">
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 255 -140"
      />
    </filter>
  </defs>
</svg>
```

#### How the Matrix Works:
* The first three rows are identity rows, leaving the Red, Green, and Blue channels unchanged.
* The fourth row targets the Alpha channel: `0 0 0 255 -140`.
* This multiplies the alpha value by `255` and subtracts `140`. Any pixel with a opacity level above `140/255 (~55%)` becomes fully opaque, while pixels below that threshold become transparent. This creates a sharp boundary around blurred shapes, making them merge like liquids when they overlap.
* Setting `colorInterpolationFilters="sRGB"` forces the browser to use a linear color space, which prevents pixelation around the smoothed edges.

---

### 2. The Animation Loop
A `requestAnimationFrame` loop manages the morph states. It calculates state changes using the elapsed time (`dt`) to handle variable frame rates:

```javascript
function animate() {
  animationFrameId = requestAnimationFrame(animate);
  const newTime = new Date();
  const shouldIncrementIndex = cooldown > 0;
  const dt = (newTime.getTime() - time.getTime()) / 1000;
  time = newTime;

  cooldown -= dt;

  if (cooldown <= 0) {
    if (shouldIncrementIndex) {
      textIndex = (textIndex + 1) % texts.length;
      // ... swap text content ...
    }
    doMorph();
  } else {
    doCooldown();
  }
}
```

* **`doMorph()`**: Animates the transition between the current word and the next by adjusting their blur values.
* **`doCooldown()`**: Pauses the animation temporarily when a word is fully rendered, allowing it to remain readable.

---

## 🎴 Responsive 3D Card Stack Layout

The "UI / UX Design" category uses a custom 3D card deck layout that handles rotation, positioning offsets, and dragging gestures.

* **Component Source**: [src/components/ui/card-stack.jsx (CardStack)](file:///d:/antigravity/amazing-websites/src/components/ui/card-stack.jsx#L24)

### 1. Responsive Layout Config
A custom hook matches the deck configuration to the client's screen size:

```javascript
function useResponsiveCardConfig() {
  const [config, setConfig] = useState({
    width: 480,
    height: 290,
    maxVisible: 7,
    overlap: 0.48,
    spreadDeg: 48,
  });
  // ... updates config object on window resize ...
}
```
* **Mobile Devices**: Sets a narrower width, tighter card overlap, and decreases `maxVisible` from 7 to 3 to prevent card overflow.

---

### 2. Card Transform Formulas
The stack uses the following formulas to calculate the position of cards relative to the active index:

```javascript
const off = signedOffset(i, active, len, loop);
const abs = Math.abs(off);

const rotateZ = off * stepDeg;
const x = off * cardSpacing;
const y = abs * 10;
const z = -abs * depthPx;

const isActive = off === 0;
const scale = isActive ? activeScale : inactiveScale;
const lift = isActive ? -activeLiftPx : 0;
const rotateX = isActive ? 0 : tiltXDeg;
```

* **`rotateZ`**: Tilts cards outwards depending on their distance from the active card.
* **`x`**: Distributes cards horizontally across the deck.
* **`y`**: Steps cards downward as they move further back in the stack, creating an arched layout.
* **`z`**: Moves inactive cards backward along the Z-axis to establish 3D depth.
* **`lift`**: Shifts the active card upward to separate it from the rest of the deck.

---

### 3. Drag Gesture Mechanics
Framer Motion handles swiping gestures on the active card. Swiping left or right updates the active index if the gesture meets the required distance or velocity thresholds:

```javascript
const dragProps = isActive
  ? {
      drag: "x",
      dragConstraints: { left: 0, right: 0 },
      dragElastic: 0.18,
      onDragEnd: (_e, info) => {
        if (reduceMotion) return;
        const travel = info.offset.x;
        const v = info.velocity.x;
        const threshold = Math.min(160, cardWidth * 0.22);
        
        if (travel > threshold || v > 650) prev();      // Swipe Right
        else if (travel < -threshold || v < -650) next(); // Swipe Left
      },
    }
  : {};
```

---

## 🗂️ Category Visual Modes

The application changes its visual layout depending on the category of resources being displayed:

### 1. Animations: Filmstrip Carousel (`FilmstripCards`)
Displays items in a horizontal list where cards expand on hover.
* **Aspect Ratio Detection**: Reads image/video sizes using `onLoadedMetadata` and `onLoad` callbacks, then dynamically sets card widths to preserve their original aspect ratios.
* **Visual Effect**: Unfocused cards scale down and display their labels vertically.

### 2. AI Tools: Terminal Emulator (`TerminalCards`)
Loads links inside a terminal window interface.
* **Typewriter Effect**: Uses a delayed loop to simulate typing out command scripts for each list item:
  ```javascript
  const label = `> ${res.title.toLowerCase().replace(/\s+/g, "-")}`;
  // ... setInterval appends characters sequentially ...
  ```

### 3. Fonts: Specimens Display (`FontCards`)
Renders fonts using large specimens that display pangram preview strings.
* **Varied Styles**: The component loops through font sizes and weights (`font-thin`, `font-bold`) to create a diverse showcase.

### 4. Code & Repos: Parallax File Tree Gallery (`CodeCards`)
Displays repositories in columns that scroll at different speeds.
* **Parallax Formula**: Uses Framer Motion's `useScroll` hook to translate columns vertically on scroll:
  ```javascript
  const y1 = useTransform(scrollYProgress, [0, 1], [-80, 80]);
  const y2 = useTransform(scrollYProgress, [0, 1], [80, -80]);
  ```

### 5. Coding: Sticky Stacking Deck (`StickyCodingCards`)
Cards stack on top of each other as the user scrolls.
* **Transformation Calculations**: The component checks when a card reaches the top of the viewport, scaling it down and fading it out as subsequent cards stack above it:
  ```javascript
  const targetScale = useTransform(scrollY, (currentY) => {
    if (currentY <= maxScrollY) return 1;
    const progress = Math.min(1, (currentY - maxScrollY) / 700);
    return 1 - progress * 0.35; // Scale down to 0.65
  });
  ```

---

## ✉️ Submit Scene Keyframe Orchestration

The submission UI uses CSS animations to cover network latency when sending a request.

* **Component Source**: [src/RequestForm.jsx (SubmitScene)](file:///d:/antigravity/amazing-websites/src/RequestForm.jsx#L5)

```css
@keyframes envelope-lift {
  0%   { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
  30%  { transform: translateY(-12px) scale(1.04) rotate(-2deg); opacity: 1; }
  70%  { transform: translateY(-70px) scale(0.82) rotate(2deg); opacity: 0.9; }
  100% { transform: translateY(-110px) scale(0.5) rotate(-1deg); opacity: 0; }
}

@keyframes success-label {
  0%   { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
}

.envelope-anim { animation: envelope-lift 2.4s cubic-bezier(0.4,0,0.2,1) 0.15s both; }
.success-anim  { animation: success-label 0.4s ease 1.8s both; }
```

### Steps in the Submission Sequence:
1. **Transition Stage**: Submitting a request changes the component state to `sending`, rendering the animated scene.
2. **Animation Timeline**:
   * **`0.0s - 0.1s`**: Displays the envelope and target cloud shapes.
   * **`0.15s - 2.4s`**: Runs `.envelope-anim`, moving the envelope toward the cloud.
   * **`0.3s - 2.5s`**: Renders trailing particle dots using delayed CSS animations (`dot1`, `dot2`, `dot3`).
   * **`1.25s - 1.8s`**: Plays the `.tick-anim` checkbox pop-up once the envelope reaches the cloud.
   * **`1.8s - 2.2s`**: Fades in the success label message.
3. **Execution Delay**: The client sets a 2.1-second timeout before sending the request to Supabase, ensuring the animations play to completion before the form resets.
