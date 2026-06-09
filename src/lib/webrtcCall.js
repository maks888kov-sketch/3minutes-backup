/* Signaling for 1:1 video calls via Base44 Message entity */
import { base44 } from '@/api/base44Client';
import { getIceServers } from '@/lib/iceServers';

/** Base44 Message.type только: text | photo | voice | system — сигналы шлём в system */
export const WEBRTC_SIGNAL_PREFIX = '__webrtc__:';

const ICE_MAX_AGE_MS = 3 * 60 * 1000;
const SDP_MAX_AGE_MS = 60 * 60 * 1000;
const SIGNAL_FETCH_LIMIT = 500;

const ICE_SERVERS = getIceServers();

export function isWebRtcSignalMessage(msg) {
  if (!msg?.content || typeof msg.content !== 'string') return false;
  if (msg.content.startsWith(WEBRTC_SIGNAL_PREFIX)) return true;
  return msg.type === 'webrtc_signal';
}

export function getWebRtcSignalPayload(msg) {
  if (!msg?.content) return null;
  if (msg.content.startsWith(WEBRTC_SIGNAL_PREFIX)) {
    return msg.content.slice(WEBRTC_SIGNAL_PREFIX.length);
  }
  return msg.content;
}

export function pickInitiatorProfileId(profileAId, profileBId) {
  if (!profileAId || !profileBId) return profileAId || profileBId;
  return profileAId.localeCompare(profileBId) < 0 ? profileAId : profileBId;
}

async function sendSignal(matchId, senderProfileId, payload) {
  await base44.entities.Message.create({
    match_id: matchId,
    sender_profile_id: senderProfileId,
    type: 'system',
    content: `${WEBRTC_SIGNAL_PREFIX}${JSON.stringify(payload)}`,
  });
}

