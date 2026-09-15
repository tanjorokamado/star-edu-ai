import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import CreateAppModal from "./CreateAppModal";

export default function Dashboard({ user }) {
  const [recentFiles, setRecentFiles] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "apps"),
      where("owner", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setRecentFiles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const mq = query(
      collection(db, "messages"),
      where("owner", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(mq, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const createSample = async () => {
    const ref = await addDoc(collection(db, "apps"), {
      owner: user.uid,
      name: "New App " + new Date().toLocaleString(),
      createdAt: serverTimestamp()
    });
    const link = window.location.origin + '/?app=' + ref.id;
    // update the doc with link
    try {
      await addDoc(collection(db, "messages"), {
        owner: user.uid,
        content: `Created app: ${link}`,
        createdAt: serverTimestamp()
      });
      // copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openLink = (link) => {
    if (!link) return;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="dashboard">
      <main className="main-area">
        <section className="welcome-banner">
          <h2>Welcome, {user.displayName || user.email}</h2>
          <div className="animated-ellipsis">Getting things ready<span className="dots">...</span></div>
        </section>

        <section className="recent-files">
          <div className="recent-header">
            <h3>Recently Files</h3>
            <div>
              <button onClick={() => setShowCreate(true)}>Create an app</button>
              <button onClick={createSample}>Quick Create</button>
            </div>
          </div>
          <ul>
            {recentFiles.length === 0 && <li className="empty">No files yet</li>}
            {recentFiles.map((f) => (
              <li key={f.id} className="file-row">
                <div>
                  <div className="file-name">{f.name}</div>
                  {f.link && (
                    <div>
                      <a href={f.link} target="_blank" rel="noreferrer">Open</a>
                    </div>
                  )}
                </div>
                <div className="file-date">{f.createdAt?.toDate ? f.createdAt.toDate().toLocaleString() : "-"}</div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <aside className="chat-bar">
        <div className="messages">
          {messages.length === 0 && <div className="msg from-system">StarEduAI: How can I help you today?</div>}
          {messages.map((m) => (
            <div key={m.id} className="msg">
              {m.content}
            </div>
          ))}
        </div>
        <div className="message-input">
          <input placeholder="Type a message..." />
          <button>Send</button>
        </div>
      </aside>

      {showCreate && <CreateAppModal onClose={() => setShowCreate(false)} user={user} />}
    </div>
  );
}
