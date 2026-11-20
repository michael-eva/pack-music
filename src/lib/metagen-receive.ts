// Placeholder receive handler for releases sent from MetaGen.
// Replace with the real transfer listener; the screen only consumes progress.
export const SHOW_METAGEN_NOTES = true;

export type ReceiveProgress = { receivedMb: number; totalMb: number; done: boolean };

export function startReceive(onProgress: (p: ReceiveProgress) => void, startMb = 412, totalMb = 1100) {
  let mb = startMb;
  onProgress({ receivedMb: mb, totalMb, done: false });
  const t = setInterval(() => {
    mb = Math.min(totalMb, mb + 60);
    const done = mb >= totalMb;
    onProgress({ receivedMb: mb, totalMb, done });
    if (done) clearInterval(t);
  }, 400);
  return () => clearInterval(t);
}
