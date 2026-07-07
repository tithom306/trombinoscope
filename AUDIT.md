# Audit Technique et Rétrospective du Projet - SkyCenter Trombinoscope

Ce document fait l'état des lieux (audit) et fournit une documentation rétrospective (rétro-doc) complète du projet **SkyCenter Trombinoscope** (également appelé *Fleet Management*). Il est conçu pour être lu et exploité par des agents autonomes ou des développeurs tiers afin de comprendre l'architecture, la pile technique, le modèle de données, les fonctionnalités clés et les pistes d'amélioration.

---

## 1. Présentation Générale et Thématique

**SkyCenter Trombinoscope** est une application web monopage (SPA) collaborative de gestion des effectifs, de planification de présence dans les bureaux (bureaux partagés) et de commande de repas de groupe (kebab).

L'application est construite autour d'une **thématique aéronautique / militaire (Squadron)** très forte :
* **Personnel** (Staff members) $\rightarrow$ Membres d'escadrille opérationnels.
* **Projets / Équipes** (Projects) $\rightarrow$ Escadrilles (Squadrons).
* **Bureaux** (Offices) $\rightarrow$ Appareils (Flotte d'avions/postes).
* **Planning hebdomadaire** (Presence schedule) $\rightarrow$ Plan de Vol (Escale & Poste).
* **Chocoblasts** $\rightarrow$ Points de performance / Récompenses gamifiées (représentés par un écusson de croissant).

---

## 2. Pile Technique (Tech Stack)

L'application repose sur des technologies modernes, légères et orientées client :

* **Framework & Bundler** : React 19, TypeScript, Vite.
* **Styling (CSS)** : Tailwind CSS (v3.4.0), Vanilla CSS (`index.css` / variables de thème), icônes FontAwesome (v6).
* **Rendu d'image** : `html-to-image` (utilisé pour exporter les fiches de collaborateurs sous forme de cartes à collectionner TCG).
* **Analyse de fichiers** : `PapaParse` (importateur CSV haute performance).
* **IA Générative** : SDK `@google/genai` (utilisé pour générer dynamiquement des questionnaires d'auto-évaluation technique via Gemini).

---

## 3. Architecture des Fichiers

La structure du projet s'organise ainsi :

```
d:\Workspace\trombinoscope
├── .agents/                    # [NEW] Configuration et instructions locales d'agent
├── .tmp/                       # [NEW] Dossier temporaire pour les opérations de script (Layer 3)
├── directives/                 # [NEW] Procédures Opérationnelles Standards (Layer 1)
│   └── README.md
├── execution/                  # [NEW] Scripts d'exécution déterministes en Python (Layer 3)
│   ├── README.md
│   └── requirements.txt
├── components/                 # Composants React de l'application
│   ├── EditMemberModal.tsx     # Modal d'édition complet + Quiz IA Gemini
│   ├── KebabManager.tsx        # Gestionnaire de sessions de commande de kebab
│   ├── OfficesAvailabilityView.tsx # Plan de charge des bureaux/postes par jour
│   ├── ProjectSection.tsx      # Section groupant les membres par escadrille
│   ├── SkillBadge.tsx          # Barre de compétences colorée
│   └── StaffCard.tsx           # Carte collaborateur individuelle (avec capture TCG)
├── App.tsx                     # Point d'entrée de l'application (Gestion d'état global)
├── data.ts                     # Données statiques initiales (actuellement vides)
├── index.html                  # Gabarit HTML
├── index.tsx                   # Point d'entrée React
├── metadata.json               # Base de données par défaut de l'application
├── types.ts                    # Déclarations des types TypeScript et énumérations
├── vite.config.ts              # Configuration de build Vite (injection d'API Key)
├── .env                        # Variables d'environnement de l'agent
├── credentials.json / token.json # Fichiers de configuration des APIs Google
└── package.json                # Fichier des dépendances NPM
```

---

## 4. Modèle de Données (`types.ts`)

Voici les principales entités qui régissent l'application :

### Rôles (`Role`)
Trois profils métier sont définis :
* `Développeur` (`Role.DEVELOPER`)
* `Business Analyst` (`Role.BUSINESS_ANALYST`)
* `Manager` (`Role.MANAGER`)

### Membre d'Équipage (`StaffMember`)
```typescript
export interface StaffMember {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  email: string;
  skills: Skill[];               // { name: string; level: number } de 1 à 5
  certifications?: Certification[]; // { name: string; provider: string }
  presence: PresenceInfo;        // Schedule mappant DayOfWeek vers "Nom Bureau - Nom Poste"
  bio?: string;
  chocoblasts?: number;          // Compteur de récompenses gamifiées
}
```

### Bureau / Poste (`Office`)
Un bureau possède un nom et une liste de postes disponibles.
```typescript
export interface Office {
  id: string;
  name: string;
  stations: string[]; // Liste des noms de postes
}
```

### Session Kebab (`KebabSession` & `KebabOrder`)
Gère les commandes pour les repas collectifs.
```typescript
export interface KebabOrder {
  id: string;
  memberId: string;
  memberName: string;
  sauces: KebabSauce[];
  ingredients: KebabIngredient[];
  comment?: string;
  timestamp: string;
}
```

---

## 5. Fonctionnalités Clés et Mécanismes Internes

### A. Système de Synchronisation en Direct (Live Sync)
L'application utilise l'**API File System Access** des navigateurs modernes pour offrir un comportement de type "application de bureau".
1. Un bouton **Lier un fichier** (`handleLinkFile`) demande l'accès en écriture/lecture sur un fichier local `.json` ou `.csv`.
2. S'il s'agit de JSON, les données du fichier sont chargées en mémoire et écrasent le cache local.
3. À chaque modification (ajout d'un membre, modification du planning, session kebab), l'application exécute un enregistrement automatique sur le fichier lié (`saveToFile`). Cet appel est **debouncé (temporisé de 1000ms)** pour éviter de saturer les opérations d'écriture sur le disque.
4. Si aucun fichier n'est lié, l'application fonctionne en mode **Lecture Seule** à partir du fichier par défaut `metadata.json` et de la mémoire `localStorage`.

### B. Génération de Cartes TCG (Trading Card Game)
Dans le composant [StaffCard.tsx](file:///d:/Workspace/trombinoscope/components/StaffCard.tsx) :
* Un gabarit de carte complet, très stylisé (bordures métallisées, HUD de puissance, illustration recadrée), est rendu de manière invisible hors écran (`fixed -left-[9999px]`).
* Le bouton **Générer Carte** (`handleCopyAsImage`) utilise `html-to-image` pour convertir ce nœud DOM en fichier PNG.
* La carte générée contient un **Score de puissance global** calculé automatiquement basé sur la somme des niveaux de compétences du membre.
* Le PNG obtenu est copié dans le presse-papiers via l'API `ClipboardItem` (ou téléchargé localement comme alternative de secours si le presse-papiers n'est pas accessible).

### C. Auto-évaluation Assistée par IA (Interactive Quiz)
Dans le composant [EditMemberModal.tsx](file:///d:/Workspace/trombinoscope/components/EditMemberModal.tsx) :
* Lors de la modification des compétences d'un collaborateur, un bouton permet de lancer un quiz d'évaluation technique.
* Le client instancie le SDK `@google/genai` avec la clé Gemini (injectée par le bundler à partir de la clé `GEMINI_API_KEY` du fichier `.env`).
* Il envoie une requête au modèle `gemini-3-flash-preview` pour générer un questionnaire à choix multiples (QCM) sur-mesure de 5 questions, adapté au rôle et à la compétence ciblée.
* La réponse de Gemini est contrainte sous forme de JSON structuré grâce à l'option `responseSchema`.
* Chaque option de réponse du quiz est associée à un niveau d'expérience (de 1 à 5). L'application calcule ensuite la moyenne des réponses de l'utilisateur pour définir automatiquement sa note finale de compétence.

### D. Gestion des Présences (Plan de charge)
* L'application croise le planning individuel de chaque collaborateur pour générer une vue d'occupation des bureaux interactive par jour de la semaine (Lundi-Vendredi).
* Il est possible d'assigner par drag-and-drop / clic un collaborateur non-assigné sur un poste vide ou de réaffecter en masse les postes.

---

## 6. Audit de Qualité de Code et Pistes d'Amélioration

### Points Forts (Strengths)
1. **Design haut de gamme** : Excellent respect de l'identité visuelle (mode sombre natif, effets de flou "glassmorphism", palettes de couleurs pastel selon les rôles).
2. **Utilisation avancée des APIs Web** : La synchronisation directe de fichiers JSON locaux via `File System Access API` évite d'avoir à héberger et gérer une base de données backend complexe.
3. **Expérience utilisateur immersive** : La gamification via les cartes TCG et le quiz IA ajoute une réelle valeur.

### Pistes d'Amélioration / Refactoring (Weaknesses)
1. **Saturation de l'état dans App.tsx** :
   * Le fichier principal `App.tsx` contient plus de 760 lignes. Il concentre à la fois les états du thème, du filtrage, de la liaison de fichiers, des modals d'édition, de la gestion de kebab et du rendu global.
   * **Recommandation** : Extraire les responsabilités dans des Hooks personnalisés (ex: `useKebabSessions`, `useLocalFileSystem`, `useOfficePlanning`).
2. **Exposition potentielle de la Clé API Gemini** :
   * Actuellement, la clé `GEMINI_API_KEY` est injectée dans le bundle de production par Vite (`process.env.API_KEY`). Si l'application est déployée publiquement sans protection, la clé API Gemini sera visible dans le code client.
   * **Recommandation** : Documenter ce comportement ou mettre en place une API Proxy / Passerelle légère si l'application est hébergée sur le Web public.
3. **Optimisation des performances sur html-to-image** :
   * Les images distantes des avatars (ex: `i.pravatar.cc`) peuvent provoquer des erreurs de sécurité CORS lors du rendu de la carte TCG.
   * **Recommandation** : S'assurer que le serveur d'avatars gère correctement le header `Access-Control-Allow-Origin` ou intégrer un service de proxy d'images.

---

## 7. Instructions pour les Agents de l'Architecture 3-Layers

Pour automatiser des tâches ou étendre l'application via les couches **Directive** (Layer 1) et **Execution** (Layer 3) :

* **Fichier de données central** : Les scripts de la couche 3 peuvent manipuler directement `d:\Workspace\trombinoscope\metadata.json` lorsqu'aucune session de navigateur avec Live Sync n'est active.
* **Import/Export de masse** : Vous pouvez écrire des scripts Python dans `execution/` pour :
  1. Lire les membres depuis un fichier RH externe.
  2. Mettre à jour automatiquement le fichier `metadata.json`.
  3. Générer des rapports Excel ou Google Sheets (dans `.tmp/` ou sur le Cloud) compilant le "Plan de vol" ou le coût global des sessions Kebab de la semaine.
* **Assistance IA hors-ligne** : Vous pouvez utiliser le modèle dans `.env` pour pré-remplir les descriptions de bio ou analyser les distributions de compétences à l'aide des scripts de la couche 3.
