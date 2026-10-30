import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  FolderCheck,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { SchemeMatchResult } from '../types/scheme';

interface DocumentChecklistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  results: SchemeMatchResult[];
}

export const DocumentChecklistDrawer: React.FC<DocumentChecklistDrawerProps> = ({
  isOpen,
  onClose,
  results,
}) => {
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  // Aggregate all unique required documents from high & moderate schemes
  const eligibleSchemes = results.filter(
    (r) => r.relevanceIndicator === 'High' || r.relevanceIndicator === 'Moderate'
  );

  const docMap: Record<string, string[]> = {};
  eligibleSchemes.forEach((res) => {
    res.scheme.requiredDocuments.forEach((doc) => {
      if (!docMap[doc]) {
        docMap[doc] = [];
      }
      docMap[doc].push(res.scheme.name);
    });
  });

  const docList = Object.keys(docMap);
  const checkedCount = docList.filter((d) => checkedDocs[d]).length;
  const progressPercent = docList.length > 0 ? Math.round((checkedCount / docList.length) * 100) : 0;

  const toggleDoc = (doc: string) => {
    setCheckedDocs((prev) => ({ ...prev, [doc]: !prev[doc] }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-doc-title"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end"
    >
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500 rounded-lg text-slate-950 font-bold">
              <FolderCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="drawer-doc-title" className="text-base font-bold text-white">
                Master Document Readiness Checklist
              </h3>
              <p className="text-xs text-slate-400">
                Aggregated for your top {eligibleSchemes.length} matching schemes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close document checklist drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Readiness Progress Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>Document Readiness Status</span>
            <span>
              {checkedCount} of {docList.length} Ready ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Checklist Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
            <strong>Important Revenue Portal Tip:</strong> For Karnataka scholarships and reservations, always obtain current <strong>RD Numbers</strong> for Income and Caste certificates from Nadakacheri (<a href="https://nadakacheri.karnataka.gov.in" target="_blank" rel="noreferrer" className="underline font-semibold">nadakacheri.karnataka.gov.in</a>).
          </div>

          <div className="space-y-2">
            {docList.map((doc, idx) => {
              const isChecked = Boolean(checkedDocs[doc]);
              const requiredBySchemes = docMap[doc];
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition ${
                    isChecked
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDoc(doc)}
                      className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <div className="flex-1">
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          isChecked ? 'line-through text-slate-500' : 'text-slate-800'
                        }`}
                      >
                        {doc}
                      </span>
                      <div className="mt-1 flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-slate-500">Needed for:</span>
                        {requiredBySchemes.slice(0, 3).map((s, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                          >
                            {s}
                          </span>
                        ))}
                        {requiredBySchemes.length > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{requiredBySchemes.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Need help getting documents? Visit Grama One or Karnataka One.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
