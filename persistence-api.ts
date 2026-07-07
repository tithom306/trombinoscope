import { Project, Office, KebabSession, StaffMember, KebabOrder } from "./types";

const API_BASE = window.location.port === "3000" 
  ? "http://localhost:3001" 
  : window.location.origin;

export const PersistenceAPI = {
  async loadData(): Promise<{
    name: string;
    version: string;
    projects: Project[];
    offices: Office[];
    kebabSessions: KebabSession[];
  }> {
    const response = await fetch(`${API_BASE}/api/data`);
    if (!response.ok) throw new Error("Erreur de chargement des données.");
    return response.json();
  },

  async createProject(id: string, name: string, description: string): Promise<Project> {
    const response = await fetch(`${API_BASE}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, description }),
    });
    if (!response.ok) throw new Error("Échec de la création du projet.");
    return response.json();
  },

  async createMember(projectId: string, member: StaffMember): Promise<StaffMember> {
    const response = await fetch(`${API_BASE}/api/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...member, projectId }),
    });
    if (!response.ok) throw new Error("Échec de la création du membre.");
    return response.json();
  },

  async updateMember(member: StaffMember, targetProjectId: string): Promise<StaffMember> {
    const response = await fetch(`${API_BASE}/api/members/${member.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...member, projectId: targetProjectId }),
    });
    if (!response.ok) throw new Error("Échec de la mise à jour du membre.");
    return response.json();
  },

  async incrementChocoblasts(memberId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/members/${memberId}/chocoblast`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Échec de l'enregistrement du chocoblast.");
  },

  async createOffice(id: string, name: string, stations: string[]): Promise<Office> {
    const response = await fetch(`${API_BASE}/api/offices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, stations }),
    });
    if (!response.ok) throw new Error("Échec de la création du bureau.");
    return response.json();
  },

  async updateBulkPresence(updates: { memberId: string; day: string; assignment: string | null }[]): Promise<void> {
    const response = await fetch(`${API_BASE}/api/schedule/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    if (!response.ok) throw new Error("Échec de la mise à jour du plan de vol.");
  },

  async createKebabSession(id: string, date: string, status: string): Promise<KebabSession> {
    const response = await fetch(`${API_BASE}/api/kebab-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, date, status }),
    });
    if (!response.ok) throw new Error("Échec de la création de la session kebab.");
    return response.json();
  },

  async closeKebabSession(id: string): Promise<KebabSession> {
    const response = await fetch(`${API_BASE}/api/kebab-sessions/${id}/close`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Échec de la fermeture de la session kebab.");
    return response.json();
  },

  async deleteKebabSession(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/kebab-sessions/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Échec de la suppression de la session kebab.");
  },

  async saveKebabOrder(sessionId: string, order: Omit<KebabOrder, "timestamp">): Promise<KebabOrder> {
    const response = await fetch(`${API_BASE}/api/kebab-sessions/${sessionId}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    if (!response.ok) throw new Error("Échec de l'enregistrement de la commande.");
    return response.json();
  },
};
