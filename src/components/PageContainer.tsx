import React from "react";

export function PageContainer({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <div className="bg-white rounded-2xl border shadow-sm p-4">
        {children}
      </div>
    </div>
  );
}
