export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span
      className="font-display font-extrabold bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent"
      style={{ fontSize: size }}
    >
      LabaLab
    </span>
  );
}
