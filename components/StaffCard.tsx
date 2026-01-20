
import React, { useState, useRef } from 'react';
import { StaffMember, Role, DayOfWeek } from '../types';
import SkillBadge from './SkillBadge';
import * as htmlToImage from 'html-to-image';

interface StaffCardProps {
  member: StaffMember;
  viewMode: 'talents' | 'planning';
  onEdit: () => void;
}

const DAYS: DayOfWeek[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

const StaffCard: React.FC<StaffCardProps> = ({ member, viewMode, onEdit }) => {
  const [imgError, setImgError] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const compactCaptureRef = useRef<HTMLDivElement>(null);

  const getRoleTheme = (role: Role) => {
    switch (role) {
      case Role.DEVELOPER: 
        return { 
          border: 'border-sky-500', 
          bg: 'bg-sky-500', 
          light: 'bg-sky-50', 
          dark: 'bg-sky-900', 
          text: 'text-sky-600',
          accent: 'sky-400',
          hudColor: 'rgba(14, 165, 233, 0.2)'
        };
      case Role.BUSINESS_ANALYST: 
        return { 
          border: 'border-amber-500', 
          bg: 'bg-amber-500', 
          light: 'bg-amber-50', 
          dark: 'bg-amber-900', 
          text: 'text-amber-600',
          accent: 'amber-400',
          hudColor: 'rgba(245, 158, 11, 0.2)'
        };
      case Role.MANAGER: 
        return { 
          border: 'border-purple-600', 
          bg: 'bg-purple-600', 
          light: 'bg-purple-50', 
          dark: 'bg-purple-900', 
          text: 'text-purple-600',
          accent: 'purple-400',
          hudColor: 'rgba(147, 51, 234, 0.2)'
        };
      default: 
        return { 
          border: 'border-slate-500', 
          bg: 'bg-slate-500', 
          light: 'bg-slate-50', 
          dark: 'bg-slate-900', 
          text: 'text-slate-600',
          accent: 'slate-400',
          hudColor: 'rgba(100, 116, 139, 0.2)'
        };
    }
  };

  const theme = getRoleTheme(member.role);

  const getRoleStage = (role: Role) => {
    switch (role) {
      case Role.DEVELOPER: return 'Stage 2 - Tactical Operator';
      case Role.BUSINESS_ANALYST: return 'Stage 1 - Fleet Strategist';
      case Role.MANAGER: return 'Stage 3 - Squadron Leader';
      default: return 'Basic - Flight Crew';
    }
  };

  const getProviderIcon = (provider: string) => {
    const p = provider.toLowerCase();
    if (p.includes('aws')) return 'fa-brands fa-aws text-orange-400';
    if (p.includes('microsoft') || p.includes('azure')) return 'fa-brands fa-microsoft text-blue-400';
    if (p.includes('google')) return 'fa-brands fa-google text-red-400';
    if (p.includes('angular')) return 'fa-brands fa-angular text-red-600';
    if (p.includes('meta') || p.includes('react')) return 'fa-brands fa-react text-sky-400';
    if (p.includes('hashicorp')) return 'fa-solid fa-square-h text-purple-400';
    if (p.includes('scrum')) return 'fa-solid fa-s text-sky-400';
    if (p.includes('cncf') || p.includes('kubernetes')) return 'fa-solid fa-dharmachakra text-blue-500';
    return 'fa-solid fa-award text-amber-500';
  };

  const displayedSkills = member.skills.slice(0, 4);
  const totalPower = displayedSkills.reduce((sum, s) => sum + (s.level * 20), 0);

  const handleCopyAsImage = async () => {
    if (!compactCaptureRef.current) return;
    setCopyStatus('loading');
    
    try {
      const isDark = document.documentElement.classList.contains('dark');
      const options = {
        backgroundColor: isDark ? '#020617' : '#ffffff',
        pixelRatio: 3,
        cacheBust: true,
        style: { transform: 'scale(1)', opacity: '1', visibility: 'visible' }
      };

      await new Promise(r => setTimeout(r, 100));
      const blob = await htmlToImage.toBlob(compactCaptureRef.current, options);

      if (blob) {
        if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
          try {
            const data = [new ClipboardItem({ [blob.type]: blob })];
            await navigator.clipboard.write(data);
            setCopyStatus('success');
          } catch (clipErr) {
            downloadFallback(blob);
          }
        } else {
          downloadFallback(blob);
        }
      }
    } catch (err) {
      console.error('Erreur export :', err);
      setCopyStatus('error');
    } finally {
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

  const downloadFallback = (blob: Blob) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tcg-aviation-${member.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
    setCopyStatus('success');
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const imageSrc = member.avatar.startsWith('http') || member.avatar.startsWith('input_file_') 
    ? member.avatar 
    : `./${member.avatar}`;

  return (
    <div className="staff-card relative p-8 flex flex-col items-center group h-fit self-start transition-all duration-300 min-h-[520px] border bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-sky-100 dark:border-sky-900/30 rounded-2xl shadow-xl">
      
      {/* --- BADGE DE CAPTURE (TCG POKEMON STYLE - HUD AVIATION) --- */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none">
        <div 
          ref={compactCaptureRef}
          className={`w-[420px] h-[588px] p-[16px] ${theme.bg} dark:bg-slate-900 flex flex-col items-center relative overflow-hidden font-sans border-[12px] ${theme.border} dark:border-slate-800 rounded-[2.5rem] shadow-none`}
        >
          {/* Effet Holographique Global */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/40 mix-blend-overlay pointer-events-none z-20"></div>
          
          <div className="w-full h-full bg-[#f6f5f0] dark:bg-slate-950 rounded-[1.2rem] flex flex-col p-4 border border-black/20 relative overflow-hidden">
             
             {/* Header : Nom & Puissance Totale */}
             <div className="w-full flex justify-between items-end mb-2 px-1">
                <div className="flex flex-col">
                  <p className="text-[7px] font-black italic uppercase text-slate-400 leading-none mb-1">{getRoleStage(member.role)}</p>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none tracking-tight drop-shadow-sm">{member.name}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{totalPower}</span>
                  <div className={`w-7 h-7 rounded-full ${theme.bg} shadow-lg flex items-center justify-center border border-white/30`}>
                    <i className="fa-solid fa-plane-up text-[14px] text-white"></i>
                  </div>
                </div>
             </div>

             {/* Illustration Image (HUD Aviation Cockpit + Holographic) */}
             <div className={`w-full aspect-[4/3] rounded-lg border-[4px] ${theme.border} dark:border-slate-700 shadow-xl overflow-hidden relative bg-slate-950 p-8 flex items-center justify-center`}>
                
                {/* Background HUD Aviation */}
                <div className="absolute inset-0 pointer-events-none opacity-40" style={{
                  backgroundImage: `
                    radial-gradient(circle at center, ${theme.hudColor} 0%, transparent 75%),
                    repeating-linear-gradient(0deg, transparent 0, transparent 1px, ${theme.hudColor} 1px, ${theme.hudColor} 2px),
                    repeating-linear-gradient(90deg, transparent 0, transparent 1px, ${theme.hudColor} 1px, ${theme.hudColor} 2px)
                  `,
                  backgroundSize: '100% 100%, 20px 20px, 20px 20px'
                }}></div>

                {/* Avatar cadré sans coupe */}
                <img 
                  src={imageSrc} 
                  crossOrigin="anonymous" 
                  className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110" 
                  alt="" 
                />

                {/* Overlay HUD Elements */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none z-10">
                   <div className={`w-[85%] h-[85%] border border-${theme.accent} rounded-full border-dashed animate-pulse-slow`}></div>
                   <div className={`absolute w-full h-[0.5px] bg-${theme.accent}`}></div>
                   <div className={`absolute h-full w-[0.5px] bg-${theme.accent}`}></div>
                   
                   {/* HUD Text Indicators */}
                   <div className="absolute top-4 left-4 text-[8px] font-black text-white/50 tracking-widest uppercase">Alt: 32000ft</div>
                   <div className="absolute bottom-4 right-4 text-[8px] font-black text-white/50 tracking-widest uppercase">HDG: 275°</div>
                </div>
             </div>

             {/* Bandeau Projet / ID */}
             <div className={`w-[94%] -mt-3 self-center h-5 ${theme.bg} dark:bg-slate-800 rounded-sm shadow-md border border-white/40 flex items-center justify-center px-4 relative z-30`}>
                <p className="text-[8px] font-black italic text-white dark:text-sky-300 uppercase tracking-[0.25em]">
                   {member.id.toUpperCase()} // AIRBUS UNIT // SECTOR 116
                </p>
             </div>

             {/* Skills Area (Attacks - 4 compétences avec police réduite) */}
             <div className="flex-1 flex flex-col justify-center gap-2 mt-4 px-1">
                {displayedSkills.map((skill, idx) => (
                  <div key={idx} className="flex items-center border-b border-slate-200 dark:border-slate-800 pb-1.5 last:border-0">
                    <div className="flex gap-0.5 mr-3">
                       <div className={`w-5 h-5 rounded-full ${theme.bg} flex items-center justify-center border border-white/30 shadow-md`}>
                         <i className="fa-solid fa-bolt text-[9px] text-white"></i>
                       </div>
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tighter truncate">{skill.name} Blast</h4>
                       <p className="text-[7px] text-slate-500 dark:text-slate-400 leading-tight italic truncate">Mise en œuvre : Niveau {skill.level}.</p>
                    </div>
                    <span className="text-[11px] font-black text-slate-800 dark:text-white ml-2">{skill.level * 20}</span>
                  </div>
                ))}
             </div>

             {/* Footer : Stats TCG */}
             <div className="mt-3 pt-2 border-t border-slate-300 dark:border-slate-800 grid grid-cols-3 text-center gap-2">
                <div>
                   <p className="text-[6px] font-black uppercase text-slate-400">Weakness</p>
                   <i className="fa-solid fa-mug-hot text-amber-900 text-[11px] mt-1"></i>
                </div>
                <div>
                   <p className="text-[6px] font-black uppercase text-slate-400">Resistance</p>
                   <div className="flex justify-center gap-1.5 mt-1">
                      {member.certifications?.slice(0, 2).map((c, i) => <i key={i} className={`${getProviderIcon(c.provider)} text-[10px]`}></i>)}
                   </div>
                </div>
                <div>
                   <p className="text-[6px] font-black uppercase text-slate-400">Retreat</p>
                   <div className="flex justify-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                   </div>
                </div>
             </div>

             {/* Final Line Footer */}
             <div className="mt-2.5 flex justify-between items-end px-1">
                <p className="text-[5px] font-bold text-slate-400 italic uppercase">Illus. SkyCenter Studio © 2025 Airbus Squadron. RARE 1ST ED.</p>
                <div className="px-2 h-3.5 bg-slate-200 dark:bg-slate-800 rounded-sm flex items-center justify-center border border-black/10">
                   <span className="text-[5px] font-black text-slate-500 tracking-widest">{member.id}</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- ACTIONS --- */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <button 
          onClick={handleCopyAsImage} 
          disabled={copyStatus === 'loading'}
          className={`action-button w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg backdrop-blur-md
            ${copyStatus === 'success' ? 'bg-emerald-500 text-white opacity-100' : 
              copyStatus === 'error' ? 'bg-red-500 text-white opacity-100' : 
              'bg-white/50 dark:bg-slate-800/50 text-gray-400 hover:text-sky-500 opacity-0 group-hover:opacity-100'}`}
          title="Générer carte"
        >
          {copyStatus === 'loading' ? <i className="fa-solid fa-spinner fa-spin text-xs"></i> :
           copyStatus === 'success' ? <i className="fa-solid fa-check"></i> :
           copyStatus === 'error' ? <i className="fa-solid fa-triangle-exclamation"></i> :
           <i className="fa-solid fa-fire-flame-curved"></i>}
        </button>
        <button onClick={onEdit} className="action-button w-10 h-10 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-sky-500 transition-all opacity-0 group-hover:opacity-100 shadow-lg">
          <i className="fa-solid fa-sliders"></i>
        </button>
      </div>
      
      {/* VUE CARTE STANDARD */}
      <div className="relative w-full flex justify-center mb-6">
        <div className="absolute left-0 top-2 grid grid-rows-4 grid-flow-col gap-2">
          {member.certifications?.map((cert, i) => (
            <div key={i} className="relative group/cert">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-gray-100 dark:border-sky-500/20 shadow-sm flex items-center justify-center cursor-help hover:border-sky-400 transition-colors">
                <i className={`${getProviderIcon(cert.provider)} text-sm`}></i>
              </div>
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest whitespace-nowrap rounded-lg shadow-xl opacity-0 group-hover/cert:opacity-100 pointer-events-none transition-opacity z-30 border border-sky-500/30">
                {cert.name}
              </div>
            </div>
          ))}
        </div>

        <div className="relative">
          <div className={`w-32 h-32 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg ring-2 ring-${theme.bg.split('-')[1]}-400/30`}>
            {!imgError ? (
              <img 
                src={imageSrc} 
                alt={member.name} 
                crossOrigin="anonymous" 
                onError={() => setImgError(true)} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 brightness-[1.05]" 
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-3xl font-black text-white ${theme.bg}`}>
                {getInitials(member.name)}
              </div>
            )}
          </div>
          <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white dark:border-slate-800 ${theme.bg} shadow-md flex items-center justify-center text-[10px] text-white font-bold`}>
            <i className="fa-solid fa-certificate"></i>
          </div>
        </div>
      </div>
      
      <div className="text-center mb-6 w-full">
        <h3 className="text-xl font-black truncate px-2 dark:text-white">{member.name}</h3>
        <span className={`inline-block mt-2 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black ${theme.light} ${theme.text} dark:bg-sky-900/30 dark:text-sky-300`}>
          {member.role}
        </span>
      </div>
      
      <div className="w-full mt-2 pt-6 border-t border-gray-100 dark:border-slate-800 flex-1">
        {viewMode === 'talents' ? (
          <div className="space-y-4">
             <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-4">Systèmes</h4>
             {member.skills.slice(0, 5).map((skill, idx) => (
               <SkillBadge key={idx} skill={skill} color={theme.bg} />
             ))}
          </div>
        ) : (
          <div className="space-y-3">
             <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-4">Escale & Poste</h4>
             {DAYS.map((day) => {
                const loc = member.presence.schedule[day];
                return (
                  <div key={day} className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${loc ? 'bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900/30' : 'opacity-30'}`}>
                    <span className="text-[10px] font-black uppercase dark:text-white">{day}</span>
                    <span className={`text-[9px] font-black ${theme.text} truncate max-w-[140px] flex items-center gap-1`}>
                      {loc ? <><i className="fa-solid fa-plane-arrival text-[8px]"></i>{loc}</> : <span className="opacity-50">Télétravail</span>}
                    </span>
                  </div>
                );
             })}
          </div>
        )}
      </div>

      <div className="contact-section mt-8 pt-6 w-full flex justify-center border-t border-gray-50 dark:border-white/5">
        <a href={`mailto:${member.email}`} className="text-gray-400 hover:text-sky-600 transition-all flex items-center gap-2">
          <i className="fa-solid fa-tower-control"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">Liaison Radio</span>
        </a>
      </div>
    </div>
  );
};

export default StaffCard;
