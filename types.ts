
export enum Role {
  DEVELOPER = 'Développeur',
  BUSINESS_ANALYST = 'Business Analyst',
  MANAGER = 'Manager'
}

export interface Skill {
  name: string;
  level: number; // 1 to 5
}

export interface Certification {
  name: string;
  provider: string; // ex: AWS, Microsoft, Scrum.org
}

export type DayOfWeek = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi';

export interface Office {
  id: string;
  name: string;
  stations: string[]; // Liste des noms de postes
}

export interface PresenceInfo {
  // Le planning associe un jour à un bureau spécifique sous forme "Nom Bureau - Poste"
  schedule: Partial<Record<DayOfWeek, string>>;
}

export interface StaffMember {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  email: string;
  skills: Skill[];
  certifications?: Certification[];
  presence: PresenceInfo;
  bio?: string;
  chocoblasts?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  members: StaffMember[];
}

export interface AppMetadata {
  name: string;
  description: string;
  projects: Project[];
  offices: Office[];
  kebabSessions?: KebabSession[];
}

export enum KebabSauce {
  BLANCHE = 'Blanche',
  ALGERIENNE = 'Algérienne',
  SAMOURAI = 'Samouraï',
  HARISSA = 'Harissa',
  MAYONNAISE = 'Mayonnaise',
  KETCHUP = 'Ketchup',
  ANDALOUSE = 'Andalouse',
  CURRY = 'Curry'
}

export enum KebabIngredient {
  SALADE = 'Salade',
  TOMATE = 'Tomate',
  OIGNON = 'Oignon',
  OLIVE = 'Olive',
  FETA = 'Feta',
  CHOUX = 'Choux',
  FRITES_EXTERIEUR = 'Frites à l\'extérieur'
}

export interface KebabOrder {
  id: string;
  memberId: string;
  memberName: string;
  sauce: KebabSauce;
  ingredients: KebabIngredient[];
  comment?: string;
  timestamp: string;
}

export interface KebabSession {
  id: string;
  date: string;
  status: 'open' | 'closed';
  orders: KebabOrder[];
}
