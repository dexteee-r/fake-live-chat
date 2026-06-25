/**
 * index.ts — Remotion entry point. Registers the root component that declares
 * the available compositions. Auto-detected by the Remotion CLI / Studio.
 */

import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
