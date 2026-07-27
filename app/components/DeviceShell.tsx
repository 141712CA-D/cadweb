/**
 * Device chrome that wraps the live-demo window while it flies in and out —
 * a MacBook lid + deck on desktop, a phone body on mobile.
 *
 * Every layer sizes itself off the single `--chrome` custom property that
 * DemoSection writes on the flying wrapper (1 = full device, 0 = docked), so a
 * scroll frame only ever touches one element. At 0 every layer collapses to
 * zero size and zero opacity, leaving the bare window behind. Geometry lives in
 * `globals.css` under `.device-*`.
 */

export type DeviceKind = "laptop" | "phone";

export default function DeviceShell({ kind }: { kind: DeviceKind }) {
  if (kind === "phone") {
    return (
      <div aria-hidden className="device-shell device-shell--phone">
        <div className="device-body" />
        <div className="device-bezel" />
        <div className="device-island" />
        <div className="device-button device-button--power" />
        <div className="device-button device-button--vol" />
        <div className="device-shadow" />
      </div>
    );
  }

  return (
    <div aria-hidden className="device-shell">
      <div className="device-body" />
      <div className="device-bezel" />
      <div className="device-camera" />
      <div className="device-base" />
      <div className="device-notch" />
      <div className="device-shadow" />
    </div>
  );
}
