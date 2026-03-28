import { Network } from 'lucide-react';

export default function ArgeMotorLoglari({ agentLoglari }) {
    return (
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl flex flex-col h-[400px]">
            <div className="p-4 border-b border-[#21262d]">
                <h2 className="text-sm font-black tracking-widest text-[#c9d1d9] uppercase flex items-center gap-2">
                    <Network size={14} className="text-blue-500" /> M1 MOTOR LOGLARI
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 styled-scroll">
                {agentLoglari.length === 0 && (
                    <div className="text-xs text-gray-500 text-center pt-10">Kayıtlı log yok...</div>
                )}
                {agentLoglari.map((log) => (
                    <div key={log.id} className="text-sm bg-[#0d1117] border border-[#30363d] p-3 rounded-lg text-[#8b949e]">
                        <div className="flex justify-between mb-2">
                            <span className="text-blue-400 font-mono font-bold">[{log.islem_tipi}]</span>
                            <span className="text-xs opacity-70">{new Date(log.created_at).toLocaleTimeString('tr-TR')}</span>
                        </div>
                        <div className="text-white">{log.mesaj}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
