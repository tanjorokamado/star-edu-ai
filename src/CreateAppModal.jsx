import React, { useState } from "react";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function CreateAppModal({ onClose, user }) {
  const [name, setName] = useState("");

  const create = async () => {
    if (!name.trim()) return alert("Enter a name");
    try {
      const ref = await addDoc(collection(db, "apps"), {
        owner: user.uid,
        name: name.trim(),
        createdAt: serverTimestamp()
      });
      const link = window.location.origin + '/?app=' + ref.id;
      // store link in the app document
      try {
        await updateDoc(ref, { link });
      } catch (e) {
        // updateDoc may fail if we used addDoc; fallback: add a messages record only
        console.warn("updateDoc failed", e);
      }

      // add a message so the chat shows the link automatically
      await addDoc(collection(db, "messages"), {
        owner: user.uid,
        content: `Created app: ${link}`,
        createdAt: serverTimestamp()
      });

      // copy link to clipboard for convenience
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(link);
        } catch (e) {
          // ignore clipboard failures
        }
      }

      setName("");
      onClose();
    } catch (err) {
      alert(err.message || "Failed to create app");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>Create an app</h3>
        <input placeholder="App name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="modal-actions">
          <button onClick={create}>Create</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
