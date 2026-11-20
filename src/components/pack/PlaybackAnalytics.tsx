import { usePack } from "@/lib/pack-store";
import { playbackWeek } from "@/lib/playback-hours";
import { useEffect, useState } from "react";

export function PlaybackAnalytics() {
  const { state } = usePack();
  const [week, setWeek] = useState<string | null>(null);
  useEffect(() => { setWeek(playbackWeek(Date.now())); }, []);
  const weeks = [...new Set([...(week ? [week] : []), ...state.playbackHours.map(row => row.week)])].sort().reverse().slice(0, 8);
  const total = state.playbackHours.filter(row => row.week === week).reduce((sum, row) => sum + row.seconds, 0);
  return <section className="mt-8">
    <h2 className="pk-h2">Playback analytics</h2>
    <p className="mt-2 text-sm">This browser only · simulated player time · weeks start Monday, Perth time.</p>
    <div className="mt-4 grid sm:grid-cols-3 gap-4">
      <div className="pk-card"><p className="pk-eyebrow">Pack artist hours this week</p><p className="pk-h2 mt-2">{(total / 3600).toFixed(3)} h</p><p className="text-sm mt-1">{Math.round(total)} seconds · simulated</p></div>
      {(["listener", "business"] as const).map(source => <div key={source} className="pk-card"><p className="pk-eyebrow">{source === "listener" ? "Listeners" : "Businesses"}</p><p className="pk-h2 mt-2">{(state.playbackHours.filter(row => row.week === week && row.source === source).reduce((sum, row) => sum + row.seconds, 0) / 3600).toFixed(3)} h</p><p className="text-sm mt-1">This week · simulated</p></div>)}
    </div>
    <div className="mt-5 overflow-x-auto"><table className="pk-table"><thead><tr><th>Week beginning</th><th>Listener hours</th><th>Business hours</th><th>Total hours</th></tr></thead><tbody>{weeks.map(w => {
      const hours = (source?: string) => state.playbackHours.filter(row => row.week === w && (!source || row.source === source)).reduce((sum, row) => sum + row.seconds, 0) / 3600;
      return <tr key={w}><td>{w}</td><td>{hours("listener").toFixed(3)}</td><td>{hours("business").toFixed(3)}</td><td>{hours().toFixed(3)}</td></tr>;
    })}</tbody></table></div>
    {total === 0 && <p className="mt-3 text-sm">No playback time recorded this week.</p>}
  </section>;
}