function parseSignalContent(raw) {
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

function isPeerConnected(pc) {
  if (!pc) return false;
  return (
    pc.connectionState === 'connected'
    || pc.iceConnectionState === 'connected'
    || pc.iceConnectionState === 'completed'
  );
}

function isSignalStale(msg, kind) {
  const created = new Date(msg.created_date).getTime();
  if (!Number.isFinite(created)) return false;
  const maxAge = kind === 'ice' ? ICE_MAX_AGE_MS : SDP_MAX_AGE_MS;
  return created < Date.now() - maxAge;
}

async function resolveMessageFromEvent(event) {
  let msg = event?.data;
  if (!msg?.id) return null;
  if (msg._oversize || !msg.content?.includes(WEBRTC_SIGNAL_PREFIX)) {
    try {
      msg = await base44.entities.Message.get(msg.id);
    } catch {
      return event?.data || null;
    }
  }
  return msg;
}

export function createMatchWebRtcSession({
  matchId,
  myProfileId,
  otherProfileId,
  onRemoteStream,
  onConnectionState,
  onPeerJoined,
  onError,
}) {
  let pc = null;
  let localStream = null;
  let remoteMediaStream = null;
  let stopped = false;
  const seenSignalIds = new Set();
  const iceQueue = [];
  let remoteDescriptionSet = false;
  let lastRemoteOffer = null;
  let unsubscribeRealtime = null;
  const isInitiator = pickInitiatorProfileId(myProfileId, otherProfileId) === myProfileId;

  const reportError = (err) => {
    console.error('[webrtc]', err);
    onError?.(err);
  };

  const emitRemoteStream = () => {
    if (remoteMediaStream?.getTracks().length) {
      onRemoteStream?.(remoteMediaStream);
    }
  };

  const flushIceQueue = async () => {
    if (!pc || !remoteDescriptionSet) return;
    while (iceQueue.length) {
      const candidate = iceQueue.shift();
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        // stale candidate
      }
    }
  };

  const applyOffer = async (sdp) => {
    if (!pc || stopped || isInitiator) return false;
    if (isPeerConnected(pc)) return true;

    const state = pc.signalingState;
    if (state === 'have-local-offer') return false;
    if (state !== 'stable' && state !== 'have-remote-offer') return false;

    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    remoteDescriptionSet = true;
    await flushIceQueue();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await sendSignal(matchId, myProfileId, { kind: 'answer', sdp: answer });
    return true;
  };

  const handleRemoteSignal = async (raw, createdAt, kindHint) => {
    if (!pc || stopped) return;
    const data = parseSignalContent(raw);
    if (!data?.kind) return;

    try {
      if (data.kind === 'join') {
        onPeerJoined?.(data);
        return;
      }

      if (data.kind === 'need-offer') {
        if (isInitiator && !isPeerConnected(pc)) {
          await sendOffer(true);
        }
        return;
      }

      if (data.kind === 'offer' && !isInitiator) {
        lastRemoteOffer = data.sdp;
        await applyOffer(data.sdp);
      } else if (data.kind === 'answer' && isInitiator) {
        if (pc.signalingState === 'have-local-offer' && !remoteDescriptionSet) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          remoteDescriptionSet = true;
          await flushIceQueue();
        }
      } else if (data.kind === 'ice' && data.candidate) {
        if (createdAt && isSignalStale({ created_date: createdAt }, 'ice')) {
          return;
        }
        const candidate = new RTCIceCandidate(data.candidate);
        if (!remoteDescriptionSet) {
          iceQueue.push(candidate);
        } else {
          try {
            await pc.addIceCandidate(candidate);
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      reportError(err);
    }
  };

  const ingestSignalMessage = async (msg) => {
    if (!msg?.id || stopped) return;
    if (msg.sender_profile_id === myProfileId) return;
    if (!isWebRtcSignalMessage(msg)) return;
    if (seenSignalIds.has(msg.id)) return;

    const payload = getWebRtcSignalPayload(msg);
    if (!payload) return;
    const data = parseSignalContent(payload);
    if (!data?.kind) return;
    if (isSignalStale(msg, data.kind)) return;

    seenSignalIds.add(msg.id);
    await handleRemoteSignal(payload, msg.created_date, data.kind);
  };

  const pollSignals = async () => {
    if (stopped || !matchId) return;
    try {
      const msgs = await base44.entities.Message.filter(
        { match_id: matchId },
        '-created_date',
        SIGNAL_FETCH_LIMIT,
      );
      const incoming = [...msgs]
        .filter((m) => isWebRtcSignalMessage(m) && m.sender_profile_id !== myProfileId)
        .sort(
          (a, b) =>
            new Date(a.created_date).getTime() - new Date(b.created_date).getTime(),
        );

      for (const msg of incoming) {
        await ingestSignalMessage(msg);
      }

      if (!isInitiator && !remoteDescriptionSet && lastRemoteOffer) {
        await applyOffer(lastRemoteOffer);
      }
    } catch (err) {
      reportError(err);
    }
  };

  const sendOffer = async (iceRestart = false) => {
    if (!pc || stopped || !isInitiator) return;
    if (isPeerConnected(pc)) return;

    if (pc.signalingState === 'have-local-offer' && pc.localDescription && !iceRestart) {
      await sendSignal(matchId, myProfileId, { kind: 'offer', sdp: pc.localDescription });
      return;
    }

    if (remoteDescriptionSet && !iceRestart) return;

    const offer = await pc.createOffer(iceRestart ? { iceRestart: true } : undefined);
    await pc.setLocalDescription(offer);
    await sendSignal(matchId, myProfileId, { kind: 'offer', sdp: offer });
  };

  const requestOffer = () =>
    sendSignal(matchId, myProfileId, { kind: 'need-offer', at: Date.now() }).catch(reportError);

  const announceJoin = () =>
    sendSignal(matchId, myProfileId, { kind: 'join', at: Date.now() }).catch(reportError);

  const start = async () => {
    if (typeof RTCPeerConnection === 'undefined') {
      throw new Error('WebRTC не поддерживается в этом браузере');
    }

    localStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: true,
    });

    pc = new RTCPeerConnection(ICE_SERVERS);
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = (event) => {
      const track = event.track;
      if (!track) return;
      if (!remoteMediaStream) remoteMediaStream = new MediaStream();
      const hasTrack = remoteMediaStream.getTracks().some((t) => t.id === track.id);
      if (!hasTrack) remoteMediaStream.addTrack(track);
      emitRemoteStream();
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      onConnectionState?.(state);
      if (state === 'connected') {
        emitRemoteStream();
      }
      if (state === 'failed') {
        reportError(
          new Error(
            'Связь не установилась. Оба нажмите «Начать встречу» в одном звонке (телефон + компьютер).',
          ),
        );
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        onConnectionState?.('connected');
        emitRemoteStream();
      }
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate || stopped) return;
      sendSignal(matchId, myProfileId, {
        kind: 'ice',
        candidate: event.candidate.toJSON(),
      }).catch(reportError);
    };

    try {
      unsubscribeRealtime = base44.entities.Message.subscribe((event) => {
        resolveMessageFromEvent(event)
          .then((msg) => {
            if (!msg || msg.match_id !== matchId) return;
            return ingestSignalMessage(msg);
          })
          .catch(reportError);
      });
    } catch {
      // polling fallback
    }

    await announceJoin();

    if (isInitiator) {
      await sendOffer(false);
    } else {
      await requestOffer();
    }

    const pollTimer = window.setInterval(pollSignals, 250);
    pollSignals();

    const joinTimer = window.setInterval(announceJoin, 5000);

    let renofferTimer = null;
    if (isInitiator) {
      renofferTimer = window.setInterval(() => {
        if (stopped || !pc || isPeerConnected(pc)) return;
        sendOffer(!remoteDescriptionSet).catch(() => {});
      }, 4000);
    } else {
      renofferTimer = window.setInterval(() => {
        if (stopped || !pc || isPeerConnected(pc) || remoteDescriptionSet) return;
        requestOffer();
      }, 4000);
    }

    return {
      localStream,
      isInitiator,
      stop: () => {
        stopped = true;
        window.clearInterval(pollTimer);
        window.clearInterval(joinTimer);
        if (renofferTimer) window.clearInterval(renofferTimer);
        if (typeof unsubscribeRealtime === 'function') {
          unsubscribeRealtime();
          unsubscribeRealtime = null;
        }
        if (pc) {
          pc.onicecandidate = null;
          pc.ontrack = null;
          pc.onconnectionstatechange = null;
          pc.oniceconnectionstatechange = null;
          pc.close();
          pc = null;
        }
        if (localStream) {
          localStream.getTracks().forEach((t) => t.stop());
          localStream = null;
        }
        remoteMediaStream = null;
        iceQueue.length = 0;
        remoteDescriptionSet = false;
        lastRemoteOffer = null;
      },
      setMuted: (muted) => {
        localStream?.getAudioTracks().forEach((t) => {
          t.enabled = !muted;
        });
      },
      setVideoOff: (off) => {
        localStream?.getVideoTracks().forEach((t) => {
          t.enabled = !off;
        });
      },
      reconnect: async () => {
        remoteDescriptionSet = false;
        lastRemoteOffer = null;
        iceQueue.length = 0;
        if (isInitiator) {
          await sendOffer(true);
        } else {
          await requestOffer();
        }
      },
    };
  };

  return { start };
}
