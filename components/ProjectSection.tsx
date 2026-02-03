
import React from 'react';
import { Project, StaffMember } from '../types';
import StaffCard from './StaffCard';

interface ProjectSectionProps {
  project: Project;
  viewMode: 'talents' | 'planning';
  isEditable: boolean;
  onEditMember: (member: StaffMember) => void;
  onAddMember: () => void;
}

const ProjectSection: React.FC<ProjectSectionProps> = ({ project, viewMode, isEditable, onEditMember, onAddMember }) => {
  return (
    <div className="mb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-end gap-2 text-sky-600 dark:text-sky-400">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-plane-departure text-xl"></i>
            <h2 className="text-2xl font-black leading-none tracking-tight">{project.name}</h2>
          </div>
          <p className="text-gray-500 dark:text-slate-500 text-sm font-medium border-l-0 md:border-l-2 md:pl-3 md:ml-1 md:border-gray-200 dark:md:border-slate-800">
            {project.description}
          </p>
        </div>
        
        {isEditable && (
          <button 
            onClick={onAddMember}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-sky-500/20 transition-all hover:scale-105"
            title="Ajouter un collaborateur à ce projet"
          >
            <i className="fa-solid fa-plus"></i>
            <span>Engager</span>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {project.members.map(member => (
          <StaffCard 
            key={member.id} 
            member={member} 
            viewMode={viewMode} 
            isEditable={isEditable}
            onEdit={() => onEditMember(member)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProjectSection;
