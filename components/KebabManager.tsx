import React, { useMemo, useState } from "react";
import {
  KebabIngredient,
  KebabOrder,
  KebabSauce,
  KebabSession,
  Project,
  StaffMember,
} from "../types";

interface KebabManagerProps {
  sessions: KebabSession[];
  projects: Project[];
  isEditable: boolean;
  onAddSession: () => void;
  onCloseSession: (sessionId: string) => void;
  onSaveOrder: (
    sessionId: string,
    order: Omit<KebabOrder, "timestamp">,
  ) => void;
  onDeleteSession: (sessionId: string) => void;
}

const KebabManager: React.FC<KebabManagerProps> = ({
  sessions,
  projects,
  isEditable,
  onAddSession,
  onCloseSession,
  onSaveOrder,
  onDeleteSession,
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    sessions.length > 0 ? sessions[0].id : null,
  );
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedSauces, setSelectedSauces] = useState<KebabSauce[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<
    KebabIngredient[]
  >([]);

  const allMembers = useMemo(() => {
    const members: StaffMember[] = [];
    projects.forEach((p) => members.push(...p.members));
    return members;
  }, [projects]);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId),
    [sessions, selectedSessionId],
  );

  const toggleIngredient = (ingredient: KebabIngredient) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((i) => i !== ingredient)
        : [...prev, ingredient],
    );
  };

  const toggleSauce = (sauce: KebabSauce) => {
    setSelectedSauces((prev) =>
      prev.includes(sauce) ? prev.filter((s) => s !== sauce) : [...prev, sauce],
    );
  };

  const handleEditOrder = (order: KebabOrder) => {
    setEditingOrderId(order.id);
    setSelectedMemberId(order.memberId);
    setSelectedSauces(order.sauces || []);
    setSelectedIngredients(order.ingredients);
    setShowOrderForm(true);
  };

  const handleOpenNewOrder = () => {
    setEditingOrderId(null);
    setSelectedMemberId("");
    setSelectedSauces([]);
    setSelectedIngredients([]);
    setShowOrderForm(true);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || !selectedMemberId) return;

    const member = allMembers.find((m) => m.id === selectedMemberId);
    if (!member) return;

    onSaveOrder(selectedSessionId, {
      id: editingOrderId || `ko-${Date.now()}`,
      memberId: selectedMemberId,
      memberName: member.name,
      sauces: selectedSauces,
      ingredients: selectedIngredients,
    });

    setShowOrderForm(false);
    setEditingOrderId(null);
    setSelectedMemberId("");
    setSelectedSauces([]);
    setSelectedIngredients([]);
  };

  const getMemberHistory = (memberId: string) => {
    const history: KebabOrder[] = [];
    sessions.forEach((s) => {
      s.orders.forEach((o) => {
        if (o.memberId === memberId) history.push(o);
      });
    });
    return history.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight dark:text-white">
            Kebab Sessions
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
            Gérez les désidérata de l'équipe
          </p>
        </div>
        {isEditable && (
          <button
            onClick={onAddSession}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-sky-500/20 transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i> Nouvelle Session
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: Sessions List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-sky-500/5 border border-gray-100 dark:border-slate-800">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
              Historique des Sessions
            </h3>
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-4">
                  Aucune session créée.
                </p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${
                      selectedSessionId === session.id
                        ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                        : "hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-black">
                        {new Date(session.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <span
                        className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full mt-1 inline-block ${
                          session.status === "open"
                            ? selectedSessionId === session.id
                              ? "bg-white/20 text-white"
                              : "bg-emerald-500/10 text-emerald-500"
                            : selectedSessionId === session.id
                              ? "bg-white/20 text-white"
                              : "bg-gray-500/10 text-gray-500"
                        }`}
                      >
                        {session.status === "open" ? "Ouverte" : "Terminée"}
                      </span>
                    </div>
                    <i className="fa-solid fa-chevron-right text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content: Session Details & Orders */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSession ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl shadow-sky-500/5 border border-gray-100 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <div className="w-24 h-24 bg-sky-500/5 rounded-full flex items-center justify-center -mr-12 -mt-12 rotate-12">
                  <i className="fa-solid fa-utensils text-4xl text-sky-500/20"></i>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative z-10">
                <div>
                  <h3 className="text-2xl font-black dark:text-white">
                    Session du{" "}
                    {new Date(selectedSession.date).toLocaleDateString("fr-FR")}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedSession.orders.length} commande
                    {selectedSession.orders.length > 1 ? "s" : ""} enregistrée
                    {selectedSession.orders.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {isEditable && selectedSession.status === "open" && (
                    <>
                      <button
                        onClick={handleOpenNewOrder}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                      >
                        Ajouter un souhait
                      </button>
                      <button
                        onClick={() => onCloseSession(selectedSession.id)}
                        className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20"
                      >
                        Clôturer
                      </button>
                    </>
                  )}
                  {isEditable && (
                    <button
                      onClick={() => {
                        if (confirm("Supprimer cette session ?"))
                          onDeleteSession(selectedSession.id);
                      }}
                      className="w-10 h-10 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                {selectedSession.orders.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-3xl">
                    <i className="fa-solid fa-burger text-4xl text-gray-200 mb-4"></i>
                    <p className="text-gray-400 font-bold">
                      Aucune commande pour le moment.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSession.orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 group hover:border-sky-500/30 transition-all relative"
                      >
                        {isEditable && selectedSession.status === "open" && (
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 text-gray-400 hover:text-sky-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <i className="fa-solid fa-pen-to-square text-xs"></i>
                          </button>
                        )}
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 font-black text-xs">
                            {order.memberName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black dark:text-white">
                              {order.memberName}
                            </p>
                            <p className="text-[10px] text-sky-500 font-bold uppercase tracking-tighter">
                              Sauce{order.sauces.length > 1 ? "s" : ""}:{" "}
                              {order.sauces.join(", ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {order.ingredients.map((ing) => (
                            <span
                              key={ing}
                              className="px-2 py-0.5 bg-white dark:bg-slate-700 text-[8px] font-black text-gray-500 dark:text-slate-400 rounded-md border border-gray-200 dark:border-slate-600 uppercase tracking-tighter"
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-sky-500/5 border border-gray-100 dark:border-slate-800">
              <div className="w-20 h-20 bg-sky-50 dark:bg-sky-900/20 rounded-3xl flex items-center justify-center text-sky-500 mb-6">
                <i className="fa-solid fa-utensils text-3xl"></i>
              </div>
              <h3 className="text-xl font-black dark:text-white mb-2">
                Sélectionnez une session
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Choisissez une session dans la liste de gauche pour voir les
                détails ou en créer une nouvelle.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl p-8 border border-sky-100 dark:border-sky-900/30 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black dark:text-white">
                {editingOrderId ? "Modifier le souhait" : "Passer une commande"}
              </h3>
              <button
                onClick={() => setShowOrderForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-8">
              {/* Member Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Collaborateur
                </label>
                <select
                  required
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm dark:text-white focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Choisir un membre...</option>
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>

                {selectedMemberId && (
                  <div className="mt-4 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-100 dark:border-sky-900/30">
                    <p className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-2">
                      Historique Personnel
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {getMemberHistory(selectedMemberId).length === 0 ? (
                        <p className="text-[10px] text-sky-400 italic">
                          Aucun historique.
                        </p>
                      ) : (
                        getMemberHistory(selectedMemberId)
                          .slice(0, 3)
                          .map((order) => (
                            <div
                              key={order.id}
                              className="flex-shrink-0 bg-white dark:bg-slate-800 p-3 rounded-xl border border-sky-200 dark:border-sky-800 min-w-[140px]"
                            >
                              <p className="text-[9px] font-black text-gray-400 mb-1">
                                {new Date(order.timestamp).toLocaleDateString()}
                              </p>
                              <p className="text-[10px] font-bold dark:text-white">
                                Sauces: {order.sauces.join(", ")}
                              </p>
                              <p className="text-[8px] text-gray-500 truncate">
                                {order.ingredients.join(", ")}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSauces(order.sauces);
                                  setSelectedIngredients(order.ingredients);
                                }}
                                className="mt-2 text-[8px] font-black text-sky-500 uppercase hover:underline"
                              >
                                Reprendre
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sauce Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Choix des Sauces (plusieurs possibles)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.values(KebabSauce).map((sauce) => (
                    <button
                      key={sauce}
                      type="button"
                      onClick={() => toggleSauce(sauce)}
                      className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-tighter border-2 transition-all flex items-center justify-between ${
                        selectedSauces.includes(sauce)
                          ? "bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/20"
                          : "bg-gray-50 dark:bg-slate-800 border-transparent text-gray-500 hover:border-sky-200 dark:hover:border-sky-800"
                      }`}
                    >
                      {sauce}
                      {selectedSauces.includes(sauce) && (
                        <i className="fa-solid fa-check"></i>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingredients Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Ingrédients & Suppléments
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.values(KebabIngredient).map((ing) => (
                    <button
                      key={ing}
                      type="button"
                      onClick={() => toggleIngredient(ing)}
                      className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-tighter border-2 transition-all flex items-center justify-between ${
                        selectedIngredients.includes(ing)
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                          : "bg-gray-50 dark:bg-slate-800 border-transparent text-gray-500 hover:border-emerald-200 dark:hover:border-emerald-800"
                      }`}
                    >
                      {ing}
                      {selectedIngredients.includes(ing) && (
                        <i className="fa-solid fa-check"></i>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOrderForm(false)}
                  className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-sky-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-sky-600/20 hover:bg-sky-700 transition-all"
                >
                  {editingOrderId ? "Mettre à jour" : "Confirmer le souhait"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KebabManager;
