import { ImageResponse } from "next/og";

export function gymIcon(size: number) {
  const inner = Math.round(size * 0.4);
  const radius = Math.max(8, Math.round(size * 0.12));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0b",
        }}
      >
        <div
          style={{
            width: inner,
            height: inner,
            borderRadius: radius,
            background: "#22c55e",
          }}
        />
      </div>
    ),
    { width: size, height: size },
  );
}
