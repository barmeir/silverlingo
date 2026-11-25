"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  RefreshCw,
  Copy,
  Check,
  Users,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface LiveWebRTCRoomProps {
  roomSlug: string;
  myDisplayName: string;
  partnerDisplayName: string;
  onLeave: () => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
  ],
};

export default function LiveWebRTCRoom({
  roomSlug,
  myDisplayName,
  partnerDisplayName,
  onLeave,
}: LiveWebRTCRoomProps) {
  const { lang } = useLanguage();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const myPeerIdRef = useRef<string>(
    `peer-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`
  );
  const makingOfferRef = useRef<boolean>(false);

  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [remotePeerName, setRemotePeerName] = useState<string>(
    partnerDisplayName
  );
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const t = {
    en: {
      liveHeader: `SilverLingo Live 1-on-1 Video Call (${roomSlug})`,
      connectedBadge: "2 Participants Connected Live",
      waitingBadge: "Camera Ready • Waiting for 2nd participant to join...",
      waitingOverlayTitle: `Waiting for ${partnerDisplayName} to join...`,
      waitingOverlaySub:
        "Want to test a real 2-person video call right now? Copy the room link below and open it on your phone or in a second browser tab!",
      copyInviteBtn: "Copy Link for 2nd Device / Phone",
      copiedBtn: "Link Copied! Open on 2nd Device",
      youLabel: `${myDisplayName} (You)`,
      muteBtn: micEnabled ? "Mute Mic" : "Unmute Mic",
      camBtn: cameraEnabled ? "Stop Camera" : "Start Camera",
      flipBtn: "Flip Camera",
      leaveBtn: "Leave Video Call",
      externalJitsiBtn: "Open External Jitsi Backup",
      cameraPermErr:
        "Could not access camera or microphone. Please allow camera & microphone permissions in your browser address bar.",
    },
    he: {
      liveHeader: `שיחת וידאו חיה ב-SilverLingo (${roomSlug})`,
      connectedBadge: "2 משתתפים מחוברים בשיחה חיה",
      waitingBadge: "המצלמה פועלת • ממתין להצטרפות המשתתף השני...",
      waitingOverlayTitle: `ממתין להצטרפות של ${partnerDisplayName}...`,
      waitingOverlaySub:
        "רוצים לבדוק שיחת וידאו חיה בין 2 מכשירים עכשיו? העתיקו את הקישור למטה ופתחו אותו בטלפון או בטאב נוסף!",
      copyInviteBtn: "העתק קישור למכשיר שני / טלפון",
      copiedBtn: "הקישור הועתק! פתחו במכשיר שני",
      youLabel: `${myDisplayName} (את/ה)`,
      muteBtn: micEnabled ? "השתק מיקרופון" : "הפעל מיקרופון",
      camBtn: cameraEnabled ? "כבה מצלמה" : "הפעל מצלמה",
      flipBtn: "החלף מצלמה",
      leaveBtn: "סיום שיחת וידאו",
      externalJitsiBtn: "פתיחה ב-Jitsi חיצוני",
      cameraPermErr:
        "לא ניתן היה לגשת למצלמה או למיקרופון. אנא אשרו הרשאות מצלמה ומיקרופון בדפדפן.",
    },
  }[lang];

  const cleanupPeerConnection = useCallback(() => {
    if (pcRef.current) {
      try {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }
    pendingCandidatesRef.current = [];
    setRemoteConnected(false);
  }, []);

  const createOrGetPeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    // Attach local audio & video tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "webrtc-signal",
          payload: {
            senderId: myPeerIdRef.current,
            senderName: myDisplayName,
            type: "ice-candidate",
            candidate: event.candidate.toJSON(),
          },
        });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
        setRemoteConnected(true);
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        setRemoteConnected(false);
      } else if (pc.connectionState === "connected") {
        setRemoteConnected(true);
      }
    };

    return pc;
  }, [myDisplayName]);

  const startLocalMedia = useCallback(
    async (mode: "user" | "environment") => {
      setMediaError(null);
      try {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          await localVideoRef.current.play().catch(() => {});
        }

        // If a PeerConnection already exists, replace the video/audio tracks seamlessly
        if (pcRef.current) {
          const senders = pcRef.current.getSenders();
          stream.getTracks().forEach((track) => {
            const sender = senders.find((s) => s.track?.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track).catch(() => {});
            } else {
              pcRef.current?.addTrack(track, stream);
            }
          });
        }
        return stream;
      } catch {
        setMediaError(t.cameraPermErr);
        return null;
      }
    },
    [t.cameraPermErr]
  );

  useEffect(() => {
    let mounted = true;
    let announceTimer: ReturnType<typeof setInterval> | null = null;

    async function initCall() {
      await startLocalMedia(facingMode);
      if (!mounted || !isSupabaseConfigured()) return;

      const supabase = createClient();
      const channel = supabase.channel(`silverlingo-video-${roomSlug}`, {
        config: { broadcast: { self: false } },
      });
      channelRef.current = channel;

      const initiateOffer = async () => {
        try {
          makingOfferRef.current = true;
          const pc = createOrGetPeerConnection();
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          channel.send({
            type: "broadcast",
            event: "webrtc-signal",
            payload: {
              senderId: myPeerIdRef.current,
              senderName: myDisplayName,
              type: "offer",
              sdp: pc.localDescription,
            },
          });
        } catch {
          // Ignore transient offer race
        } finally {
          makingOfferRef.current = false;
        }
      };

      channel.on(
        "broadcast",
        { event: "webrtc-signal" },
        async ({ payload }) => {
          if (!mounted || !payload || payload.senderId === myPeerIdRef.current) {
            return;
          }

          if (payload.senderName) {
            setRemotePeerName(payload.senderName);
          }

          const pc = createOrGetPeerConnection();
          const isPolite = myPeerIdRef.current < payload.senderId;

          try {
            if (payload.type === "join-ready") {
              // Deterministic offerer so both peers don't glare simultaneously
              if (
                pc.connectionState !== "connected" &&
                (myPeerIdRef.current > payload.senderId ||
                  pc.signalingState === "stable")
              ) {
                await initiateOffer();
              }
            } else if (payload.type === "offer" && payload.sdp) {
              const offerCollision =
                makingOfferRef.current || pc.signalingState !== "stable";
              if (offerCollision && !isPolite) {
                return;
              }

              await pc.setRemoteDescription(
                new RTCSessionDescription(payload.sdp)
              );

              while (pendingCandidatesRef.current.length > 0) {
                const cand = pendingCandidatesRef.current.shift();
                if (cand) {
                  await pc
                    .addIceCandidate(new RTCIceCandidate(cand))
                    .catch(() => {});
                }
              }

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              channel.send({
                type: "broadcast",
                event: "webrtc-signal",
                payload: {
                  senderId: myPeerIdRef.current,
                  senderName: myDisplayName,
                  type: "answer",
                  sdp: pc.localDescription,
                },
              });
            } else if (payload.type === "answer" && payload.sdp) {
              if (pc.signalingState === "have-local-offer") {
                await pc.setRemoteDescription(
                  new RTCSessionDescription(payload.sdp)
                );
                while (pendingCandidatesRef.current.length > 0) {
                  const cand = pendingCandidatesRef.current.shift();
                  if (cand) {
                    await pc
                      .addIceCandidate(new RTCIceCandidate(cand))
                      .catch(() => {});
                  }
                }
              }
            } else if (payload.type === "ice-candidate" && payload.candidate) {
              if (pc.remoteDescription && pc.remoteDescription.type) {
                await pc
                  .addIceCandidate(new RTCIceCandidate(payload.candidate))
                  .catch(() => {});
              } else {
                pendingCandidatesRef.current.push(payload.candidate);
              }
            } else if (payload.type === "peer-left") {
              cleanupPeerConnection();
            }
          } catch {
            // Ignore signaling race errors
          }
        }
      );

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          const sendReady = () => {
            if (!pcRef.current || pcRef.current.connectionState !== "connected") {
              channel.send({
                type: "broadcast",
                event: "webrtc-signal",
                payload: {
                  senderId: myPeerIdRef.current,
                  senderName: myDisplayName,
                  type: "join-ready",
                },
              });
            }
          };
          sendReady();
          announceTimer = setInterval(sendReady, 3500);
        }
      });
    }

    initCall();

    return () => {
      mounted = false;
      if (announceTimer) clearInterval(announceTimer);
      if (channelRef.current) {
        try {
          channelRef.current.send({
            type: "broadcast",
            event: "webrtc-signal",
            payload: {
              senderId: myPeerIdRef.current,
              type: "peer-left",
            },
          });
          channelRef.current.unsubscribe();
        } catch {}
      }
      cleanupPeerConnection();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomSlug]);

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const next = !micEnabled;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setMicEnabled(next);
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const next = !cameraEnabled;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setCameraEnabled(next);
  };

  const handleFlipCamera = async () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    await startLocalMedia(nextMode);
  };

  const handleCopyInviteLink = async () => {
    try {
      const url =
        typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {}
  };

  return (
    <div className="rounded-3xl bg-slate-950 text-white border-4 border-[#4A148C] overflow-hidden shadow-2xl">
      {/* Top Status Bar */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#2A0854] via-[#4A148C] to-[#1A0436] flex flex-wrap items-center justify-between gap-3 border-b border-white/15">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-3 h-3 rounded-full ${
              remoteConnected
                ? "bg-emerald-400 animate-ping"
                : "bg-amber-400 animate-pulse"
            }`}
          />
          <span className="font-extrabold text-sm sm:text-base text-white">
            {t.liveHeader}
          </span>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
            remoteConnected
              ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-200"
              : "bg-amber-500/20 border border-amber-400/40 text-amber-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{remoteConnected ? t.connectedBadge : t.waitingBadge}</span>
        </div>
      </div>

      {mediaError && (
        <div className="p-4 bg-red-950/90 border-b border-red-500/40 text-red-200 text-xs sm:text-sm font-bold text-center">
          ⚠️ {mediaError}
        </div>
      )}

      {/* Dual Video Stage (Local Camera + Remote Participant Video) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4 bg-slate-900">
        {/* Local Participant Video Feed */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border-2 border-[#FF6D00] shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${
              facingMode === "user" ? "scale-x-[-1]" : ""
            } ${!cameraEnabled ? "opacity-0" : "opacity-100"}`}
          />
          {!cameraEnabled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400 gap-2">
              <VideoOff className="w-10 h-10 text-[#FF6D00]" />
              <span className="text-xs font-bold">{t.youLabel}</span>
            </div>
          )}
          <div className="absolute bottom-2.5 left-2.5 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-white text-xs font-extrabold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{t.youLabel}</span>
          </div>
        </div>

        {/* Remote Participant Video Feed */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border-2 border-purple-400/50 shadow-lg flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${
              remoteConnected ? "opacity-100" : "opacity-0"
            }`}
          />

          {!remoteConnected && (
            <div className="absolute inset-0 p-5 flex flex-col items-center justify-center text-center space-y-3 bg-gradient-to-b from-[#1E0B36] to-slate-950">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#FF6D00] animate-pulse" />
              </div>
              <div className="space-y-1 max-w-xs">
                <p className="text-sm sm:text-base font-extrabold text-white">
                  {t.waitingOverlayTitle}
                </p>
                <p className="text-xs text-purple-200/80 leading-relaxed">
                  {t.waitingOverlaySub}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#FF6D00] hover:bg-[#E65100] text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-md transition-colors"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copiedLink ? t.copiedBtn : t.copyInviteBtn}</span>
              </button>
            </div>
          )}

          {remoteConnected && (
            <div className="absolute bottom-2.5 left-2.5 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-white text-xs font-extrabold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{remotePeerName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Call Controls Bar */}
      <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-white/15 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleMic}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl font-extrabold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-colors ${
              micEnabled
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-red-600/80 hover:bg-red-600 text-white"
            }`}
          >
            {micEnabled ? (
              <Mic className="w-4 h-4 text-emerald-400" />
            ) : (
              <MicOff className="w-4 h-4" />
            )}
            <span>{t.muteBtn}</span>
          </button>

          <button
            type="button"
            onClick={toggleCamera}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl font-extrabold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-colors ${
              cameraEnabled
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-red-600/80 hover:bg-red-600 text-white"
            }`}
          >
            {cameraEnabled ? (
              <Video className="w-4 h-4 text-emerald-400" />
            ) : (
              <VideoOff className="w-4 h-4" />
            )}
            <span>{t.camBtn}</span>
          </button>

          <button
            type="button"
            onClick={handleFlipCamera}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-purple-300" />
            <span>{t.flipBtn}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyInviteLink}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-100 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-purple-300" />
            )}
            <span>{copiedLink ? t.copiedBtn : t.copyInviteBtn}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://meet.jit.si/${roomSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
            <span>{t.externalJitsiBtn}</span>
          </a>

          <button
            type="button"
            onClick={onLeave}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 shadow-md transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            <span>{t.leaveBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
