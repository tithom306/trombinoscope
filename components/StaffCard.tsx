import React, { useState } from "react";
import { DayOfWeek, Role, StaffMember } from "../types";
import SkillBadge from "./SkillBadge";

interface StaffCardProps {
  member: StaffMember;
  viewMode: "talents" | "planning";
  onEdit: () => void;
}

const DAYS: DayOfWeek[] = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

const StaffCard: React.FC<StaffCardProps> = ({ member, viewMode, onEdit }) => {
  const [imgError, setImgError] = useState(false);

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.DEVELOPER:
        return "bg-sky-600";
      case Role.BUSINESS_ANALYST:
        return "bg-amber-600";
      case Role.MANAGER:
        return "bg-purple-600";
      default:
        return "bg-gray-600";
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  const imageSrc =
    member.avatar.startsWith("http") || member.avatar.startsWith("input_file_")
      ? member.avatar
      : `./${member.avatar}`;

  return (
    <div className="staff-card relative p-8 flex flex-col items-center group h-fit self-start transition-all duration-300 min-h-[520px] border bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-sky-100 dark:border-sky-900/30 rounded-2xl shadow-xl">
      <button
        onClick={onEdit}
        className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-sky-500 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 z-10"
      >
        <i className="fa-solid fa-sliders"></i>
      </button>

      <div className="relative mb-6">
        <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg ring-2 ring-sky-400/50">
          {!imgError ? (
            <img
              src={imageSrc}
              alt={member.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 brightness-[1.05] contrast-[1.02]"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center text-3xl font-black text-white ${getRoleColor(
                member.role
              )}`}
            >
              {getInitials(member.name)}
            </div>
          )}
        </div>
        <div
          className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white dark:border-slate-800 ${getRoleColor(
            member.role
          )} shadow-md flex items-center justify-center text-[10px] text-white font-bold`}
        >
          <i className="fa-solid fa-certificate"></i>
        </div>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-xl font-black">{member.name}</h3>
        <span className="inline-block mt-2 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
          {member.role}
        </span>
      </div>

      <div className="w-full mt-2 pt-6 border-t border-gray-100 dark:border-slate-800 flex-1">
        {viewMode === "talents" ? (
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-4">
              Aptitudes
            </h4>
            {member.skills.slice(0, 5).map((skill, idx) => (
              <SkillBadge
                key={idx}
                skill={skill}
                color={getRoleColor(member.role)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-4">
              Plan de Vol
            </h4>
            {DAYS.map((day) => {
              const loc = member.presence.schedule[day];
              return (
                <div
                  key={day}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${
                    loc
                      ? "bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900/30"
                      : "opacity-30"
                  }`}
                >
                  <span className="text-[10px] font-black uppercase">
                    {day}
                  </span>
                  {loc ? (
                    <span className="text-[9px] font-black text-sky-600 dark:text-sky-400 truncate max-w-[140px] flex items-center gap-1">
                      <i className="fa-solid fa-location-dot text-[8px]"></i>
                      {loc}
                    </span>
                  ) : (
                    <span className="text-[9px] italic font-bold">
                      Base (TT)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 w-full flex justify-center border-t border-gray-50 dark:border-white/5">
        <a
          href={`mailto:${member.email}`}
          className="text-gray-400 hover:text-sky-600 transition-all flex items-center gap-2"
        >
          <i className="fa-solid fa-headset"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">
            Contact
          </span>
        </a>
      </div>
    </div>
  );
};

export default StaffCard;
