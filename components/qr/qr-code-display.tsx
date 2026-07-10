"use client";

import { QRCodeSVG } from "qrcode.react";

export function QrCodeDisplay({ value }: { value: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] bg-white p-6">
      <QRCodeSVG value={value} size={220} fgColor="#0F172A" bgColor="#FFFFFF" level="M" />
      <p className="font-mono text-xs text-slate-500">{value}</p>
    </div>
  );
}
