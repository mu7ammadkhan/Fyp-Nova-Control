import { useState } from "react";
import { parseCommand } from "../../utils/commandParser";
import { motion, AnimatePresence } from "framer-motion";
import { FaCommentDots, FaMicrophone, FaPaperPlane } from "react-icons/fa";

export default function Chatbot({ devices, uid }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    parseCommand(text, devices, uid);
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
    recognition.lang = "en-US";

    recognition.onresult = (e) => {
      const spoken = e.results[0][0].transcript;
      parseCommand(spoken, devices, uid);
    };

    recognition.start();
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.9 }}
        className="chatbot-button"
      >
        <FaCommentDots size={24} />
      </motion.button>

      {/* Chat Panel */}
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
              Try commands: <br />
              “Light on” <br />
              “Fan off”
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
