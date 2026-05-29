export function Logo({ size = 96 }: { size?: number }) {
  return (
    <div
      className="relative mx-auto rounded-full glass-strong glow flex items-center justify-center pulse-glow"
      style={{ width: size, height: size }}
    >
      <img src="/icons/sfx-logo.png" alt="SFX" className="w-[88%] h-[88%] object-contain" />
    </div>
  );
}
