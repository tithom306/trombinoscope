
import React from 'react';
import { Skill } from '../types';

interface SkillBadgeProps {
  skill: Skill;
  color: string;
}

const SkillBadge: React.FC<SkillBadgeProps> = ({ skill, color }) => {
  const isMaster = skill.level === 5;
  return (
    <div className="mb-3 font-tech">
      <div className="flex justify-between text-[10px] mb-1 text-gray-500 dark:text-slate-400">
        <span className="font-bold tracking-wider uppercase flex items-center gap-1">
          {skill.name}
          {isMaster && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" title="Niveau Maître !"></span>
          )}
        </span>
        <span className={`font-black ${isMaster ? "text-amber-500" : ""}`}>
          LVL {skill.level}/5
        </span>
      </div>
      
      {/* High-tech segmented jauge */}
      <div className="flex gap-1 w-full bg-gray-200/50 dark:bg-slate-800/40 p-0.5 rounded border border-gray-300/10">
        {Array.from({ length: 5 }).map((_, i) => {
          const isActive = i < skill.level;
          let segmentBg = "bg-gray-200 dark:bg-slate-800/70";
          if (isActive) {
            segmentBg = isMaster 
              ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]" 
              : color;
          }
          return (
            <div 
              key={i} 
              className={`h-2 flex-1 rounded-[1px] transition-all duration-500 ${segmentBg}`}
            ></div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillBadge;
