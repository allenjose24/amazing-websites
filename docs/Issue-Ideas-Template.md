# 💡 Bite-Sized GitHub Issue Templates

You can copy and paste the markdown content of any of these four task ideas to create new issues under the **Issues** tab on GitHub:

---

## Issue 1: Add a Search & Filter Bar to the Dashboard
* **Title**: `[FEAT] Add search and filter bar to dashboard navigation`
* **Labels**: `enhancement`, `good first issue`, `frontend`

```markdown
### 🎯 Feature Description
As the resource list grows, it becomes harder to find specific links. We need a clean, search input field at the top of the Dashboard.

### 📋 Checklist
- [ ] Add an input search field in `Dashboard.jsx` (positioned below the header inside the glassy nav).
- [ ] Implement query filtering on the `resources` state.
- [ ] Highlight matching text in resource cards.
- [ ] Render a "No results found" placeholder state when zero resources match.
```

---

## Issue 2: Preview URL Input Validator
* **Title**: `[FEAT] Add input verification for preview images`
* **Labels**: `bug`, `enhancement`, `validation`

```markdown
### 🎯 Feature Description
Currently, the "Preview image" input field in `RequestForm.jsx` accepts any URL. We should validate that the URL points to an image/video format (like `.webp` or `.webm`) before enabling form submission.

### 📋 Checklist
- [ ] Write a validation utility function in `src/lib/utils.js` (e.g., check extension matching).
- [ ] Apply verification inside `RequestForm.jsx`'s `handleSubmit` function.
- [ ] Show a red warning message below the field if the format is invalid.
- [ ] Prevent submitting the form if input fails validation.
```

---

## Issue 3: Copy Link Button on Detail Modal
* **Title**: `[FEAT] Add a clipboard copy button inside the resource details modal`
* **Labels**: `enhancement`, `ux`, `frontend`

```markdown
### 🎯 Feature Description
When a card is active and the `DetailDrawer` modal is open, users should be able to copy the resource URL directly to their clipboard.

### 📋 Checklist
- [ ] Add a copy button (using a `Copy` icon from `lucide-react`) next to the "Visit" link in `DetailDrawer` (inside `card-stack.jsx`).
- [ ] Implement `navigator.clipboard.writeText(res.url)`.
- [ ] Provide temporary visual feedback (e.g., changing the button label to "Copied!" for 1.5 seconds).
```

---

## Issue 4: Visual Warning for Browser Geolocation Denials
* **Title**: `[FEAT] Add user instructions for geolocation permissions`
* **Labels**: `ux`, `security`, `gate`

```markdown
### 🎯 Feature Description
If a user denies geolocation permission, the `LocationGate` blocks rendering. We should add a help section explaining *how* to re-enable location permissions in common browsers (Chrome, Safari, Firefox).

### 📋 Checklist
- [ ] Update the `denied` return block in `LocationGate.jsx`.
- [ ] Add expandable accordion dropdowns with browser-specific instructions.
- [ ] Style the instruction text in clean monospace/body theme variables.
```
