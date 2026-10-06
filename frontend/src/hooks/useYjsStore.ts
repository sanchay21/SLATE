import { useEffect, useRef, useState } from 'react';
import {
  createTLStore,
  defaultShapeUtils,
} from 'tldraw';
import type {
  TLAnyShapeUtilConstructor,
  TLInstancePresence,
  TLRecord,
  TLStoreWithStatus,
} from 'tldraw';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const PRESET_COLORS = [
  '#FF4757', '#2ED573', '#1E90FF', '#FFA502', '#9B59B6',
  '#00D2D3', '#FF6B81', '#70A1FF', '#7BED9F', '#ECCC68'
];

function getRandomColor() {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
}

export function useYjsStore({
  roomId = 'default-room',
  hostUrl = 'ws://localhost:1234',
  shapeUtils = [],
  userInfo,
}: {
  roomId?: string;
  hostUrl?: string;
  shapeUtils?: TLAnyShapeUtilConstructor[];
  userInfo?: { name: string; color: string; id: string };
}) {
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: 'loading',
  });

  const userInfoRef = useRef(userInfo);
  useEffect(() => {
    userInfoRef.current = userInfo;
  }, [userInfo]);

  useEffect(() => {
    let hasSetup = false;
    const fallbackColor = getRandomColor();
    const fallbackName = `Collaborator ${Math.floor(100 + Math.random() * 900)}`;

    // 1. Setup Yjs document
    const yDoc = new Y.Doc();
    const yMap = yDoc.getMap<TLRecord>('tldraw-records');

    // 2. Connect to WebSocket provider
    const provider = new WebsocketProvider(hostUrl, roomId, yDoc);

    // 3. Create the Tldraw store
    const store = createTLStore({
      shapeUtils: [...defaultShapeUtils, ...shapeUtils],
    });

    const remotePresenceIds = new Set<string>();

    // 4. Initialize store when connected
    provider.on('status', ({ status }: { status: string }) => {
      if (status === 'connected' && !hasSetup) {
        hasSetup = true;

        // Initialize store from Yjs map
        const records = Array.from(yMap.values()).filter(Boolean);

        if (records.length > 0) {
          store.put(records);
        } else {
          // If empty, sync initial store records to Yjs
          const initialRecords = store.allRecords();
          yDoc.transact(() => {
            for (const record of initialRecords) {
              yMap.set(record.id, record);
            }
          });
        }

        setStoreWithStatus({
          store,
          status: 'synced-remote',
          connectionStatus: 'online',
        });

        // 5. Listen to local store changes and sync document to Yjs
        store.listen((entry) => {
          if (entry.source !== 'user') return; // Only sync user changes to Y.Doc

          yDoc.transact(() => {
            for (const record of Object.values(entry.changes.added)) {
              if (record.typeName !== 'instance_presence') {
                yMap.set(record.id, record);
              }
            }
            for (const [, newRecord] of Object.values(entry.changes.updated)) {
              if (newRecord.typeName !== 'instance_presence') {
                yMap.set(newRecord.id, newRecord);
              }
            }
            for (const record of Object.values(entry.changes.removed)) {
              if (record.typeName !== 'instance_presence') {
                yMap.delete(record.id);
              }
            }
          });
        });

        // 6. Listen to Yjs changes and update store
        yMap.observe((event) => {
          if (event.transaction.local) return; // Ignore our own changes

          const recordsToPut: TLRecord[] = [];
          const recordsToRemove: TLRecord['id'][] = [];

          event.changes.keys.forEach((change, key) => {
            if (change.action === 'add' || change.action === 'update') {
              const record = yMap.get(key);
              if (record) recordsToPut.push(record);
            } else if (change.action === 'delete') {
              recordsToRemove.push(key as TLRecord['id']);
            }
          });

          if (recordsToPut.length > 0) {
            store.put(recordsToPut, 'remote');
          }
          if (recordsToRemove.length > 0) {
            store.remove(recordsToRemove);
          }
        });

        // 7. Presence: Sync local presence changes to Awareness
        store.listen((entry) => {
          let hasPresenceUpdate = false;

          for (const record of Object.values(entry.changes.added)) {
            if (record.typeName === 'instance_presence' && !remotePresenceIds.has(record.id)) {
              hasPresenceUpdate = true;
              break;
            }
          }
          if (!hasPresenceUpdate) {
            for (const [, record] of Object.values(entry.changes.updated)) {
              if (record.typeName === 'instance_presence' && !remotePresenceIds.has(record.id)) {
                hasPresenceUpdate = true;
                break;
              }
            }
          }

          if (hasPresenceUpdate) {
            const presences = store.query.records('instance_presence').value;
            const localPresence = presences.find((p) => !remotePresenceIds.has(p.id));

            if (localPresence) {
              const currentInfo = userInfoRef.current;
              const name = currentInfo?.name || fallbackName;
              const color = currentInfo?.color || fallbackColor;

              const presenceToBroadcast = {
                ...localPresence,
                userName: name,
                color: color,
              };

              provider.awareness.setLocalStateField('presence', presenceToBroadcast);
            }
          }
        });

        // 8. Presence: Listen to remote awareness changes and update store
        const handleAwarenessChange = () => {
          const states = provider.awareness.getStates();
          const presencesToPut: TLInstancePresence[] = [];
          const activeRemoteIds = new Set<string>();

          states.forEach((state, clientId) => {
            if (clientId === provider.awareness.clientID) return;
            if (state.presence && state.presence.id) {
              const p = state.presence as TLInstancePresence;
              activeRemoteIds.add(p.id);
              remotePresenceIds.add(p.id);
              presencesToPut.push(p);
            }
          });

          const currentStorePresences = store.query.records('instance_presence').value;
          const presencesToRemove = currentStorePresences
            .filter((p) => remotePresenceIds.has(p.id) && !activeRemoteIds.has(p.id))
            .map((p) => p.id);

          presencesToRemove.forEach((id) => remotePresenceIds.delete(id));

          if (presencesToPut.length > 0) {
            store.put(presencesToPut, 'remote');
          }
          if (presencesToRemove.length > 0) {
            store.remove(presencesToRemove, 'remote');
          }
        };

        provider.awareness.on('change', handleAwarenessChange);
      } else if (status === 'disconnected') {
        setStoreWithStatus((prev) => ({
          ...prev,
          connectionStatus: 'offline',
        }));
      }
    });

    return () => {
      provider.disconnect();
      yDoc.destroy();
    };
  }, [roomId, hostUrl, shapeUtils]);

  return storeWithStatus;
}
