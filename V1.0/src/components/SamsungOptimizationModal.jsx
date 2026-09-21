import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Battery,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  X,
  RotateCcw,
  Sparkles,
  BellRing,
  MapPin,
  HelpCircle,
  Zap
} from 'lucide-react';
import {
  getDeviceInfo,
  openSamsungBatterySettings,
  openAppSettings,
  checkDeviceOptimizationStatus,
  sendArrivalAlert,
  isNative
} from '../services/nativeLocation';

export default function SamsungOptimizationModal({ isOpen, onClose }) {
  const [deviceInfo, setDeviceInfo] = useState({
    manufacturer: 'Android',
    model: 'Device',
    isSamsung: true,
  });
  const [status, setStatus] = useState({
    isIgnoringBattery: false,
    hasLocationPermission: true,
    hasBackgroundPermission: true,
    canScheduleExactAlarms: true,
  });
  const [loading, setLoading] = useState(true);
  const [testSent, setTestSent] = useState(false);

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const [info, optStatus] = await Promise.all([
        getDeviceInfo(),
        checkDeviceOptimizationStatus(),
      ]);
      setDeviceInfo(info || {});
      setStatus({
        isIgnoringBattery: optStatus?.isIgnoringBatteryOptimizations ?? false,
        hasLocationPermission: optStatus?.hasLocationPermission ?? true,
        hasBackgroundPermission: optStatus?.hasBackgroundPermission ?? true,
        canScheduleExactAlarms: optStatus?.canScheduleExactAlarms ?? true,
      });
    } catch (err) {
      console.warn('Error refreshing optimization status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isSamsung = deviceInfo?.isSamsung ?? true;
  const isFullyOptimized = status.isIgnoringBattery && status.hasBackgroundPermission;

  const handleOpenBatterySettings = async () => {
    if (isSamsung) {
      await openSamsungBatterySettings();
    } else {
      await openAppSettings();
    }
    setTimeout(refreshStatus, 2000);
  };

  const handleTestAlert = () => {
    setTestSent(true);
    sendArrivalAlert({
      title: 'Samsung Edge Lighting Test ✨',
      body: 'GeoRemind heads-up notification and sound are operating properly!',
      reminderId: 'test-samsung-edge',
      soundProfile: 'crystal',
    });
    setTimeout(() => setTestSent(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900/95 border border-slate-700/70 p-6 shadow-2xl text-slate-100 backdrop-blur-xl"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(56, 189, 248, 0.15)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20">
            <Smartphone size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">
                {isSamsung ? 'Samsung Galaxy Assistant' : 'Device Compatibility Guide'}
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {isSamsung ? 'One UI Ready' : 'Universal'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {deviceInfo.manufacturer} {deviceInfo.model ? `• ${deviceInfo.model}` : ''}
            </p>
          </div>
        </div>

        {/* Status Summary Banner */}
        <div
          className={`p-4 rounded-2xl mb-5 border transition-all ${
            isFullyOptimized
              ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-200'
              : 'bg-amber-950/30 border-amber-700/50 text-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {isFullyOptimized ? (
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <div className="font-semibold text-sm mb-1 text-white">
                {isFullyOptimized
                  ? '✨ Fully Optimized for Background Alerts'
                  : isSamsung
                  ? '⚠️ Samsung Battery Saver Needs Configuration'
                  : '⚠️ Background Permissions Require Adjustment'}
              </div>
              <p className="text-slate-300 leading-relaxed">
                {isFullyOptimized
                  ? 'GeoRemind has unrestricted background access and will reliably trigger alarms even when screen is locked in pocket.'
                  : isSamsung
                  ? 'Samsung One UI automatically sleeps background tracking unless you set Battery to "Unrestricted" in App Info.'
                  : 'Grant "Allow all the time" location and exempt battery optimization for continuous alerts.'}
              </p>
            </div>
          </div>
        </div>

        {/* Checklist Steps */}
        <div className="space-y-3.5 mb-6 text-sm">
          {/* Step 1: Battery Unrestricted */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-medium text-slate-200">
                <Battery size={18} className="text-amber-400" />
                <span>1. Set Battery to "Unrestricted"</span>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  status.isIgnoringBattery
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {status.isIgnoringBattery ? 'Unrestricted' : 'Optimized (Restricted)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isSamsung
                ? 'Tap below to open App Info -> Tap "Battery" -> Choose "Unrestricted" so Samsung Device Care won\'t freeze your reminders.'
                : 'Allow GeoRemind to run in background without OS battery saver throttling.'}
            </p>
            <button
              onClick={handleOpenBatterySettings}
              className="mt-1 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Zap size={14} />
              <span>{isSamsung ? 'Open Samsung Battery / App Settings' : 'Open Device App Settings'}</span>
              <ExternalLink size={13} />
            </button>
          </div>

          {/* Step 2: Samsung Never Sleeping Apps (Samsung Specific) */}
          {isSamsung && (
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-medium text-slate-200">
                  <ShieldAlert size={18} className="text-sky-400" />
                  <span>2. Add to "Never Sleeping Apps"</span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  One UI Tip
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                In phone <strong className="text-slate-200">Settings</strong> →{' '}
                <strong className="text-slate-200">Device Care</strong> →{' '}
                <strong className="text-slate-200">Battery</strong> →{' '}
                <strong className="text-slate-200">Background usage limits</strong> →{' '}
                <strong className="text-slate-200">Never sleeping apps</strong> → Tap{' '}
                <strong className="text-slate-200">(+)</strong> and add GeoRemind.
              </p>
            </div>
          )}

          {/* Step 3: Location Access */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-medium text-slate-200">
                <MapPin size={18} className="text-emerald-400" />
                <span>{isSamsung ? '3.' : '2.'} Location: "Allow all the time"</span>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  status.hasBackgroundPermission
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {status.hasBackgroundPermission ? 'Granted' : 'Needs Setup'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Requires "Allow all the time" and "Use precise location" so arrival triggers activate before you step inside the store.
            </p>
          </div>

          {/* Step 4: Auto-Restart Persistence */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-medium text-slate-200">
                <RotateCcw size={18} className="text-purple-400" />
                <span>{isSamsung ? '4.' : '3.'} Overnight Auto-Restart Protection</span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Protected
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Samsung phones reboot automatically at 3:00 AM by default. GeoRemind now includes a Boot Completed Receiver that automatically restores background tracking after restart.
            </p>
          </div>

          {/* Step 5: Edge Lighting & Heads-Up Alert Test */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-medium text-slate-200">
                <BellRing size={18} className="text-pink-400" />
                <span>{isSamsung ? '5.' : '4.'} Edge Lighting & Lock Screen Alarms</span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                MAX Priority
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Configured with alarm stream audio, strong hardware vibration, and cyan Edge Lighting for Samsung Galaxy screens.
            </p>
            <button
              onClick={handleTestAlert}
              disabled={testSent}
              className="w-full py-2 px-3 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles size={14} className={testSent ? 'animate-spin text-sky-400' : 'text-amber-400'} />
              <span>{testSent ? 'Sounding Alarm & Sending Heads-Up...' : 'Send Test Heads-Up & Edge Light Alert'}</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={refreshStatus}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1.5 px-2"
          >
            <RotateCcw size={13} className={loading ? 'animate-spin text-sky-400' : ''} />
            <span>Recheck Status</span>
          </button>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs transition-colors cursor-pointer shadow-md shadow-sky-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
