import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ projectId: 'giga-gist-18gvj' });
const db = getFirestore('ai-studio-5f0f66dc-8fd3-43b8-8a46-8cbc12361c97');
async function test() {
  try {
    await db.collection('test').get();
    console.log('Success');
  } catch (e) {
    console.error(e);
  }
}
test();
