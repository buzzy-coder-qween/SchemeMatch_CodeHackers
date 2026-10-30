import React from 'react';
import { PREDEFINED_PERSONAS, PredefinedPersona } from '../data/personas';
import { UserProfile } from '../types/scheme';
import { User, Sparkles } from 'lucide-react';

interface PersonaSelectorProps {
  currentProfile: UserProfile;
  onSelectPersona: (persona: PredefinedPersona) => void;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  onSelectPersona,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Instant Citizen Personas
            </h3>
            <p className="text-xs text-slate-500">
              Select a pre-filled realistic Karnataka or Central profile to test instant weighted matching
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
          <Sparkles className="w-3 h-3 text-amber-600" /> 1-Click Load
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {PREDEFINED_PERSONAS.map((persona) => {
          return (
            <button
              key={persona.id}
              type="button"
              onClick={() => onSelectPersona(persona)}
              className="text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-amber-50/70 hover:border-amber-300 transition group flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded block w-fit mb-1 truncate max-w-full">
                  {persona.badge}
                </span>
                <p className="text-xs font-bold text-slate-800 group-hover:text-amber-900 leading-tight">
                  {persona.name}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-snug">
                {persona.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
