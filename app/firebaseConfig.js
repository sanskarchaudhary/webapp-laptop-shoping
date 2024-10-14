
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyD6VqBgebj0bSsluFTDLarMPA1FMoimNOM",
  authDomain: "laptop-82612.firebaseapp.com",
  projectId: "laptop-82612",
  storageBucket: "laptop-82612.appspot.com",
  messagingSenderId: "452320341006",
  appId: "1:452320341006:web:caeece44b7568ab486a05f",
  measurementId: "G-VP49R9R3FC",
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default {db};