import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import config from './firebase-applet-config.json' with { type: "json" };

const app = initializeApp(config);
const db = getFirestore(app);
const auth = getAuth(app);

async function test() {
  try {
    // We cannot easily test without credentials. We'll just check if it's an index error.
    console.log("We are in a node env, cannot use popupauth");
  } catch (e) {
    console.error(e);
  }
}
test();
