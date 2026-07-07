import Papa from "papaparse";
import React, { useEffect, useMemo, useState } from "react";
import EditMemberModal from "./components/EditMemberModal";
import KebabManager from "./components/KebabManager";
import OfficesAvailabilityView from "./components/OfficesAvailabilityView";
import ProjectSection from "./components/ProjectSection";
import { PersistenceAPI } from "./persistence-api";
import {
  DayOfWeek,
  KebabOrder,
  KebabSession,
  Office,
  Project,
  Role,
  Skill,
  StaffMember,
} from "./types";

const App: React.FC = () => {
  const [appName, setAppName] = useState("SkyCenter");
  const [projects, setProjects] = useState<Project[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [kebabSessions, setKebabSessions] = useState<KebabSession[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | "All">("All");
  const [viewMode, setViewMode] = useState<
    "talents" | "planning" | "offices" | "kebab"
  >("talents");
  const [editingMember, setEditingMember] = useState<{
    member: StaffMember;
    projectId: string;
    isNew?: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddOfficeModal, setShowAddOfficeModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);

  const isEditable = true; // Toujours éditable avec la BDD

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("team_canvas_theme");
    return (
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("team_canvas_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("team_canvas_theme", "light");
    }
  }, [isDarkMode]);

  // Chargement initial depuis la BDD SQL via l'API REST
  const refreshData = async () => {
    try {
      const data = await PersistenceAPI.loadData();
      setAppName(data.name || "SkyCenter");
      setProjects(data.projects || []);
      setOffices(data.offices || []);
      setKebabSessions(data.kebabSessions || []);
    } catch (e) {
      console.error("Erreur lors du chargement des données depuis la BDD:", e);
    }
  };

  useEffect(() => {
    refreshData().finally(() => {
      setIsLoading(false);
    });
  }, []);

  const handleLinkFile = async () => {
    // Déclencheur d'import de fichier CSV optionnel (sans file system handle pour modification)
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const content = await file.text();
      processFileContent(file.name, content);
    };
    input.click();
  };

  const processFileContent = (fileName: string, content: string) => {
    if (fileName.endsWith(".csv")) {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: Papa.ParseResult<any>) => {
          const importedMembers: StaffMember[] = results.data.map(
            (row: any, index: number) => {
              const skills: Skill[] = (row.skills || row.Compétences || "")
                .split(",")
                .filter((s: string) => s.trim())
                .map((s: string) => ({ name: s.trim(), level: 3 }));

              return {
                id: `csv-${Date.now()}-${index}`,
                name: row.name || row.Nom || "Inconnu",
                role: (row.role || row.Rôle || Role.DEVELOPER) as Role,
                avatar: row.avatar || `https://i.pravatar.cc/150?u=${index}`,
                email: row.email || "",
                skills: skills,
                presence: { schedule: {} },
              };
            },
          );

          try {
            const pId = `p-csv-${Date.now()}`;
            await PersistenceAPI.createProject(pId, "Import CSV", `Membres importés de ${fileName}`);
            for (const m of importedMembers) {
              await PersistenceAPI.createMember(pId, m);
            }
            alert(`${importedMembers.length} membres importés avec succès !`);
            refreshData();
          } catch (e) {
            console.error(e);
            alert("Erreur lors de l'import des collaborateurs du CSV.");
          }
        },
      });
    }
  };

  const handleAddProject = async (name: string, description: string) => {
    const id = `p-${Date.now()}`;
    const newProject: Project = {
      id,
      name,
      description,
      members: [],
    };
    setProjects((prev) => [...prev, newProject]);
    setShowAddProjectModal(false);

    try {
      await PersistenceAPI.createProject(id, name, description);
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  const handleAddMember = (projectId: string) => {
    const newMember: StaffMember = {
      id: `m-${Date.now()}`,
      name: "Nouveau Membre",
      role: Role.DEVELOPER,
      avatar: "https://i.pravatar.cc/150?u=" + Date.now(),
      email: "",
      skills: [],
      presence: { schedule: {} },
    };
    setEditingMember({ member: newMember, projectId, isNew: true });
  };

  const handleUpdateMember = async (
    updatedMember: StaffMember,
    targetProjectId: string,
    isNew?: boolean,
  ) => {
    const sourceProjectId = editingMember?.projectId;
    
    // Optimistic Update
    setProjects((prevProjects) => {
      let newProjects = [...prevProjects];
      if (isNew) {
        newProjects = newProjects.map((p) =>
          p.id === targetProjectId
            ? { ...p, members: [...p.members, updatedMember] }
            : p,
        );
      } else if (sourceProjectId && sourceProjectId !== targetProjectId) {
        newProjects = newProjects.map((p) => {
          if (p.id === sourceProjectId)
            return {
              ...p,
              members: p.members.filter((m) => m.id !== updatedMember.id),
            };
          if (p.id === targetProjectId)
            return { ...p, members: [...p.members, updatedMember] };
          return p;
        });
      } else {
        newProjects = newProjects.map((p) =>
          p.id === targetProjectId
            ? {
                ...p,
                members: p.members.map((m) =>
                  m.id === updatedMember.id ? updatedMember : m,
                ),
              }
            : p,
        );
      }
      return newProjects;
    });

    setEditingMember(null);

    // DB Persistence
    try {
      if (isNew) {
        await PersistenceAPI.createMember(targetProjectId, updatedMember);
      } else {
        await PersistenceAPI.updateMember(updatedMember, targetProjectId);
      }
      refreshData(); // Sync exact relations/IDs from DB
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  const handleAddOffice = async (name: string, stationCount: number) => {
    const id = `off-${Date.now()}`;
    const stations = Array.from(
      { length: stationCount },
      (_, i) => `Poste ${i + 1}`,
    );
    const newOffice: Office = { id, name, stations };
    setOffices((prev) => [...prev, newOffice]);
    setShowAddOfficeModal(false);

    try {
      await PersistenceAPI.createOffice(id, name, stations);
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  const handleBulkAssignmentUpdate = async (
    updates: { memberId: string; day: DayOfWeek; assignment: string | null }[],
  ) => {
    // Optimistic Update
    setProjects((prevProjects) => {
      let currentProjects = [...prevProjects];
      updates.forEach(({ memberId, day, assignment }) => {
        currentProjects = currentProjects.map((proj) => ({
          ...proj,
          members: proj.members.map((member) => {
            if (member.id === memberId) {
              const newSchedule = { ...member.presence.schedule };
              if (assignment === null) delete newSchedule[day];
              else newSchedule[day] = assignment;
              return { ...member, presence: { schedule: newSchedule } };
            }
            if (
              assignment !== null &&
              member.presence.schedule[day] === assignment
            ) {
              const newSchedule = { ...member.presence.schedule };
              delete newSchedule[day];
              return { ...member, presence: { schedule: newSchedule } };
            }
            return member;
          }),
        }));
      });
      return currentProjects;
    });

    try {
      await PersistenceAPI.updateBulkPresence(updates);
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  // KEBAB HANDLERS
  const handleAddKebabSession = async () => {
    const id = `k-${Date.now()}`;
    const date = new Date().toISOString();
    const newSession: KebabSession = {
      id,
      date,
      status: "open",
      orders: [],
    };
    setKebabSessions((prev) => [newSession, ...prev]);

    try {
      await PersistenceAPI.createKebabSession(id, date, "open");
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  const handleCloseKebabSession = async (sessionId: string) => {
    setKebabSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, status: "closed" as const } : s,
      ),
    );

    try {
      await PersistenceAPI.closeKebabSession(sessionId);
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  const handleDeleteKebabSession = async (sessionId: string) => {
    setKebabSessions((prev) => prev.filter((s) => s.id !== sessionId));

    try {
      await PersistenceAPI.deleteKebabSession(sessionId);
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  const handleSaveKebabOrder = async (
    sessionId: string,
    orderData: Omit<KebabOrder, "timestamp">,
  ) => {
    // Optimistic Update
    setKebabSessions((prevSessions) => {
      return prevSessions.map((s) => {
        if (s.id !== sessionId) return s;

        const existingOrderIndex = s.orders.findIndex(
          (o) => o.id === orderData.id,
        );
        let newOrders;

        if (existingOrderIndex > -1) {
          newOrders = s.orders.map((o) =>
            o.id === orderData.id
              ? { ...orderData, timestamp: new Date().toISOString() }
              : o,
          );
        } else {
          const newOrder: KebabOrder = {
            ...orderData,
            id: orderData.id || `ko-${Date.now()}`,
            timestamp: new Date().toISOString(),
          };
          newOrders = [...s.orders, newOrder];
        }

        return { ...s, orders: newOrders };
      });
    });

    try {
      await PersistenceAPI.saveKebabOrder(sessionId, orderData);
      refreshData(); // Reload to get database autogenerated timestamps
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  const handleChocoblast = async (memberId: string) => {
    setProjects((prev) =>
      prev.map((p) => ({
        ...p,
        members: p.members.map((m) =>
          m.id === memberId ? { ...m, chocoblasts: (m.chocoblasts || 0) + 1 } : m,
        ),
      })),
    );

    try {
      await PersistenceAPI.incrementChocoblasts(memberId);
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  const filteredProjects = useMemo(() => {
    return projects
      .map((project) => ({
        ...project,
        members: project.members.filter((member) => {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch =
            member.name.toLowerCase().includes(searchLower) ||
            member.skills.some((s) =>
              s.name.toLowerCase().includes(searchLower),
            );
          const matchesRole =
            selectedRole === "All" || member.role === selectedRole;
          return matchesSearch && matchesRole;
        }),
      }))
      .filter((project) => project.members.length > 0 || searchTerm === "");
  }, [projects, searchTerm, selectedRole]);

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50 dark:bg-slate-950">
        <div className="w-16 h-16 border-4 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen transition-colors duration-500 font-sans bg-sky-50 dark:bg-slate-950">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xl bg-sky-500">
              <i className="fa-solid fa-plane text-xl"></i>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black leading-none">{appName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] font-bold text-sky-500 tracking-widest uppercase">
                  Fleet Management
                </p>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">
                    Base SQL
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
            {["talents", "planning", "offices", "kebab"].map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m as any)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === m ? "bg-white dark:bg-slate-700 text-sky-600 shadow-sm" : "text-gray-400"}`}
              >
                {m === "talents"
                  ? "Personnel"
                  : m === "planning"
                    ? "Plan de Vol"
                    : m === "offices"
                      ? "Appareils"
                      : "Kebab"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLinkFile}
              className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 hover:bg-sky-500 hover:text-white flex items-center justify-center transition-all"
              title="Importer des collaborateurs via un fichier CSV"
            >
              <i className="fa-solid fa-file-import"></i>
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 hover:bg-sky-500 hover:text-white transition-all"
            >
              <i
                className={`fa-solid ${isDarkMode ? "fa-sun" : "fa-moon"}`}
              ></i>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {viewMode !== "offices" && viewMode !== "kebab" && (
          <div className="mb-10 flex flex-col lg:flex-row gap-4 items-stretch">
            <div className="relative flex-1 group">
              <input
                type="text"
                placeholder="Rechercher un membre ou une compétence..."
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl py-5 pl-14 pr-6 text-sm focus:ring-2 focus:ring-sky-500 shadow-xl shadow-sky-500/5 transition-all h-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-sky-400 text-lg"></i>
            </div>
            <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-xl shadow-sky-500/5 items-center overflow-x-auto min-w-fit">
              <button
                onClick={() => setSelectedRole("All")}
                className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRole === "All" ? "bg-sky-500 text-white" : "text-gray-400 hover:text-sky-500"}`}
              >
                Tous
              </button>
              {Object.values(Role).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedRole === role ? "bg-sky-500 text-white" : "text-gray-400 hover:text-sky-500"}`}
                >
                  {role}
                </button>
              ))}
              {isEditable && (
                <>
                  <div className="w-px h-8 bg-gray-100 dark:bg-slate-800 mx-2"></div>
                  <button
                    onClick={() => setShowAddProjectModal(true)}
                    className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all flex items-center gap-2"
                  >
                    <i className="fa-solid fa-folder-plus"></i> Nouveau Projet
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {viewMode === "offices" ? (
          <OfficesAvailabilityView
            offices={offices}
            projects={projects}
            isEditable={isEditable}
            onUpdateAssignment={(id, d, a) =>
              handleBulkAssignmentUpdate([
                { memberId: id, day: d, assignment: a },
              ])
            }
            onUpdateAssignments={handleBulkAssignmentUpdate}
            onAddOffice={() => setShowAddOfficeModal(true)}
          />
        ) : viewMode === "kebab" ? (
          <KebabManager
            sessions={kebabSessions}
            projects={projects}
            isEditable={isEditable}
            onAddSession={handleAddKebabSession}
            onCloseSession={handleCloseKebabSession}
            onDeleteSession={handleDeleteKebabSession}
            onSaveOrder={handleSaveKebabOrder}
          />
        ) : (
          filteredProjects.map((project) => (
            <ProjectSection
              key={project.id}
              project={project}
              viewMode={viewMode}
              isEditable={isEditable}
              onEditMember={(m) =>
                setEditingMember({ member: m, projectId: project.id })
              }
              onAddMember={() => handleAddMember(project.id)}
              onChocoblast={handleChocoblast}
            />
          ))
        )}
      </main>

      {editingMember && (
        <EditMemberModal
          member={editingMember.member}
          offices={offices}
          projects={projects}
          currentProjectId={editingMember.projectId}
          onClose={() => setEditingMember(null)}
          onSave={(u, target) =>
            handleUpdateMember(u, target, editingMember.isNew)
          }
        />
      )}

      {/* MODAL AJOUT BUREAU */}
      {showAddOfficeModal && isEditable && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-8 border border-sky-100 dark:border-sky-900/30">
            <h3 className="text-xl font-black mb-6 dark:text-white">
              Nouvel Appareil / Bureau
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = e.target as any;
                handleAddOffice(f.name.value, parseInt(f.stations.value));
              }}
              className="space-y-4"
            >
              <input
                name="name"
                type="text"
                placeholder="Nom du bureau"
                required
                className="w-full bg-gray-100 dark:bg-slate-800 border-none rounded-xl p-4 text-sm dark:text-white"
              />
              <input
                name="stations"
                type="number"
                min="1"
                max="50"
                defaultValue="4"
                required
                className="w-full bg-gray-100 dark:bg-slate-800 border-none rounded-xl p-4 text-sm dark:text-white"
              />
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddOfficeModal(false)}
                  className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-sky-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-sky-600/20"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJOUT PROJET */}
      {showAddProjectModal && isEditable && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-8 border border-sky-100 dark:border-sky-900/30">
            <h3 className="text-xl font-black mb-6 dark:text-white">
              Nouvelle Escadrille
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = e.target as any;
                handleAddProject(f.name.value, f.desc.value);
              }}
              className="space-y-4"
            >
              <input
                name="name"
                type="text"
                placeholder="Nom de l'équipe"
                required
                className="w-full bg-gray-100 dark:bg-slate-800 border-none rounded-xl p-4 text-sm dark:text-white"
              />
              <textarea
                name="desc"
                placeholder="Mission / Description..."
                required
                className="w-full bg-gray-100 dark:bg-slate-800 border-none rounded-xl p-4 text-sm dark:text-white min-h-[100px]"
              ></textarea>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-sky-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-sky-600/20"
                >
                  Lancer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
