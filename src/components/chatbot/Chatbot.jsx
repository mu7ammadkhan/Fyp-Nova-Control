import { useState } from "react";
import { parseCommand } from "../../utils/commandParser";
import { motion, AnimatePresence } from "framer-motion";
import { FaCommentDots, FaMicrophone, FaPaperPlane } from "react-icons/fa";

export default function Chatbot({ devices = [], uid }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const send = () => {
    const t = text.trim();
    if (!t) return;
    parseCommand(t, devices, uid);
    setText("");
  };

  const startVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();

    // Prefer Pakistan English; fallback works fine
    recognition.lang = "en-PK";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      const spoken = e.results?.[0]?.[0]?.transcript || "";
      if (spoken.trim()) {
        parseCommand(spoken, devices, uid);
        setText("");
      }
    };

    recognition.onerror = () => {
      alert("Voice recognition failed. Try again.");
    };

    recognition.start();
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.9 }}
        className="chatbot-button"
      >
        <FaCommentDots size={24} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="chatbot-panel"
          >
            <div className="header">Nova Assistant</div>

            <div className="commands">
              Try: <br />
              “Main light on” <br />
              “All lights off” <br />
              “Fan band”
            </div>

            <div className="input-row">
              <input
                className="form-control"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type command…"
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button className="btn btn-primary" onClick={send}>
                <FaPaperPlane />
              </button>
              <button className="btn btn-secondary" onClick={startVoice}>
                <FaMicrophone />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
