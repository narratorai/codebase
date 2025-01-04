This document outlines the technical details, including the code style and architectural decisions, of the `primitives` layer. It is intended to evolve and be maintained alongside the `primitives` layer.

The `primitives` layer serves as the foundational level of our product's component system. All its components are self-contained, relying only on themselves and third-party libraries. Its primary purpose is to define visual styling rules and ensure consistent UX/UI across the product.

The `_TemplateComponent` directory provides a template for creating new primitives. It includes the minimal set of files required to define a new component. These files demonstrate the desired code style for the `primitives` layer:

1. **`index.ts`**: Exposes (exports) the component(s) and any other code units, such as interfaces, from the component directory.
2. **`TemplateComponent.tsx`**: Defines the component (one component per file with a single/default export).
3. **`TemplateComponent.stories.tsx`**: Contains the component's stories. Ideally, there should be only one `.stories.tsx` file per component directory, and it should share the same name as the directory. For example, the `Text/` directory contains a `Text.stories.tsx` story file.

Currently, not all primitives have consolidated stories; there is an open ticket to address this issue.

Each primitive component must be placed in a properly named directory within the `primitives` directory. A group of related components can share a single directory. For example, the `Text` directory contains the `Code`, `Strong`, `Text`, and `TextLink` primitives.

Primitives may depend on other primitives, and some exist solely to support others. For instance, the `Options` components support the `Combobox`, `Dropdown`, and `Listbox` components. Another example is the `TestingTemplates` components (currently hosting only the `Placeholder` component), which are designed for visually testing other primitives in their stories.

The `Tooltip` is the only primitive that depends on Radix UI, while all other primitives rely on Headless UI components.

The `primitives` interfaces are expected to evolve over time. To enhance visual consistency, we aim to minimize and constrain the visual control interface footprint (e.g., reducing or eliminating props such as `colors` and `size` where possible).

The stories serve three key purposes:

- **Showcasing Integration**: Demonstrating how to integrate primitives into the code.
- **UI/UX Demonstration**: Displaying their visual and functional behavior.
- **Testing**: Providing a means for visual and functional testing.
