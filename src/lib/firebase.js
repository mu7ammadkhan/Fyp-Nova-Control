// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAvOfqs7rQ-6bD-ZeFBu0tzP6vPlhung5o",
  authDomain: "fyp-home-automation-system.firebaseapp.com",
  databaseURL: "https://fyp-home-automation-system-default-rtdb.firebaseio.com",
  projectId: "fyp-home-automation-system",
  storageBucket: "fyp-home-automation-system.appspot.com",
  messagingSenderId: "920168611386",
  appId: "1:920168611386:web:cc63f865939849fa4d3f03",
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
