import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where, orderBy, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import fs from "fs";
import path from "path";

// Read Firebase applet configuration
const firebaseConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
let db: any = null;
let auth: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    const app = initializeApp(config);
    db = getFirestore(app, config.firestoreDatabaseId);
    auth = getAuth(app);
  } catch(e) {
    console.error("Firebase init failed:", e);
  }
}

// Fallback in-memory database
const memoryDb: any = {
  transactions: [],
  budgets: [],
  goals: [],
  accounts: [],
  debts: [],
  projects: [],
  clients: []
};

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, userIdOverride?: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: userIdOverride || auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  const jsonStr = JSON.stringify(errInfo);
  console.error('Firestore Error: ', jsonStr);
  throw new Error(jsonStr);
}

// Define the unified interface
export const DB = {
  async find(collectionName: string, queryConditions: any = {}) {
    if (db) {
      try {
        let q: any = collection(db, collectionName);
        const constraints: any[] = [];
        for (const [k, v] of Object.entries(queryConditions)) {
          if (k === 'date' && typeof v === 'object' && v !== null) {
            if ((v as any).$gte) constraints.push(where('date', '>=', (v as any).$gte));
            if ((v as any).$lt) constraints.push(where('date', '<', (v as any).$lt));
          } else if (k === 'user_id') {
             constraints.push(where('user_id', '==', v));
          } else {
             constraints.push(where(k, '==', v));
          }
        }
        if (constraints.length > 0) q = query(q, ...constraints);
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
      } catch (e: any) {
        if (e.message?.includes('permissions') || e.code === 'permission-denied' || String(e).includes('PERMISSION_DENIED')) {
          handleFirestoreError(e, OperationType.LIST, collectionName, queryConditions.user_id);
        }
        console.warn(`Firestore blocked ${collectionName}, falling back to memory.`, e.message);
      }
    }
    // memory fallback
    return (memoryDb[collectionName] || []).filter((item: any) => {
        for (const [k, v] of Object.entries(queryConditions)) {
           if (k === 'date' && typeof v === 'object' && v !== null) {
              const dateVal = new Date(item[k]);
              if ((v as any).$gte && dateVal < (v as any).$gte) return false;
              if ((v as any).$lt && dateVal >= (v as any).$lt) return false;
           } else if (item[k] !== v) {
              return false;
           }
        }
        return true;
    });
  },
  
  async findOne(collectionName: string, queryConditions: any) {
    const results = await this.find(collectionName, queryConditions);
    return results.length > 0 ? results[0] : null;
  },

  async insert(collectionName: string, data: any) {
    const docData = { ...data, _id: generateId(), createdAt: new Date().toISOString() };
    if (db) {
      try {
        await setDoc(doc(db, collectionName, docData._id), docData);
        return docData;
      } catch(e: any) {
        if (e.message?.includes('permissions') || e.code === 'permission-denied' || String(e).includes('PERMISSION_DENIED')) {
          handleFirestoreError(e, OperationType.WRITE, `${collectionName}/${docData._id}`, data.user_id);
        }
      }
    }
    if (!memoryDb[collectionName]) {
      memoryDb[collectionName] = [];
    }
    memoryDb[collectionName].push(docData);
    return docData;
  },

  async update(collectionName: string, id: string, data: any) {
    if (db) {
      try {
        await setDoc(doc(db, collectionName, id), data, { merge: true });
        return { _id: id, ...data };
      } catch(e: any) {
        if (e.message?.includes('permissions') || e.code === 'permission-denied' || String(e).includes('PERMISSION_DENIED')) {
          handleFirestoreError(e, OperationType.WRITE, `${collectionName}/${id}`, data.user_id);
        }
      }
    }
    if (!memoryDb[collectionName]) {
      memoryDb[collectionName] = [];
    }
    const idx = memoryDb[collectionName].findIndex((x: any) => x._id === id);
    if (idx !== -1) {
       memoryDb[collectionName][idx] = { ...memoryDb[collectionName][idx], ...data };
       return memoryDb[collectionName][idx];
    }
    return null;
  },

  async delete(collectionName: string, id: string) {
    if (db) {
      try {
        await deleteDoc(doc(db, collectionName, id));
        return true;
      } catch(e: any) {
        if (e.message?.includes('permissions') || e.code === 'permission-denied' || String(e).includes('PERMISSION_DENIED')) {
          handleFirestoreError(e, OperationType.DELETE, `${collectionName}/${id}`);
        }
      }
    }
    if (!memoryDb[collectionName]) {
      memoryDb[collectionName] = [];
    }
    const idx = memoryDb[collectionName].findIndex((x: any) => x._id === id);
    if (idx !== -1) {
       memoryDb[collectionName].splice(idx, 1);
       return true;
    }
    return false;
  },
  
  async deleteMany(collectionName: string, queryConditions: any) {
    const items = await this.find(collectionName, queryConditions);
    for (const item of items) {
       await this.delete(collectionName, item._id);
    }
  }
};
