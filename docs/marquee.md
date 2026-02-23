# Marquee

Duplicates and scrolls content in an infinite loop, horizontally or vertically. Handles images, Webflow dropdowns inside marquee items, Safari-specific rendering, and mobile devices.

**Source:** [`src/modules/marquee.js`](../src/modules/marquee.js)

## Attributes

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-marquee` | — | — | Enables marquee on the container |
| `data-bb-marquee-direction` | `left` \| `right` \| `top` \| `bottom` | `left` | Scroll direction |
| `data-bb-marquee-speed` | number | `100` | Speed in pixels/second |
| `data-bb-marquee-pause` | `true` \| `false` | `true` | Pause animation on hover |
| `data-bb-marquee-gap` | number | `50` | Gap between repeated blocks (px) |
| `data-bb-marquee-orientation` | `horizontal` \| `vertical` | `horizontal` | Scroll orientation |
| `data-bb-marquee-height` | number \| `auto` | `300` | Vertical container height (px or `auto`) |
| `data-bb-marquee-min-height` | CSS value | — | Minimum container height |

## Usage

### Basic Horizontal Marquee

```html
<div data-bb-marquee data-bb-marquee-speed="80">
  <div class="bb-marquee_item">Item 1</div>
  <div class="bb-marquee_item">Item 2</div>
  <div class="bb-marquee_item">Item 3</div>
</div>
```

### Vertical Marquee

```html
<div data-bb-marquee data-bb-marquee-orientation="vertical" data-bb-marquee-height="400">
  <div class="bb-marquee_item">Item 1</div>
  <div class="bb-marquee_item">Item 2</div>
</div>
```

### Reverse Direction

```html
<div data-bb-marquee data-bb-marquee-direction="right" data-bb-marquee-speed="120">
  <!-- items -->
</div>
```

## How It Works

1. **Content capture** — The original HTML content is captured, then wrapped into a flex container.
2. **Image preloading** — All images (including lazy-loaded `data-src`) are preloaded before the animation starts. A timeout prevents infinite waits.
3. **Triplication** — The content block is cloned twice (3 copies total) to create a seamless loop.
4. **Animation** — A `requestAnimationFrame` loop translates the scroll container. When the offset reaches a threshold, it resets seamlessly.
5. **Safari path** — Safari gets a separate animation path (`initSafariAnimation`) with additional GPU-acceleration hints (`translate3d`, `backfaceVisibility`, `will-change`) and SVG image fixes.
6. **Dropdown support** — Webflow `.w-dropdown` elements inside marquee items are portal-cloned to `document.body` on hover, so they render above the marquee and follow the toggle on scroll/resize.

## Behavior Notes

- Items are detected using `.bb-marquee_item`, `[role="listitem"]`, or direct children (`:scope > *`).
- The parent's `overflow` is preserved if it was already set; otherwise defaults to `hidden`.
- Horizontal marquees auto-compute their height from the tallest item.
- The marquee pauses when a dropdown inside it is open (`data-bb-marquee-dropdown-open`).
- Mobile devices get shorter image-wait timeouts for faster initialization.

## CSS Classes Created

| Class/Attribute | Purpose |
|---|---|
| `data-bb-marquee-processed` | Marks processed containers (re-init guard) |
| `data-bb-marquee-dropdown-open` | Set when a dropdown portal is open |
| `data-bb-marquee-dropdown-portal` | Portal wrapper appended to `document.body` |
