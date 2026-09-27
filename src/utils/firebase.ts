import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  getDocFromServer,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Card, OnlineChatMessage, OnlineRoomData } from '../types/game';
import { createDeck, shuffleDeck, dealInitialTableCards, dealCardsToPlayers } from './cardDeck';
import { calculateEatResult } from './basraLogic';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot as mandated by skill
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'rooms', '_test_connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline check:', error.message);
    }
  }
}

// Generate a clean Egyptian coffee-shop styled 6-character room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create an online room
export async function createOnlineRoom(params: {
  hostId: string;
  hostName: string;
  hostAvatar: string;
  hostFrameId?: string;
  targetScore: number;
  jackBasraValue?: 10 | 20;
}): Promise<string> {
  const roomId = generateRoomCode();
  const path = `rooms/${roomId}`;

  try {
    // 1. Prepare initial 52 cards deck
    const freshDeck = shuffleDeck(createDeck());
    const { tableCards, remainingDeck: deckAfterTable } = dealInitialTableCards(freshDeck);
    const { hands, remainingDeck } = dealCardsToPlayers(deckAfterTable, 2, 4);

    const roomData: OnlineRoomData = {
      roomId,
      hostId: params.hostId,
      hostName: params.hostName,
      hostAvatar: params.hostAvatar,
      hostFrameId: params.hostFrameId || 'frame_royal_blue',
      status: 'waiting',
      currentTurn: params.hostId, // Host starts first deal
      targetScore: params.targetScore || 101,
      tableCards,
      deck: remainingDeck,
      hostHand: hands[0],
      guestHand: hands[1],
      hostCapturedCards: [],
      guestCapturedCards: [],
      hostBasras: 0,
      guestBasras: 0,
      hostScore: 0,
      guestScore: 0,
      lastAction: null,
      lastEaterId: undefined,
      chatMessages: [
        {
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: 'القهوجي',
          text: `تم فتح ترابيزة المعلمين #${roomId}.. في انتظار انضمام الخصم! ☕`,
          timestamp: Date.now(),
        },
      ],
      roundNumber: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'rooms', roomId), roomData);
    return roomId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// Join an online room
export async function joinOnlineRoom(
  roomId: string,
  guest: {
    guestId: string;
    guestName: string;
    guestAvatar: string;
    guestFrameId?: string;
  }
): Promise<OnlineRoomData> {
  const cleanId = roomId.trim().toUpperCase();
  const path = `rooms/${cleanId}`;

  try {
    const roomRef = doc(db, 'rooms', cleanId);
    const snap = await getDoc(roomRef);

    if (!snap.exists()) {
      throw new Error('لم يتم العثور على ترابيزة بهذا الكود. تأكد من صحة الرابط أو الرمز.');
    }

    const data = snap.data() as OnlineRoomData;

    // Check if player is already the host or guest
    if (data.hostId === guest.guestId) {
      return data;
    }
    if (data.guestId && data.guestId === guest.guestId) {
      return data;
    }

    if (data.status !== 'waiting' && data.guestId && data.guestId !== guest.guestId) {
      throw new Error('عفواً، هذه الترابيزة مكتملة بالفعل وبها ٢ لاعبين.');
    }

    // Join room as guest and set status to playing
    const joinMessage: OnlineChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'system',
      senderName: 'القهوجي',
      text: `دخل المعلم ${guest.guestName} إلى الترابيزة! يلا سموا الله وابدأوا اللعب 🃏`,
      timestamp: Date.now(),
    };

    const updates: Partial<OnlineRoomData> = {
      guestId: guest.guestId,
      guestName: guest.guestName,
      guestAvatar: guest.guestAvatar,
      guestFrameId: guest.guestFrameId || 'frame_royal_blue',
      status: 'playing',
      chatMessages: [...(data.chatMessages || []), joinMessage],
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(roomRef, updates);
    return { ...data, ...updates } as OnlineRoomData;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// Subscribe to room updates in real-time
export function subscribeToRoom(
  roomId: string,
  onUpdate: (room: OnlineRoomData) => void,
  onError?: (err: Error) => void
) {
  const path = `rooms/${roomId}`;
  const roomRef = doc(db, 'rooms', roomId);

  return onSnapshot(
    roomRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as OnlineRoomData);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
      if (onError) onError(err);
    }
  );
}

// Play a card in an online match
export async function playOnlineCard(
  room: OnlineRoomData,
  playerId: string,
  card: Card,
  jackBasraValue: 10 | 20 = 20
) {
  const path = `rooms/${room.roomId}`;
  const roomRef = doc(db, 'rooms', room.roomId);

  const isHost = playerId === room.hostId;
  const isGuest = playerId === room.guestId;
  if (!isHost && !isGuest) return;

  // Verify turn
  if (room.currentTurn !== playerId) {
    return;
  }

  // 1. Remove card from player hand
  let newHostHand = [...room.hostHand];
  let newGuestHand = [...room.guestHand];

  if (isHost) {
    newHostHand = newHostHand.filter((c) => c.id !== card.id);
  } else {
    newGuestHand = newGuestHand.filter((c) => c.id !== card.id);
  }

  // 2. Evaluate eat result
  const eatResult = calculateEatResult(card, room.tableCards, jackBasraValue);

  let newTableCards = [...room.tableCards];
  let newHostCaptured = [...room.hostCapturedCards];
  let newGuestCaptured = [...room.guestCapturedCards];
  let newHostBasras = room.hostBasras;
  let newGuestBasras = room.guestBasras;
  let newLastEater = room.lastEaterId;

  if (eatResult.eatenCards.length > 0) {
    // Player eats
    const allCaptured = [card, ...eatResult.eatenCards];
    const eatenIds = new Set(eatResult.eatenCards.map((c) => c.id));
    newTableCards = newTableCards.filter((c) => !eatenIds.has(c.id));

    if (isHost) {
      newHostCaptured = [...newHostCaptured, ...allCaptured];
      if (eatResult.isBasra) newHostBasras += 1;
    } else {
      newGuestCaptured = [...newGuestCaptured, ...allCaptured];
      if (eatResult.isBasra) newGuestBasras += 1;
    }
    newLastEater = playerId;
  } else {
    // Card placed on table
    newTableCards.push(card);
  }

  // Next turn
  const nextTurn = isHost ? room.guestId! : room.hostId;

  // Check if both hands are empty -> deal 4 cards each from deck
  let newDeck = [...room.deck];
  let currentHostScore = room.hostScore;
  let currentGuestScore = room.guestScore;
  let newRoundNumber = room.roundNumber;
  let roomStatus = room.status;
  let winnerId = room.winnerId;

  const bothHandsEmpty = newHostHand.length === 0 && newGuestHand.length === 0;

  if (bothHandsEmpty) {
    if (newDeck.length >= 8) {
      // Deal 4 cards each
      const deal = dealCardsToPlayers(newDeck, 2, 4);
      newHostHand = deal.hands[0];
      newGuestHand = deal.hands[1];
      newDeck = deal.remainingDeck;
    } else {
      // END OF COKKA / ROUND!
      // Any remaining cards on table go to the last player who captured cards
      if (newTableCards.length > 0 && newLastEater) {
        if (newLastEater === room.hostId) {
          newHostCaptured = [...newHostCaptured, ...newTableCards];
        } else {
          newGuestCaptured = [...newGuestCaptured, ...newTableCards];
        }
        newTableCards = [];
      }

      // Calculate Round Points:
      // 1. Majority of cards (>26): +30 points
      let hostRoundPts = 0;
      let guestRoundPts = 0;

      if (newHostCaptured.length > 26) {
        hostRoundPts += 30;
      } else if (newGuestCaptured.length > 26) {
        guestRoundPts += 30;
      }

      // 2. Basras: 10 points each (or jack basra value)
      // Note: basras are scored
      hostRoundPts += newHostBasras * 10;
      guestRoundPts += newGuestBasras * 10;

      currentHostScore += hostRoundPts;
      currentGuestScore += guestRoundPts;

      // Check win condition
      if (currentHostScore >= room.targetScore || currentGuestScore >= room.targetScore) {
        roomStatus = 'completed';
        winnerId = currentHostScore >= currentGuestScore ? room.hostId : room.guestId;
      } else {
        // Start next round
        newRoundNumber += 1;
        const freshDeck = shuffleDeck(createDeck());
        const { tableCards: roundTable, remainingDeck: deckAfterTable } = dealInitialTableCards(freshDeck);
        const { hands, remainingDeck } = dealCardsToPlayers(deckAfterTable, 2, 4);
        newTableCards = roundTable;
        newHostHand = hands[0];
        newGuestHand = hands[1];
        newDeck = remainingDeck;
        newHostCaptured = [];
        newGuestCaptured = [];
        newHostBasras = 0;
        newGuestBasras = 0;
        newLastEater = undefined;
      }
    }
  }

  const playerName = isHost ? room.hostName : (room.guestName || 'الخصم');
  const actionSummary = {
    playerId,
    playerName,
    card,
    eatCount: eatResult.eatenCards.length,
    isBasra: eatResult.isBasra,
    isJackBasra: eatResult.isJackBasra,
    basraPoints: eatResult.basraPoints,
    reason: eatResult.reason,
    timestamp: Date.now(),
  };

  const updates: Partial<OnlineRoomData> = {
    hostHand: newHostHand,
    guestHand: newGuestHand,
    tableCards: newTableCards,
    deck: newDeck,
    hostCapturedCards: newHostCaptured,
    guestCapturedCards: newGuestCaptured,
    hostBasras: newHostBasras,
    guestBasras: newGuestBasras,
    hostScore: currentHostScore,
    guestScore: currentGuestScore,
    currentTurn: nextTurn,
    lastAction: actionSummary,
    lastEaterId: newLastEater,
    status: roomStatus,
    winnerId,
    roundNumber: newRoundNumber,
    updatedAt: new Date().toISOString(),
  };

  try {
    await updateDoc(roomRef, updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Send in-room chat message or emote
export async function sendOnlineChatMessage(
  roomId: string,
  message: {
    senderId: string;
    senderName: string;
    text: string;
    isEmote?: boolean;
  }
) {
  const path = `rooms/${roomId}`;
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;
    const data = snap.data() as OnlineRoomData;

    const newMsg: OnlineChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      senderId: message.senderId,
      senderName: message.senderName,
      text: message.text,
      isEmote: message.isEmote,
      timestamp: Date.now(),
    };

    // Keep last 30 messages
    const existing = data.chatMessages || [];
    const chatMessages = [...existing, newMsg].slice(-30);

    await updateDoc(roomRef, {
      chatMessages,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Rematch in same room
export async function restartOnlineMatch(roomId: string, targetScore: number = 101) {
  const path = `rooms/${roomId}`;
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const freshDeck = shuffleDeck(createDeck());
    const { tableCards, remainingDeck: deckAfterTable } = dealInitialTableCards(freshDeck);
    const { hands, remainingDeck } = dealCardsToPlayers(deckAfterTable, 2, 4);

    await updateDoc(roomRef, {
      status: 'playing',
      tableCards,
      deck: remainingDeck,
      hostHand: hands[0],
      guestHand: hands[1],
      hostCapturedCards: [],
      guestCapturedCards: [],
      hostBasras: 0,
      guestBasras: 0,
      hostScore: 0,
      guestScore: 0,
      winnerId: undefined,
      lastAction: null,
      roundNumber: 1,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Leave / forfeit room
export async function leaveOnlineRoom(roomId: string, playerId: string) {
  const path = `rooms/${roomId}`;
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;
    const data = snap.data() as OnlineRoomData;

    const leaveMsg: OnlineChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'system',
      senderName: 'القهوجي',
      text: `انسحب أحد اللاعبين من الترابيزة.`,
      timestamp: Date.now(),
    };

    await updateDoc(roomRef, {
      status: 'abandoned',
      chatMessages: [...(data.chatMessages || []), leaveMsg],
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/* ============================================================
   AUTHENTICATION & USER PROFILE MANAGEMENT
   ============================================================ */

export interface AppUserData {
  userId: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
  frameId: string;
  coins: number;
  matchesPlayed: number;
  matchesWon: number;
  totalBasras: number;
  highestMatchScore: number;
  updatedAt: string;
  createdAt: string;
}

// Convert user-entered identifier (e.g. "hassan_99" or "hassan@gmail.com") into a valid Firebase Auth email
export function normalizeLoginIdentifier(identifier: string): string {
  const trimmed = identifier.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  // Sanitize username into valid email local part
  const safePart = trimmed.replace(/[^a-z0-9_.-]/g, '') || 'player';
  return `${safePart}@ahwa-basra.com`;
}

// Extract display username
export function extractUsername(emailOrUsername: string): string {
  if (emailOrUsername.endsWith('@ahwa-basra.com')) {
    return emailOrUsername.replace('@ahwa-basra.com', '');
  }
  return emailOrUsername.split('@')[0];
}

// Password hashing helper for cloud accounts
function hashPassword(pwd: string): string {
  let hash = 5381;
  for (let i = 0; i < pwd.length; i++) {
    hash = ((hash << 5) + hash) + pwd.charCodeAt(i);
  }
  return `h_${Math.abs(hash)}_${pwd.length}`;
}

const LOCAL_AUTH_STORAGE_KEY = 'basra_active_cloud_user';
const authListeners: Array<(userData: AppUserData | null) => void> = [];

function notifyAuthListeners(userData: AppUserData | null) {
  authListeners.forEach(listener => {
    try {
      listener(userData);
    } catch (e) {
      console.warn('Listener error:', e);
    }
  });
}

// Sign up new player with username/email and password
export async function signUpPlayer(params: {
  usernameOrEmail: string;
  password: string;
  name: string;
  avatar: string;
  frameId?: string;
  initialCoins?: number;
}): Promise<AppUserData> {
  const email = normalizeLoginIdentifier(params.usernameOrEmail);
  const rawUsername = extractUsername(params.usernameOrEmail).toLowerCase().trim();
  const displayName = params.name.trim() || rawUsername;
  const initialCoins = params.initialCoins ?? 200;

  // First, check if username already taken in Firestore
  try {
    const usersCol = collection(db, 'users');
    const existingQ = query(usersCol, where('username', '==', rawUsername), limit(1));
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      throw new Error('email-already-in-use');
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'email-already-in-use') {
      throw err;
    }
  }

  // Try standard Firebase Auth first, but gracefully catch operation-not-allowed
  let firebaseUid: string = `user_${rawUsername.replace(/[^a-z0-9_]/g, '') || Date.now()}`;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, params.password);
    firebaseUid = cred.user.uid;
    await updateProfile(cred.user, {
      displayName,
      photoURL: params.avatar,
    });
  } catch (err: unknown) {
    const errStr = String(err);
    if (
      errStr.includes('operation-not-allowed') ||
      errStr.includes('admin-restricted') ||
      errStr.includes('auth/configuration-not-found')
    ) {
      console.warn('Firebase Email sign-in disabled in console; using resilient Firestore cloud account.');
    } else {
      throw err;
    }
  }

  const userData: AppUserData = {
    userId: firebaseUid,
    username: rawUsername,
    email,
    name: displayName,
    avatar: params.avatar,
    frameId: params.frameId || 'frame_royal_blue',
    coins: initialCoins,
    matchesPlayed: 0,
    matchesWon: 0,
    totalBasras: 0,
    highestMatchScore: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const userDocRef = doc(db, 'users', firebaseUid);
  await setDoc(userDocRef, {
    ...userData,
    passwordHash: hashPassword(params.password),
  });

  try {
    localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(userData));
  } catch {}

  notifyAuthListeners(userData);
  return userData;
}

// Sign in existing player with username or email and password
export async function signInPlayer(identifier: string, password: string): Promise<AppUserData> {
  const email = normalizeLoginIdentifier(identifier);
  const rawUsername = extractUsername(identifier).toLowerCase().trim();

  // Try standard Firebase Auth
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userDocRef = doc(db, 'users', cred.user.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as AppUserData;
      try {
        localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(data));
      } catch {}
      notifyAuthListeners(data);
      return data;
    }
  } catch (err: unknown) {
    const errStr = String(err);
    if (
      !errStr.includes('operation-not-allowed') &&
      !errStr.includes('admin-restricted') &&
      !errStr.includes('user-not-found') &&
      !errStr.includes('invalid-credential')
    ) {
      throw err;
    }
  }

  // Look up in Firestore by username or email
  const usersCol = collection(db, 'users');
  let userSnap = await getDocs(query(usersCol, where('username', '==', rawUsername), limit(1)));
  if (userSnap.empty && identifier.includes('@')) {
    userSnap = await getDocs(query(usersCol, where('email', '==', email), limit(1)));
  }

  if (userSnap.empty) {
    throw new Error('user-not-found');
  }

  const docData = userSnap.docs[0].data();
  const targetPasswordHash = hashPassword(password);

  if (docData.passwordHash && docData.passwordHash !== targetPasswordHash) {
    throw new Error('wrong-password');
  }

  const userData: AppUserData = {
    userId: docData.userId || userSnap.docs[0].id,
    username: docData.username || rawUsername,
    email: docData.email || email,
    name: docData.name || rawUsername,
    avatar: docData.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    frameId: docData.frameId || 'frame_royal_blue',
    coins: docData.coins ?? 150,
    matchesPlayed: docData.matchesPlayed ?? 0,
    matchesWon: docData.matchesWon ?? 0,
    totalBasras: docData.totalBasras ?? 0,
    highestMatchScore: docData.highestMatchScore ?? 0,
    createdAt: docData.createdAt || new Date().toISOString(),
    updatedAt: docData.updatedAt || new Date().toISOString(),
  };

  try {
    localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(userData));
  } catch {}

  notifyAuthListeners(userData);
  return userData;
}

// Sign out current player
export async function signOutPlayer(): Promise<void> {
  try {
    await signOut(auth);
  } catch {}
  try {
    localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
  } catch {}
  notifyAuthListeners(null);
}

// Listen to auth state and fetch user doc
export function subscribeToAuth(
  callback: (user: FirebaseUser | null, userData: AppUserData | null) => void
): () => void {
  const listener = (userData: AppUserData | null) => {
    callback(auth.currentUser, userData);
  };
  authListeners.push(listener);

  // Check existing session in localStorage
  try {
    const saved = localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AppUserData;
      callback(auth.currentUser, parsed);
      // Asynchronously refresh from Firestore to get newest stats
      getDoc(doc(db, 'users', parsed.userId))
        .then((snap) => {
          if (snap.exists()) {
            const fresh = snap.data() as AppUserData;
            try {
              localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(fresh));
            } catch {}
            callback(auth.currentUser, fresh);
          }
        })
        .catch(() => {});
    }
  } catch {}

  // Also hook Firebase native listener
  const unsubscribeNative = onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const uData = snap.data() as AppUserData;
          try {
            localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(uData));
          } catch {}
          callback(user, uData);
          return;
        }
      } catch (e) {
        console.warn('Could not fetch user profile on auth change:', e);
      }
    }
  });

  return () => {
    const idx = authListeners.indexOf(listener);
    if (idx !== -1) authListeners.splice(idx, 1);
    unsubscribeNative();
  };
}

// Update user stats in Firestore
export async function updateUserStatsInFirestore(
  userId: string,
  updates: Partial<AppUserData>
): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/* ============================================================
   REAL-TIME FIRESTORE LEADERBOARDS
   ============================================================ */

export async function fetchRealLeaderboardsFromFirestore(
  category: 'wins' | 'basras' | 'coins',
  maxCount = 25
): Promise<AppUserData[]> {
  const path = 'users';
  const scoreField =
    category === 'wins' ? 'matchesWon' : category === 'basras' ? 'totalBasras' : 'coins';

  try {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, orderBy(scoreField, 'desc'), limit(maxCount));
    const snapshot = await getDocs(q);

    const players: AppUserData[] = [];
    snapshot.forEach((docSnap) => {
      players.push(docSnap.data() as AppUserData);
    });

    return players;
  } catch (err) {
    console.warn('Leaderboard fetch note (falling back to local/cached if index building):', err);
    // Return empty array so caller can gracefully blend or fallback
    return [];
  }
}

