
import React, { useState } from 'react';
import { StaffMember, Role, DayOfWeek, Office } from '../types';

interface EditMemberModalProps {
  member: StaffMember;
  offices: Office[];
  onClose: () => void;
  onSave: (updatedMember: StaffMember) => void;
}

const DAYS: DayOfWeek[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

const EditMemberModal: React.FC<EditMemberModalProps> = ({ member, offices, onClose, onSave }) => {
  const [formData, setFormData] = useState<StaffMember>({ ...member });
  const [newSkillName, setNewSkillName] = useState('');

  const handleDayToggle = (day: DayOfWeek) => {
    const newSchedule = { ...formData.presence.schedule };
    if (newSchedule[day]) {
      delete newSchedule[day];
    } else {
      const firstOffice = offices[0];
      const firstStation = firstOffice?.stations[0];
      newSchedule[day] = firstOffice && firstStation ? `${firstOffice.name} - ${firstStation}` : 'Non assigné';
    }
    setFormData({
      ...formData,
      presence: { schedule: newSchedule }
    });
  };

  const handleOfficeSelection = (day: DayOfWeek, officeName: string, stationName: string) => {
    setFormData({
      ...formData,
      presence: {
        schedule: { ...formData.presence.schedule, [day]: `${officeName} - ${stationName}` }
      }
    });
  };

  const handleSkillLevelChange = (index: number, level: number) => {
    const newSkills = [...formData.skills];
    newSkills[index] = { ...newSkills[index], level };
    setFormData({ ...formData, skills: newSkills });
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    setFormData({
      ...formData,
      skills: [...formData.skills, { name: newSkillName.trim(), level: 3 }]
    });
    setNewSkillName('');
  };

  const handleRemoveSkill = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-sky-100 dark:border-sky-900/30">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-sky-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-5">
            <div className="relative">
               <img 
                 src={formData.avatar.startsWith('http') ? formData.avatar : `./${formData.avatar}`} 
                 className="w-14 h-14 rounded-2xl object-cover shadow-inner bg-gray-200" 
                 alt=""
                 onError={(e) => (e.currentTarget.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y")}
               />
               <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center text-[10px] text-white ring-2 ring-white dark:ring-slate-900">
                 <i className="fa-solid fa-pen"></i>
               </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                Modifier <span className="text-sky-600 dark:text-sky-400">{member.name}</span>
              </h2>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] font-bold">Personnel de bord</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all flex items-center justify-center">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-sky-500 mb-6">Informations Générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Nom Complet</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-100 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-sky-500 transition-all dark:text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-100 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-sky-500 transition-all dark:text-white" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-sky-500 mb-6">Expertise & Skills</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.skills.map((skill, index) => (
                <div key={index} className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 transition-colors">
                  <div className="flex-1">
                    <span className="text-sm font-bold dark:text-white block truncate">{skill.name}</span>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map(lvl => (
                        <button key={lvl} onClick={() => handleSkillLevelChange(index, lvl)} className={`w-6 h-1.5 rounded-full transition-all ${skill.level >= lvl ? 'bg-sky-600' : 'bg-gray-200 dark:bg-slate-700'}`}></button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => handleRemoveSkill(index)} className="w-10 h-10 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center">
                    <i className="fa-solid fa-trash-can text-sm"></i>
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nouvelle skill..."
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  className="flex-1 bg-gray-100 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-xs focus:ring-2 focus:ring-sky-500 dark:text-white"
                />
                <button 
                  onClick={handleAddSkill}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-6 rounded-2xl text-[10px] font-black uppercase transition-all"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4 pb-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-sky-500 mb-6">Plan de Vol</h3>
            <div className="grid grid-cols-1 gap-4">
              {DAYS.map(day => {
                const currentAssignment = formData.presence.schedule[day] || '';
                const isPresent = !!currentAssignment;
                const [currentOfficeName, currentStationName] = currentAssignment.split(' - ');
                const selectedOffice = offices.find(o => o.name === currentOfficeName) || offices[0];

                return (
                  <div key={day} className={`flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-2xl border transition-all ${isPresent ? 'bg-sky-50/30 dark:bg-sky-900/10 border-sky-100 dark:border-sky-900/30 shadow-sm' : 'bg-gray-50 dark:bg-slate-800 border-transparent'}`}>
                    <div className="flex items-center gap-4 min-w-[140px]">
                      <button onClick={() => handleDayToggle(day)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isPresent ? 'bg-sky-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-transparent'}`}>
                        <i className="fa-solid fa-check text-xs"></i>
                      </button>
                      <span className={`text-xs font-black uppercase tracking-tight ${isPresent ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400'}`}>{day}</span>
                    </div>

                    {isPresent ? (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-left-4 duration-300">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Appareil</label>
                          <select 
                            value={currentOfficeName} 
                            onChange={(e) => {
                              const newOffice = offices.find(o => o.name === e.target.value);
                              if (newOffice) handleOfficeSelection(day, newOffice.name, newOffice.stations[0]);
                            }}
                            className="w-full bg-white dark:bg-slate-700 border-none rounded-2xl px-4 py-3 text-xs focus:ring-2 focus:ring-sky-500 dark:text-white shadow-sm"
                          >
                            {offices.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Siège précis</label>
                          <select 
                            value={currentStationName} 
                            onChange={(e) => handleOfficeSelection(day, currentOfficeName, e.target.value)}
                            className="w-full bg-white dark:bg-slate-700 border-none rounded-2xl px-4 py-3 text-xs focus:ring-2 focus:ring-sky-500 dark:text-white shadow-sm"
                          >
                            {selectedOffice?.stations.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center">
                         <span className="text-[10px] font-bold text-gray-400 dark:text-slate-600 italic uppercase tracking-widest">Base ou Télétravail</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 flex justify-end gap-4">
          <button onClick={onClose} className="px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">Annuler</button>
          <button onClick={() => onSave(formData)} className="px-12 py-4 rounded-xl bg-sky-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-sky-200 dark:shadow-none hover:bg-sky-700 hover:scale-105 active:scale-95 transition-all">Mettre à jour</button>
        </div>
      </div>
    </div>
  );
};

export default EditMemberModal;
