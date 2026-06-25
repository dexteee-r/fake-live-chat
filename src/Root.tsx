/**
 * Root.tsx — Declares the composition(s). `calculateMetadata` derives the video
 * size / fps / duration from the editable props, so the Studio sliders for
 * width, height, fps and duration take effect immediately.
 */

import React from "react";
import { Composition } from "remotion";
import { ChatOverlay } from "./ChatOverlay";
import { chatSchema, DEFAULT_PROPS } from "./config";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ChatOverlay"
      component={ChatOverlay}
      schema={chatSchema}
      defaultProps={DEFAULT_PROPS}
      durationInFrames={DEFAULT_PROPS.durationInSeconds * DEFAULT_PROPS.fps}
      fps={DEFAULT_PROPS.fps}
      width={DEFAULT_PROPS.width}
      height={DEFAULT_PROPS.height}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.round(props.durationInSeconds * props.fps),
        fps: props.fps,
        width: props.width,
        height: props.height,
      })}
    />
  );
};
