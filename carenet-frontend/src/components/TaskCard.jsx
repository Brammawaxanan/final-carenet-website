import React from "react";
import { Clock, CheckCircle, Camera, Edit3, Trash2, Eye, Upload, Shield } from "lucide-react";

const prettyStatus = (s) => s.replace("_", " ");

const statusBadge = (status) => {
  switch (status) {
    case "LOCKED":
    case "VERIFIED":
      return "bg-green-50 text-green-700 border-green-200";
    case "COMPLETED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "AWAITING_PROOF":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-pale-50 text-pale-600 border-pale-200";
  }
};

const statusIcon = (status) => {
  switch (status) {
    case "LOCKED":
    case "VERIFIED":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "COMPLETED":
      return <CheckCircle className="w-5 h-5 text-blue-600" />;
    case "AWAITING_PROOF":
      return <Camera className="w-5 h-5 text-amber-500" />;
    default:
      return <Clock className="w-5 h-5 text-pale-400" />;
  }
};

export default function TaskCard({
  task,
  role = "user",      // "user" | "caregiver"
  isSubscribed = true,
  onEdit,
  onDelete,
  onComplete,
  onVerify,
  onUploadProof,
}) {
  const hasProof = task.proofs && task.proofs.length > 0;
  const canComplete = ["DRAFT", "AWAITING_PROOF"].includes(task.status) && hasProof;
  const canVerify = task.status === "COMPLETED";

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="mt-1">{statusIcon(task.status)}</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold text-lg ${["LOCKED", "VERIFIED", "COMPLETED"].includes(task.status) ? "text-pale-600" : "text-pale-900"}`}>
                {task.title}
              </h3>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusBadge(task.status)}`}>
                {prettyStatus(task.status)}
              </span>
            </div>
            {task.description && <p className="text-pale-600">{task.description}</p>}
            {task.dueAt && (
              <p className="mt-1 text-sm text-pale-500">
                Due: {new Date(task.dueAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Actions by role */}
        {/* User*/}
        <div className="flex items-center gap-2">
          {role === "user" && isSubscribed && (
            <>
              <button onClick={onEdit} className="p-2 text-pale-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={onDelete} className="p-2 text-pale-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
              {canVerify && (
                <button onClick={onVerify} className="px-3 py-1 bg-primary-100 text-primary-700 hover:bg-primary-200 text-sm font-medium rounded-lg">
                  Verify (Lock)
                </button>
              )}
            </>
          )}

          {/* Caregiver */}
          {role === "caregiver" && (
            <>
              {!hasProof && !["COMPLETED", "VERIFIED", "LOCKED"].includes(task.status) && (
                <label className="px-3 py-1 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg cursor-pointer flex items-center gap-2 text-sm font-medium">
                  <Upload className="w-4 h-4" />
                  <span>Upload Proof</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onUploadProof && onUploadProof(task.id, e.target.files[0])}
                  />
                </label>
              )}
              {hasProof && !["COMPLETED", "VERIFIED", "LOCKED"].includes(task.status) && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Proof uploaded
                  </span>
                  <button onClick={onComplete} className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 text-sm font-medium rounded-lg">
                    Mark Complete
                  </button>
                </div>
              )}
            </>
          )}

          <button className="p-2 text-pale-500 hover:text-pale-700 hover:bg-pale-100 rounded-lg">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* show green bar*/}

      {["LOCKED", "VERIFIED", "COMPLETED"].includes(task.status) && (
        <div className="mt-4 pt-4 border-t border-pale-200">
          <div className="w-full bg-pale-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full w-full"></div>
          </div>
          <p className="text-xs text-pale-500 mt-1 flex items-center gap-1"><Shield className="w-3 h-3" /> Task finalized</p>
      </div>
      )}
    </div>
  );
}