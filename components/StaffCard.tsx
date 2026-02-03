
import React, { useState, useRef } from 'react';
import { StaffMember, Role, DayOfWeek } from '../types';
import SkillBadge from './SkillBadge';
import * as htmlToImage from 'html-to-image';

interface StaffCardProps {
  member: StaffMember;
  viewMode: 'talents' | 'planning';
  isEditable: boolean;
  onEdit: () => void;
}

const DAYS: DayOfWeek[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

const StaffCard: React.FC<StaffCardProps> = ({ member, viewMode, isEditable, onEdit }) => {
  const [imgError, setImgError] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const compactCaptureRef = useRef<HTMLDivElement>(null);

  const getRoleTheme = (role: Role) => {
    switch (role) {
      case Role.DEVELOPER: 
        return { 
          border: 'border-sky-500', bg: 'bg-sky-500', light: 'bg-sky-50', dark: 'bg-sky-900', 
          text: 'text-sky-600', accent: 'sky-400', hudColor: 'rgba(14, 165, 233, 0.2)' 
        };
      case Role.BUSINESS_ANALYST: 
        return { 
          border: 'border-amber-500', bg: 'bg-amber-500', light: 'bg-amber-50', dark: 'bg-amber-900', 
          text: 'text-amber-600', accent: 'amber-400', hudColor: 'rgba(245, 158, 11, 0.2)' 
        };
      case Role.MANAGER: 
        return { 
          border: 'border-purple-600', bg: 'bg-purple-600', light: 'bg-purple-50', dark: 'bg-purple-900', 
          text: 'text-purple-600', accent: 'purple-400', hudColor: 'rgba(147, 51, 234, 0.2)' 
        };
      default: 
        return { border: 'border-slate-500', bg: 'bg-slate-500', light: 'bg-slate-50', dark: 'bg-slate-900', text: 'text-slate-600', accent: 'slate-400', hudColor: 'rgba(100, 116, 139, 0.2)' };
    }
  };

  const theme = getRoleTheme(member.role);
  const displayedSkills = member.skills.slice(0, 4);
  const totalPower = displayedSkills.reduce((sum, s) => sum + (s.level * 20), 0);

  const handleCopyAsImage = async () => {
    if (!compactCaptureRef.current) return;
    setCopyStatus('loading');
    
    try {
      const isDark = document.documentElement.classList.contains('dark');
      
      const options = {
        backgroundColor: isDark ? '#020617' : '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true, // Crucial : ignore les polices distantes pour éviter l'erreur de sécurité CSS
        fontEmbedCSS: '', // Désactive l'embedding pour contourner les restrictions CORS
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
        filter: (node: any) => {
          if (node.classList?.contains('action-button')) return false;
          return true;
        }
      };

      console.log("Démarrage de la capture TCG pour:", member.name);
      
      const dataUrl = await htmlToImage.toPng(compactCaptureRef.current, options);
      
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopyStatus('success');
          console.log("Copié dans le presse-papiers");
        } catch (e) {
          console.warn("Échec du presse-papiers, téléchargement direct lancé");
          downloadFallback(dataUrl);
        }
      } else {
        downloadFallback(dataUrl);
      }
    } catch (err) {
      console.error('Erreur critique lors de l\'exportation :', err);
      setCopyStatus('error');
    } finally {
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

  const downloadFallback = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `tcg-aviation-${member.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
    setCopyStatus('success');
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const imageSrc = member.avatar.startsWith('http') || member.avatar.startsWith('input_file_') ? member.avatar : `./${member.avatar}`;

  return (
    <div className="staff-card relative p-8 flex flex-col items-center group h-fit self-start transition-all duration-300 min-h-[520px] border bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-sky-100 dark:border-sky-900/30 rounded-2xl shadow-xl">
      {/* Element caché pour la capture haute qualité */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none">
        <div ref={compactCaptureRef} className={`w-[420px] h-[588px] p-[16px] ${theme.bg} dark:bg-slate-900 flex flex-col items-center relative overflow-hidden font-sans border-[12px] ${theme.border} dark:border-slate-800 rounded-[2.5rem]`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/40 mix-blend-overlay z-20"></div>
          <div className="w-full h-full bg-[#f6f5f0] dark:bg-slate-950 rounded-[1.2rem] flex flex-col p-4 border border-black/20 relative overflow-hidden">
             <div className="w-full flex justify-between items-end mb-2 px-1">
                <div><p className="text-[7px] font-black italic uppercase text-slate-400 leading-none mb-1">Squadron Operational</p><h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none">{member.name}</h3></div>
                <div className="flex items-center gap-1.5"><span className="text-2xl font-black text-slate-800 dark:text-white">{totalPower}</span><div className={`w-7 h-7 rounded-full ${theme.bg} shadow-lg flex items-center justify-center border border-white/30`}><i className="fa-solid fa-plane-up text-[14px] text-white"></i></div></div>
             </div>
             <div className={`w-full aspect-[4/3] rounded-lg border-[4px] ${theme.border} shadow-xl overflow-hidden relative bg-slate-950 p-8 flex items-center justify-center`}>
                <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `radial-gradient(circle at center, ${theme.hudColor} 0%, transparent 75%)` }}></div>
                <img src={imageSrc} crossOrigin="anonymous" className="w-full h-full object-contain relative z-10 scale-110" alt="" />
             </div>
             <div className={`w-[94%] -mt-3 self-center h-5 ${theme.bg} rounded-sm shadow-md border border-white/40 flex items-center justify-center px-4 relative z-30`}><p className="text-[8px] font-black italic text-white uppercase tracking-[0.25em]">{member.id.toUpperCase()}</p></div>
             <div className="flex-1 flex flex-col justify-center gap-2 mt-4 px-1">
                {displayedSkills.map((skill, idx) => (
                  <div key={idx} className="flex items-center border-b border-slate-200 dark:border-slate-800 pb-1.5 last:border-0">
                    <div className={`w-5 h-5 rounded-full ${theme.bg} flex items-center justify-center border border-white/30 mr-3`}><i className="fa-solid fa-bolt text-[9px] text-white"></i></div>
                    <div className="flex-1"><h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tighter truncate">{skill.name} Blast</h4><p className="text-[7px] text-slate-500 italic truncate">Niveau {skill.level}</p></div>
                    <span className="text-[11px] font-black text-slate-800 dark:text-white ml-2">{skill.level * 20}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <button onClick={handleCopyAsImage} disabled={copyStatus === 'loading'} className={`action-button w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${copyStatus === 'success' ? 'bg-emerald-500 text-white opacity-100' : 'bg-white/50 dark:bg-slate-800/50 text-gray-400 hover:text-sky-500 opacity-0 group-hover:opacity-100'}`}>
          {copyStatus === 'loading' ? <i className="fa-solid fa-spinner fa-spin text-xs"></i> : copyStatus === 'success' ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-fire-flame-curved"></i>}
        </button>
        {isEditable && (
          <button onClick={onEdit} className="action-button w-10 h-10 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-sky-500 transition-all opacity-0 group-hover:opacity-100 shadow-lg"><i className="fa-solid fa-sliders"></i></button>
        )}
      </div>
      
      <div className="relative w-full flex justify-center mb-6">
        <div className="relative"><div className={`w-32 h-32 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg ring-2 ring-${theme.bg.split('-')[1]}-400/30`}>{!imgError ? (<img src={imageSrc} alt={member.name} crossOrigin="anonymous" onError={() => setImgError(true)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />) : (<div className={`w-full h-full flex items-center justify-center text-3xl font-black text-white ${theme.bg}`}>{getInitials(member.name)}</div>)}</div><div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white dark:border-slate-800 ${theme.bg} shadow-md flex items-center justify-center text-[10px] text-white font-bold`}><i className="fa-solid fa-certificate"></i></div></div>
      </div>
      
      <div className="text-center mb-6 w-full"><h3 className="text-xl font-black truncate px-2 dark:text-white">{member.name}</h3><span className={`inline-block mt-2 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black ${theme.light} ${theme.text} dark:bg-sky-900/30 dark:text-sky-300`}>{member.role}</span></div>
      <div className="w-full mt-2 pt-6 border-t border-gray-100 dark:border-slate-800 flex-1">
        {viewMode === 'talents' ? (<div className="space-y-4"><h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-4">Systèmes</h4>{member.skills.slice(0, 5).map((skill, idx) => (<SkillBadge key={idx} skill={skill} color={theme.bg} />))}</div>) : (<div className="space-y-3"><h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-4">Escale & Poste</h4>{DAYS.map((day) => { const loc = member.presence.schedule[day]; return (<div key={day} className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${loc ? 'bg-sky-50 dark:bg-sky-900/20' : 'opacity-30'}`}><span className="text-[10px] font-black uppercase dark:text-white">{day}</span><span className={`text-[9px] font-black ${theme.text} truncate max-w-[140px] flex items-center gap-1`}>{loc ? <><i className="fa-solid fa-plane-arrival text-[8px]"></i>{loc}</> : <span className="opacity-50">Base</span>}</span></div>); })}</div>)}
      </div>
    </div>
  );
};

export default StaffCard;
