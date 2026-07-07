
import React, { useState, useRef } from 'react';
import { StaffMember, Role, DayOfWeek } from '../types';
import SkillBadge from './SkillBadge';
import * as htmlToImage from 'html-to-image';

interface StaffCardProps {
  member: StaffMember;
  viewMode: 'talents' | 'planning';
  isEditable: boolean;
  onEdit: () => void;
  onChocoblast?: () => void;
}

const DAYS: DayOfWeek[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

const SvgIcons = {
  droplet: <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>,
  leaf: <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c3.49 1.04 7.21 1.04 10.7 0c1.76-2.12 3.51-6.15 3.51-9.7c0-2.31-1.35-4.22-3.87-5.5z" /></svg>,
  skull: <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M12 2a7 7 0 0 0-7 7v3.5a3.5 3.5 0 0 0 3.5 3.5h7a3.5 3.5 0 0 0 3.5-3.5V9a7 7 0 0 0-7-7z M9 18v3h2v-3 M13 18v3h2v-3" /></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  fire: <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M12 23a7.5 7.5 0 0 0 7.5-7.5c0-4.14-3.36-7.5-7.5-13.5c-4.14 6-7.5 9.36-7.5 13.5A7.5 7.5 0 0 0 12 23" /></svg>
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
  if (p.includes('istqb')) return 'fa-solid fa-vial text-emerald-400';
  return 'fa-solid fa-award text-amber-500';
};

const StaffCard: React.FC<StaffCardProps> = ({ member, viewMode, isEditable, onEdit, onChocoblast }) => {
  const [imgError, setImgError] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const compactCaptureRef = useRef<HTMLDivElement>(null);

  const getRoleTheme = (role: Role) => {
    switch (role) {
      case Role.DEVELOPER: 
        return { 
          border: 'border-sky-500', bg: 'bg-sky-500', light: 'bg-sky-50', dark: 'bg-sky-900', 
          text: 'text-sky-600', accent: 'sky-400', hudColor: 'rgba(14, 165, 233, 0.2)',
          pokemonType: 'Eau', pokemonIcon: 'droplet', pokemonColor: 'text-sky-500', energyColor: 'bg-sky-500'
        };
      case Role.BUSINESS_ANALYST: 
        return { 
          border: 'border-emerald-500', bg: 'bg-emerald-500', light: 'bg-emerald-50', dark: 'bg-emerald-900', 
          text: 'text-emerald-600', accent: 'emerald-400', hudColor: 'rgba(16, 185, 129, 0.2)',
          pokemonType: 'Plante', pokemonIcon: 'leaf', pokemonColor: 'text-emerald-500', energyColor: 'bg-emerald-500'
        };
      case Role.MANAGER: 
        return { 
          border: 'border-purple-600', bg: 'bg-purple-600', light: 'bg-purple-50', dark: 'bg-purple-900', 
          text: 'text-purple-600', accent: 'purple-400', hudColor: 'rgba(147, 51, 234, 0.2)',
          pokemonType: 'Poison', pokemonIcon: 'skull', pokemonColor: 'text-purple-500', energyColor: 'bg-purple-600'
        };
      default: 
        return { border: 'border-slate-500', bg: 'bg-slate-500', light: 'bg-slate-50', dark: 'bg-slate-900', text: 'text-slate-600', accent: 'slate-400', hudColor: 'rgba(100, 116, 139, 0.2)', pokemonType: 'Normal', pokemonIcon: 'star', pokemonColor: 'text-slate-500', energyColor: 'bg-slate-400' };
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
        skipFonts: false, 
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
  const imageSrc = member.avatar.startsWith('http') || member.avatar.startsWith('input_file_') || member.avatar.startsWith('/') 
    ? member.avatar 
    : `./${member.avatar}`;

  return (
    <div className="staff-card tech-corners glass-panel relative p-8 flex flex-col items-center group h-fit self-start transition-all duration-300 min-h-[520px] rounded-2xl shadow-xl">
      {/* Element caché pour la capture haute qualité */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none">
        <div ref={compactCaptureRef} className="w-[420px] h-[588px] p-[16px] bg-[#f4d03f] flex flex-col items-center relative overflow-hidden font-sans border-[12px] border-[#d4af37] rounded-[2.5rem] shadow-2xl">
          {/* Card inner body */}
          <div className="w-full h-full bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] dark:from-slate-800 dark:to-slate-900 rounded-[1.2rem] flex flex-col p-4 relative overflow-hidden ring-4 ring-slate-300 dark:ring-slate-700">
             <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at top right, ${theme.hudColor.replace('0.2', '0.8')} 0%, transparent 70%)` }}></div>
             
             {/* HEADER */}
             <div className="w-full flex justify-between items-center mb-3 px-1 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black font-sans uppercase italic text-slate-500">BASE</span>
                  <h3 className="text-2xl font-black font-sans tracking-tight text-slate-800 dark:text-white leading-none">{member.name}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 mr-0.5">PV</span>
                  <span className="text-[26px] font-black font-sans text-slate-800 dark:text-white leading-none">{Math.max(50, totalPower)}</span>
                  <div className={`w-8 h-8 rounded-full ${theme.energyColor} shadow-inner flex items-center justify-center border-[2.5px] border-white/90`}>
                    <div className="w-3.5 h-3.5 text-white flex items-center justify-center">
                      {SvgIcons[theme.pokemonIcon as keyof typeof SvgIcons]}
                    </div>
                  </div>
                </div>
             </div>

             {/* IMAGE BEVEL FRAME */}
             <div className="w-full h-[220px] rounded-sm border-[5px] border-[#b0b0b0] dark:border-slate-600 shadow-[inset_0_0_15px_rgba(0,0,0,0.6)] overflow-hidden relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-1">
                <div className="absolute inset-0 opacity-60" style={{ backgroundImage: `radial-gradient(circle at center, ${theme.hudColor.replace('0.2', '0.6')} 0%, transparent 100%)` }}></div>
                <img src={imageSrc} crossOrigin="anonymous" className="w-full h-full object-cover relative z-10" alt="" />
             </div>

             {/* POKEDEX INFO STRIP */}
             <div className="w-full h-5 bg-gradient-to-r from-[#fef08a] via-[#fde047] to-[#fef08a] border border-[#ca8a04]/50 flex items-center justify-center mb-4 relative z-10 shadow-sm">
               <p className="text-[8.5px] font-semibold font-sans text-slate-800 italic tracking-wide">
                 NO. {member.id.substring(0,3).padStart(3, '0').toUpperCase()} &nbsp; Pokémon {member.role} &nbsp; Taille: 1,75m &nbsp; Poids: 75kg
               </p>
             </div>

             {/* ATTACKS (SKILLS) */}
             <div className="flex-1 flex flex-col justify-start gap-3 px-1 relative z-10">
                {displayedSkills.slice(0, 2).map((skill, idx) => (
                  <div key={idx} className="flex flex-col border-b border-black/10 dark:border-white/10 pb-2.5 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        {/* Energy cost icons based on level */}
                        {Array.from({ length: Math.min(3, Math.ceil(skill.level / 2)) }).map((_, i) => (
                          <div key={i} className={`w-[22px] h-[22px] rounded-full ${theme.energyColor} flex items-center justify-center border border-white/60 shadow-sm`}>
                            <div className="w-2.5 h-2.5 text-white flex items-center justify-center">
                              {SvgIcons[theme.pokemonIcon as keyof typeof SvgIcons]}
                            </div>
                          </div>
                        ))}
                        {/* Colorless energy filler */}
                        {skill.level < 4 && (
                          <div className={`w-[22px] h-[22px] rounded-full bg-[#e2e8f0] flex items-center justify-center border border-black/10 shadow-sm`}>
                            <div className="w-2.5 h-2.5 text-slate-400 flex items-center justify-center">
                              {SvgIcons.star}
                            </div>
                          </div>
                        )}
                        <h4 className="text-[16px] font-bold font-sans text-slate-800 dark:text-white ml-2 capitalize tracking-tight">{skill.name}</h4>
                      </div>
                      <span className="text-[20px] font-black font-sans text-slate-800 dark:text-white leading-none">{skill.level * 20}</span>
                    </div>
                    {/* Flavor text for attack */}
                    <p className="text-[10px] leading-[1.2] font-sans text-slate-600 dark:text-slate-400 px-1">
                      {skill.level >= 4 ? `Cette attaque surpuissante inflige 20 dégâts supplémentaires si le POKéMON Défenseur a des bugs non résolus.` : `Lancez une pièce. Si c'est face, le POKéMON Défenseur est maintenant Paralysé par le code legacy.`}
                    </p>
                  </div>
                ))}
             </div>

             {/* FOOTER: Weakness / Resistance / Retreat */}
             <div className="w-full flex items-center justify-between px-4 py-1 mb-1 mt-auto relative z-10">
               <div className="flex flex-col items-center">
                 <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Faiblesse</span>
                 <div className="flex gap-1 mt-0.5 items-center">
                   <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shadow-inner border border-white/50">
                     <div className="w-2 h-2 text-white flex items-center justify-center">{SvgIcons.fire}</div>
                   </div>
                   <span className="text-[11px] font-bold text-slate-800 dark:text-white">x2</span>
                 </div>
               </div>
               <div className="flex flex-col items-center">
                 <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Résistance</span>
               </div>
               <div className="flex flex-col items-center">
                 <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Retraite</span>
                 <div className="flex gap-0.5 mt-0.5">
                   <div className="w-4 h-4 rounded-full bg-[#e2e8f0] flex items-center justify-center border border-black/10">
                     <div className="w-[6px] h-[6px] text-slate-400 flex items-center justify-center">{SvgIcons.star}</div>
                   </div>
                   <div className="w-4 h-4 rounded-full bg-[#e2e8f0] flex items-center justify-center border border-black/10">
                     <div className="w-[6px] h-[6px] text-slate-400 flex items-center justify-center">{SvgIcons.star}</div>
                   </div>
                 </div>
               </div>
             </div>

             {/* BOTTOM FLAVOR TEXT */}
             <div className="w-full flex items-center justify-center p-2 border-t-[1.5px] border-black/20 dark:border-white/20 relative z-10 bg-black/[0.03] dark:bg-white/[0.03] rounded-b-[0.8rem] min-h-[44px]">
               <p className="text-[9px] font-sans italic text-slate-700 dark:text-slate-300 leading-tight text-center">
                 {member.bio || `Il aime les défis complexes. Lorsqu'il est sous pression, il a tendance à déployer en production le vendredi soir.`}
               </p>
             </div>
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 z-20 flex flex-col items-center gap-1">
        <button 
          onClick={(e) => { e.stopPropagation(); onChocoblast?.(); }}
          className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 hover:scale-110 active:scale-95 transition-all shadow-lg border border-amber-200 dark:border-amber-800/50"
          title="Chocoblast !"
        >
          <i className="fa-solid fa-cookie-bite text-lg"></i>
        </button>
        <span className="text-[10px] font-black font-tech text-amber-600 dark:text-amber-400 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-full backdrop-blur-sm border border-amber-100 dark:border-amber-900/30 shadow-sm">
          {member.chocoblasts || 0}
        </span>
      </div>

      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <button onClick={handleCopyAsImage} disabled={copyStatus === 'loading'} className={`action-button w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${copyStatus === 'success' ? 'bg-emerald-500 text-white opacity-100' : 'bg-white/50 dark:bg-slate-800/50 text-gray-400 hover:text-sky-500 opacity-0 group-hover:opacity-100'}`} title="Copier la fiche en image (TCG)">
          {copyStatus === 'loading' ? <i className="fa-solid fa-spinner fa-spin text-xs"></i> : copyStatus === 'success' ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-image"></i>}
        </button>
        {isEditable && (
          <button onClick={onEdit} className="action-button w-10 h-10 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-sky-500 transition-all opacity-0 group-hover:opacity-100 shadow-lg" title="Modifier le profil"><i className="fa-solid fa-sliders"></i></button>
        )}
      </div>
      
      <div className="relative w-full flex justify-center mb-6">
        <div className="relative">
          <div className={`w-32 h-32 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg ring-2 ring-${theme.bg.split('-')[1]}-400/30`}>
            {!imgError ? (
              <img src={imageSrc} alt={member.name} crossOrigin="anonymous" onError={() => setImgError(true)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-3xl font-black text-white ${theme.bg}`}>{getInitials(member.name)}</div>
            )}
          </div>
          <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white dark:border-slate-800 ${theme.bg} shadow-md flex items-center justify-center text-[10px] text-white font-bold`}><i className="fa-solid fa-certificate"></i></div>
        </div>
      </div>
      
      <div className="text-center mb-6 w-full">
        <h3 className="text-xl font-black font-orbitron tracking-tight truncate px-2 dark:text-white">{member.name}</h3>
        <span className={`inline-block mt-2 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black font-tech ${theme.light} ${theme.text} dark:bg-sky-900/30 dark:text-sky-300`}>{member.role}</span>
        
        <div className="flex flex-wrap justify-center gap-2 mt-4 min-h-[32px]">
          {member.certifications?.map((cert, i) => (
            <div key={i} className="relative group/cert">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-gray-100 dark:border-sky-500/20 shadow-sm flex items-center justify-center cursor-help hover:border-sky-400 transition-colors">
                <i className={`${getProviderIcon(cert.provider)} text-sm`}></i>
              </div>
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest whitespace-nowrap rounded-lg shadow-xl opacity-0 group-hover/cert:opacity-100 pointer-events-none transition-opacity z-30 border border-sky-500/30">
                {cert.name}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-900"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full mt-2 pt-6 border-t border-gray-100 dark:border-slate-800 flex-1">
        {viewMode === 'talents' ? (<div className="space-y-4"><h4 className="text-[10px] font-tech uppercase tracking-[0.2em] font-black text-gray-400 mb-4">Systèmes</h4>{member.skills.slice(0, 5).map((skill, idx) => (<SkillBadge key={idx} skill={skill} color={theme.bg} />))}</div>) : (<div className="space-y-3"><h4 className="text-[10px] font-tech uppercase tracking-[0.2em] font-black text-gray-400 mb-4">Escale & Poste</h4>{DAYS.map((day) => { const loc = member.presence.schedule[day]; return (<div key={day} className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${loc ? 'bg-sky-50 dark:bg-sky-900/20' : 'opacity-30'}`}><span className="text-[10px] font-black uppercase font-tech dark:text-white">{day}</span><span className={`text-[9px] font-black font-tech ${theme.text} truncate max-w-[140px] flex items-center gap-1`}>{loc ? <><i className="fa-solid fa-plane-arrival text-[8px]"></i>{loc}</> : <span className="opacity-50">Base</span>}</span></div>); })}</div>)}
      </div>
    </div>
  );
};

export default StaffCard;
